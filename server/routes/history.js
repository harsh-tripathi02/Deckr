const express = require("express")
const router = express.Router()
const historyController = require("../controllers/historyController")

// Route to get extraction history
router.get("/history", historyController.getHistory)

// Route to get a specific extraction by ID
router.get("/history/:id", historyController.getExtractionById)

module.exports = router
