const express = require("express")
const router = express.Router()
const extractionController = require("../controllers/extractionController")

// Route to start a new extraction
router.post("/extract", extractionController.startExtraction)

// Route to check the status of an extraction
router.get("/status/:jobId", extractionController.getExtractionStatus)

// Route to generate a PDF from extracted slides
router.post("/generate-pdf/:jobId", extractionController.generatePdf)

// Route to get video info for preview
router.get("/video-info", extractionController.getVideoInfo)

module.exports = router
