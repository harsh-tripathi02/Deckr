const path = require("path")
const fs = require("fs")
const Extraction = require("../models/Extraction")
const { v4: uuidv4 } = require("uuid")
const { getVideoInfo } = require("../utils/youtubeUtils")
const { extractSlidesFromYoutube } = require("../utils/slideExtractor")
const { generatePdfFromSlides } = require("../utils/pdfGenerator")

// Start a new extraction
exports.startExtraction = async (req, res) => {
  try {
    const { url } = req.body

    if (!url) {
      return res.status(400).json({ success: false, message: "YouTube URL is required" })
    }

    // Create a unique job ID
    const jobId = uuidv4()
    const slidesDir = path.join(__dirname, "../uploads/slides", jobId)

    if (!fs.existsSync(slidesDir)) {
      fs.mkdirSync(slidesDir, { recursive: true })
    }

    // Get video info (title, etc.)
    const videoInfo = await getVideoInfo(url)

    // Determine optimal interval based on video duration
    // For shorter videos, use smaller intervals; for longer videos, use larger intervals
    let interval = 5 // default
    if (videoInfo.duration) {
      if (videoInfo.duration < 300) {
        // Less than 5 minutes
        interval = 3
      } else if (videoInfo.duration > 1800) {
        // More than 30 minutes
        interval = 10
      }
    }

    // Create a new extraction record in the database
    const extraction = new Extraction({
      _id: jobId,
      videoUrl: url,
      videoTitle: videoInfo.title || "Unknown Title",
      status: "processing",
      interval: interval,
      threshold: 0.75, // Default threshold that works well for most videos
      processingStage: "Initializing...",
    })

    await extraction.save()

    // Start the extraction process in the background
    extractionProcess(jobId, url, interval, 0.75)

    // Return the job ID to the client
    return res.json({ success: true, jobId })
  } catch (error) {
    console.error("Error starting extraction:", error)
    return res.status(500).json({ success: false, message: "Server error" })
  }
}

// Background extraction process
async function extractionProcess(jobId, url, interval, threshold) {
  try {
    const uploadsDir = path.join(__dirname, "../uploads")
    const slidesDir = path.join(uploadsDir, "slides")

    // Update processing stage
    await Extraction.findByIdAndUpdate(jobId, { processingStage: "Downloading video..." })

    // Extract slides from the video
    await extractSlidesFromYoutube(url, slidesDir, jobId, interval, threshold)

    // Get the list of extracted slides
    const jobDir = path.join(slidesDir, jobId)
    const slides = fs
      .readdirSync(jobDir)
      .filter((file) => file.endsWith(".png") && file.startsWith("slide_"))
      .sort()

    // Update processing stage
    await Extraction.findByIdAndUpdate(jobId, { processingStage: "Generating PDF..." })

    // Generate PDF automatically
    const pdfFilename = `${jobId}.pdf`
    const pdfPath = path.join(uploadsDir, "pdfs", pdfFilename)
    await generatePdfFromSlides(jobDir, pdfPath)

    // After PDF generation, clean up slides directory
    if (fs.existsSync(jobDir)) {
      fs.rmSync(jobDir, { recursive: true, force: true })
    }
    // Also clean up the generated PDF after a longer delay (e.g., 1 hour)
    setTimeout(() => {
      if (fs.existsSync(pdfPath)) {
        fs.rmSync(pdfPath, { force: true })
        console.log(`Deleted PDF: ${pdfPath}`)
      }
    }, 60 * 60 * 1000) // 1 hour

    // Update the extraction record
    await Extraction.findByIdAndUpdate(jobId, {
      status: "completed",
      slideCount: slides.length,
      completedAt: new Date(),
      pdfUrl: `/api/pdfs/${pdfFilename}`,
      processingStage: "Completed",
    })
  } catch (error) {
    console.error("Error in extraction process:", error)

    // Update the extraction record with error status
    await Extraction.findByIdAndUpdate(jobId, {
      status: "error",
      completedAt: new Date(),
      processingStage: "Error occurred",
    })
  }
}

// Get the status of an extraction
exports.getExtractionStatus = async (req, res) => {
  try {
    const { jobId } = req.params

    const extraction = await Extraction.findById(jobId)

    if (!extraction) {
      return res.status(404).json({ success: false, message: "Extraction not found" })
    }

    // If the extraction is completed, get the list of slides
    let slides = []
    if (extraction.status === "completed" || extraction.status === "processing") {
      const jobDir = path.join(__dirname, "../uploads/slides", jobId)

      if (fs.existsSync(jobDir)) {
        slides = fs
          .readdirSync(jobDir)
          .filter((file) => file.endsWith(".png") && file.startsWith("slide_"))
          .map((file) => `${jobId}/${file}`)
          .sort()
      }
    }

    return res.json({
      success: true,
      status: extraction.status,
      videoTitle: extraction.videoTitle,
      videoUrl: extraction.videoUrl,
      slideCount: extraction.slideCount || slides.length,
      slides,
      pdfUrl: extraction.pdfUrl,
      processingStage: extraction.processingStage,
    })
  } catch (error) {
    console.error("Error getting extraction status:", error)
    return res.status(500).json({ success: false, message: "Server error" })
  }
}

// Generate a PDF from extracted slides
exports.generatePdf = async (req, res) => {
  try {
    const { jobId } = req.params

    const extraction = await Extraction.findById(jobId)

    if (!extraction) {
      return res.status(404).json({ success: false, message: "Extraction not found" })
    }

    if (extraction.status !== "completed") {
      return res.status(400).json({ success: false, message: "Extraction is not completed yet" })
    }

    // If PDF already exists, return it
    if (extraction.pdfUrl) {
      return res.json({ success: true, pdfUrl: extraction.pdfUrl })
    }

    const jobDir = path.join(__dirname, "../uploads/slides", jobId)
    const pdfFilename = `${jobId}.pdf`
    const pdfPath = path.join(__dirname, "../uploads/pdfs", pdfFilename)

    // Generate PDF
    await generatePdfFromSlides(jobDir, pdfPath)

    // Update the extraction record with the PDF URL
    const pdfUrl = `/api/pdfs/${pdfFilename}`
    await Extraction.findByIdAndUpdate(jobId, { pdfUrl })

    return res.json({ success: true, pdfUrl })
  } catch (error) {
    console.error("Error generating PDF:", error)
    return res.status(500).json({ success: false, message: "Server error" })
  }
}

// Get video info for preview
exports.getVideoInfo = async (req, res) => {
  try {
    const { url } = req.query

    if (!url) {
      return res.status(400).json({ success: false, message: "YouTube URL is required" })
    }

    const videoInfo = await getVideoInfo(url)

    return res.json({
      success: true,
      videoInfo,
    })
  } catch (error) {
    console.error("Error getting video info:", error)
    return res.status(500).json({ success: false, message: "Server error" })
  }
}
