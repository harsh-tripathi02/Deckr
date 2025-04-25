"use client"

import { useState, useEffect } from "react"
import { apiFetch } from "../api";
import "./ExtractForm.css"

function ExtractForm({ onSubmit, disabled }) {
  const [url, setUrl] = useState("")
  const [videoInfo, setVideoInfo] = useState(null)
  const [isValidUrl, setIsValidUrl] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Check if URL is a valid YouTube URL
  useEffect(() => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/
    setIsValidUrl(youtubeRegex.test(url))

    // Reset video info when URL changes
    if (videoInfo) {
      setVideoInfo(null)
    }

    // Debounce fetching video info
    const timer = setTimeout(() => {
      if (youtubeRegex.test(url)) {
        fetchVideoInfo()
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [url])

  const fetchVideoInfo = async () => {
    try {
      setIsLoading(true)
      const response = await apiFetch(`/api/video-info?url=${encodeURIComponent(url)}`)
      const data = await response.json()

      if (data.success) {
        setVideoInfo(data.videoInfo)
      }
    } catch (error) {
      console.error("Error fetching video info:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!url.trim() || !isValidUrl) {
      alert("Please enter a valid YouTube URL")
      return
    }

    onSubmit({ url })
  }

  return (
    <div className="extract-form">
      <h2>Extract Slides from YouTube</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="url">YouTube URL</label>
          <div className="input-wrapper">
            <svg
              className="input-icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
              <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
            </svg>
            <input
              type="text"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              disabled={disabled}
              required
            />
          </div>
        </div>

        {videoInfo && (
          <div className="video-preview">
            <div className="video-thumbnail">
              <img src={videoInfo.thumbnail || "/placeholder.svg"} alt={videoInfo.title} />
            </div>
            <div className="video-info">
              <h3 className="video-title">{videoInfo.title}</h3>
              <p className="video-channel">{videoInfo.author}</p>
            </div>
          </div>
        )}

        <button type="submit" className="submit-button" disabled={disabled || !isValidUrl}>
          {disabled ? (
            <>
              <span className="loading-spinner"></span>
              Processing...
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
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Extract Slides
            </>
          )}
        </button>
      </form>

      <div className="form-info">
        <p>
          <svg
            className="form-info-icon"
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
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          Just paste the YouTube URL and we'll automatically extract the slides for you!
        </p>
      </div>
    </div>
  )
}

export default ExtractForm
