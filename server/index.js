const express = require("express")
const mongoose = require("mongoose")
const path = require("path")
const cors = require("cors")
const dotenv = require("dotenv")
const fs = require("fs")

// Load environment variables
dotenv.config()

// Import routes
const extractionRoutes = require("./routes/extraction")
const historyRoutes = require("./routes/history")

// Create Express app
const app = express()

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Create upload directories if they don't exist
const uploadsDir = path.join(__dirname, "uploads")
const slidesDir = path.join(uploadsDir, "slides")
const pdfsDir = path.join(uploadsDir, "pdfs")
const tempDir = path.join(uploadsDir, "temp")

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir)
}
if (!fs.existsSync(slidesDir)) {
  fs.mkdirSync(slidesDir)
}
if (!fs.existsSync(pdfsDir)) {
  fs.mkdirSync(pdfsDir)
}
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir)
}

// Serve static files from the slides directory
app.use("/api/slides", express.static(path.join(__dirname, "uploads/slides")))
app.use("/api/pdfs", express.static(path.join(__dirname, "uploads/pdfs")))

// API routes
app.use("/api", extractionRoutes)
app.use("/api", historyRoutes)

// Serve static files from the React app in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/build")))

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/build", "index.html"))
  })
}

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/slide-extractor", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB")
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err)
  })

// Start server
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
