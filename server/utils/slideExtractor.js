const fs = require("fs")
const path = require("path")
const ffmpeg = require("fluent-ffmpeg")
const sharp = require("sharp")
const { createWorker } = require("tesseract.js")
const { compareImages } = require("./imageComparison")
const { downloadVideo } = require("./youtubeUtils")

// Main function to extract slides from a YouTube video
exports.extractSlidesFromYoutube = async (videoUrl, outputDir, jobId, interval = 5, threshold = 0.85) => {
  try {
    // Create directories if they don't exist
    const slidesDir = path.join(outputDir, jobId)
    const tempDir = path.join(outputDir, "temp")
    const videoPath = path.join(tempDir, `${jobId}.mp4`)

    if (!fs.existsSync(slidesDir)) {
      fs.mkdirSync(slidesDir, { recursive: true })
    }

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    // Download the video
    await downloadVideo(videoUrl, videoPath)

    // Extract slides from the video
    const slides = await extractSlides(videoPath, slidesDir, interval, threshold)

    // Clean up the temporary video file
    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath)
    }

    return slides
  } catch (error) {
    console.error("Error extracting slides:", error)
    throw error
  }
}

// Extract slides from a video
async function extractSlides(videoPath, outputDir, interval = 5, threshold = 0.85) {
  return new Promise(async (resolve, reject) => {
    try {
      // Get video duration
      const duration = await getVideoDuration(videoPath)
      console.log(`Video duration: ${duration} seconds`)

      // Calculate frame timestamps
      const frameTimestamps = []
      for (let i = 0; i < duration; i += interval) {
        frameTimestamps.push(i)
      }

      // Extract frames
      const frames = await extractFrames(videoPath, frameTimestamps, outputDir)
      console.log(`Extracted ${frames.length} frames`)

      // Filter frames to find slides
      const slides = await filterSlides(frames, outputDir, threshold)
      console.log(`Identified ${slides.length} unique slides`)

      resolve(slides)
    } catch (error) {
      reject(error)
    }
  })
}

// Get video duration using ffmpeg
function getVideoDuration(videoPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err)
        return
      }
      resolve(metadata.format.duration)
    })
  })
}

// Extract frames at specific timestamps
function extractFrames(videoPath, timestamps, outputDir) {
  return new Promise((resolve, reject) => {
    const frames = []
    let completedFrames = 0

    timestamps.forEach((timestamp, index) => {
      const outputPath = path.join(outputDir, `frame_${index}.png`)

      ffmpeg(videoPath)
        .screenshots({
          timestamps: [timestamp],
          filename: `frame_${index}.png`,
          folder: outputDir,
          size: "1280x720",
        })
        .on("end", () => {
          // Only add frame if file exists
          if (fs.existsSync(outputPath)) {
            frames.push({
              path: outputPath,
              timestamp,
              index,
            })
          } else {
            console.error(`Frame file missing: ${outputPath}`)
          }
          completedFrames++
          if (completedFrames === timestamps.length) {
            // Filter out frames whose files do not exist before returning
            resolve(frames.filter(f => fs.existsSync(f.path)))
          }
        })
        .on("error", (err) => {
          console.error(`Error extracting frame at ${timestamp}:`, err)
          completedFrames++
          if (completedFrames === timestamps.length) {
            // Filter out frames whose files do not exist before returning
            resolve(frames.filter(f => fs.existsSync(f.path)))
          }
        })
    })
  })
}

// Filter frames to find unique slides
async function filterSlides(frames, outputDir, threshold) {
  const slides = []
  // No need for tesseract worker or image comparison
  frames.sort((a, b) => a.index - b.index)
  let slideCount = 0
  for (const frame of frames) {
    if (!fs.existsSync(frame.path)) {
      continue
    }
    const slidePath = path.join(outputDir, `slide_${String(slideCount).padStart(3, "0")}.png`)
    fs.copyFileSync(frame.path, slidePath)
    slides.push(slidePath)
    slideCount++
    // Clean up the frame file
    if (fs.existsSync(frame.path)) {
      fs.unlinkSync(frame.path)
    }
  }
  return slides
}
