const sharp = require("sharp")
const pixelmatch = require("pixelmatch")
const { PNG } = require("pngjs")
const fs = require("fs")

exports.compareImages = async (image1Path, image2Path) => {
  try {
    if (!fs.existsSync(image1Path) || !fs.existsSync(image2Path)) {
      return null
    }

    const size = { width: 100, height: 75 } // Lower resolution to catch layout changes

    // Common processing pipeline
    const preprocessImage = async (imagePath) => {
      const buffer = await sharp(imagePath)
        .resize(size.width, size.height, { fit: "fill" })
        .grayscale()
        .blur(1.5) // Helps ignore small text/animation changes
        .png()
        .toBuffer()
      return PNG.sync.read(buffer)
    }

    const img1 = await preprocessImage(image1Path)
    const img2 = await preprocessImage(image2Path)

    const diff = new PNG({ width: size.width, height: size.height })
    const numDiffPixels = pixelmatch(img1.data, img2.data, diff.data, size.width, size.height, {
      threshold: 0.2, // More lenient
    })

    const similarity = 1 - numDiffPixels / (size.width * size.height)
    return similarity
  } catch (error) {
    console.error("Error comparing images:", error)
    return null
  }
}
