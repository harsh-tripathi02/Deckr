const Extraction = require("../models/Extraction")

// Get extraction history
exports.getHistory = async (req, res) => {
  try {
    const history = await Extraction.find().sort({ createdAt: -1 }).limit(20)

    return res.json({ success: true, history })
  } catch (error) {
    console.error("Error getting history:", error)
    return res.status(500).json({ success: false, message: "Server error" })
  }
}

// Get a specific extraction by ID
exports.getExtractionById = async (req, res) => {
  try {
    const { id } = req.params

    const extraction = await Extraction.findById(id)

    if (!extraction) {
      return res.status(404).json({ success: false, message: "Extraction not found" })
    }

    return res.json({ success: true, extraction })
  } catch (error) {
    console.error("Error getting extraction:", error)
    return res.status(500).json({ success: false, message: "Server error" })
  }
}
