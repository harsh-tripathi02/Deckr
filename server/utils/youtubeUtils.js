const youtubedl = require("youtube-dl-exec")
const fs = require("fs")

// Get video information
exports.getVideoInfo = async (url) => {
  try {
    const info = await youtubedl(url, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      youtubeSkipDashManifest: true,
    })
    return {
      title: info.title,
      duration: Number.parseInt(info.duration),
      author: info.uploader,
      thumbnail: info.thumbnail || null,
    }
  } catch (error) {
    console.error("Error getting video info:", error)
    return { title: "Unknown Title" }
  }
}

// Download video
exports.downloadVideo = (url, outputPath) => {
  // youtube-dl-exec returns a promise
  return youtubedl(url, {
    output: outputPath,
    format: "mp4",
  })
}
