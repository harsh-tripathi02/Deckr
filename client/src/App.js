"use client"

import { useState, useEffect } from "react"
import "./App.css"
import Header from "./components/Header"
import ExtractForm from "./components/ExtractForm"
import ProgressBar from "./components/ProgressBar"
import SlideViewer from "./components/SlideViewer"
import HistoryList from "./components/HistoryList"
import Footer from "./components/Footer"
import { apiFetch, API_BASE_URL } from "./api"

function App() {
  const [currentJob, setCurrentJob] = useState(null)
  const [jobStatus, setJobStatus] = useState("idle")
  const [slides, setSlides] = useState([])
  const [history, setHistory] = useState([])
  const [activeTab, setActiveTab] = useState("extract")
  const [processingStage, setProcessingStage] = useState("")
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [pdfUrl, setPdfUrl] = useState(null)

  // Fetch extraction history on component mount
  useEffect(() => {
    fetchHistory()
  }, [])

  // Fetch history from the server
  const fetchHistory = async () => {
    try {
      const response = await apiFetch("/api/history")
      const data = await response.json()
      if (data.success) {
        setHistory(data.history)
      }
    } catch (error) {
      console.error("Error fetching history:", error)
    }
  }

  // Start a new extraction job
  const startExtraction = async (formData) => {
    setJobStatus("processing")
    setProcessingStage("Downloading video...")
    setSlides([])

    try {
      const response = await apiFetch("/api/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        setCurrentJob(data.jobId)
        checkJobStatus(data.jobId)
      } else {
        setJobStatus("error")
        alert(data.message || "Failed to start extraction")
      }
    } catch (error) {
      console.error("Error starting extraction:", error)
      setJobStatus("error")
    }
  }

  // Check the status of a job
  const checkJobStatus = async (jobId) => {
    try {
      const response = await apiFetch(`/api/status/${jobId}`)
      const data = await response.json()

      setJobStatus(data.status)

      if (data.processingStage) {
        setProcessingStage(data.processingStage)
      }

      if (data.status === "completed") {
        setSlides(data.slides || [])
        fetchHistory()
        // Set pdfUrl as soon as it's available from backend
        if (data.pdfUrl) {
          setPdfUrl(data.pdfUrl)
        }
      } else if (data.status === "processing") {
        // Poll for updates every 2 seconds
        setTimeout(() => checkJobStatus(jobId), 2000)
      }
    } catch (error) {
      console.error("Error checking job status:", error)
      setJobStatus("error")
    }
  }

  // Utility function to download PDF as a file
  const downloadPdf = async (pdfUrl, filename = "slides.pdf") => {
    const response = await apiFetch(pdfUrl)
    const blob = await response.blob()
    const link = document.createElement("a")
    link.href = window.URL.createObjectURL(blob)
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Generate PDF from slides
  const generatePdf = async () => {
    if (!currentJob) return

    try {
      setIsGeneratingPdf(true)
      setProcessingStage("Generating PDF...")

      const response = await apiFetch(`/api/generate-pdf/${currentJob}`, {
        method: "POST",
      })

      const data = await response.json()

      if (data.success) {
        setPdfUrl(data.pdfUrl)
        await downloadPdf(data.pdfUrl, `${currentJob}.pdf`)
        fetchHistory()
      } else {
        alert(data.message || "Failed to generate PDF")
      }

      setProcessingStage("")
      setIsGeneratingPdf(false)
    } catch (error) {
      console.error("Error generating PDF:", error)
      setProcessingStage("")
      setIsGeneratingPdf(false)
    }
  }

  // View a previous extraction
  const viewExtraction = async (jobId) => {
    try {
      const response = await apiFetch(`/api/status/${jobId}`)
      const data = await response.json()

      if (data.success) {
        setCurrentJob(jobId)
        setSlides(data.slides || [])
        setJobStatus("completed")
        setActiveTab("extract")
      }
    } catch (error) {
      console.error("Error viewing extraction:", error)
    }
  }

  return (
    <div className="app">
      <Header />

      <div className="tabs">
        <button className={activeTab === "extract" ? "active" : ""} onClick={() => setActiveTab("extract")}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Extract Slides
        </button>
        <button className={activeTab === "history" ? "active" : ""} onClick={() => setActiveTab("history")}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1-18 0z"></path>
          </svg>
          History
        </button>
      </div>

      <main className="content">
        {activeTab === "extract" ? (
          <>
            <ExtractForm onSubmit={startExtraction} disabled={jobStatus === "processing"} />

            {jobStatus !== "idle" && (
              <div className="status-container">
                <h2>Extraction Status</h2>
                <ProgressBar status={jobStatus} processingStage={processingStage} />
                <p className="status-text">
                  {jobStatus === "processing" &&
                    (processingStage || "Processing your video. This may take a few minutes...")}
                  {jobStatus === "completed" && "Extraction completed successfully!"}
                  {jobStatus === "error" && "An error occurred during extraction."}
                </p>

                {jobStatus === "completed" && pdfUrl && (
                  <button className="pdf-button" onClick={() => window.open(`${API_BASE_URL}${pdfUrl}`, '_blank')} style={{marginRight: 8}}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="12" y1="18" x2="12" y2="12"></line>
                      <line x1="9" y1="15" x2="15" y2="15"></line>
                    </svg>
                    Preview PDF
                  </button>
                )}

                {jobStatus === "completed" && (
                  <button className="pdf-button" onClick={generatePdf} disabled={isGeneratingPdf}>
                    {isGeneratingPdf ? (
                      <>
                        <span className="loading-spinner"></span>
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="12" y1="18" x2="12" y2="12"></line>
                          <line x1="9" y1="15" x2="15" y2="15"></line>
                        </svg>
                        Generate PDF
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {slides.length > 0 && <SlideViewer slides={slides} />}
          </>
        ) : (
          <HistoryList history={history} onViewExtraction={viewExtraction} />
        )}
      </main>

      <Footer />
    </div>
  )
}

export default App
