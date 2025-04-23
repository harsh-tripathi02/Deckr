const mongoose = require("mongoose")

const ExtractionSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  videoUrl: {
    type: String,
    required: true,
  },
  videoTitle: {
    type: String,
    default: "Unknown Title",
  },
  status: {
    type: String,
    enum: ["processing", "completed", "error"],
    default: "processing",
  },
  interval: {
    type: Number,
    default: 5,
  },
  threshold: {
    type: Number,
    default: 0.85,
  },
  slideCount: {
    type: Number,
    default: 0,
  },
  pdfUrl: {
    type: String,
    default: null,
  },
  processingStage: {
    type: String,
    default: "Initializing...",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
    default: null,
  },
})

module.exports = mongoose.model("Extraction", ExtractionSchema)
