"use client"

import { useState } from "react"
import "./SlideViewer.css"

function SlideViewer({ slides }) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)

  const goToNextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? prev : prev + 1))
  }

  const goToPrevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? prev : prev - 1))
  }

  const toggleFullscreen = () => {
    setFullscreen(!fullscreen)
  }

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setFullscreen(false)
    } else if (e.key === "ArrowRight") {
      goToNextSlide()
    } else if (e.key === "ArrowLeft") {
      goToPrevSlide()
    }
  }

  if (!slides || slides.length === 0) {
    return null
  }

  return (
    <div className="slide-viewer">
      <h2>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
          <line x1="7" y1="2" x2="7" y2="22"></line>
          <line x1="17" y1="2" x2="17" y2="22"></line>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <line x1="2" y1="7" x2="7" y2="7"></line>
          <line x1="2" y1="17" x2="7" y2="17"></line>
          <line x1="17" y1="17" x2="22" y2="17"></line>
          <line x1="17" y1="7" x2="22" y2="7"></line>
        </svg>
        Extracted Slides ({slides.length})
      </h2>

      <div className="slide-container">
        <button className="slide-nav prev" onClick={goToPrevSlide} disabled={currentSlide === 0}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        <div className="slide">
          <img src={`/api/slides/${slides[currentSlide]}`} alt={`Slide ${currentSlide + 1}`} />
          <div className="slide-counter">
            {currentSlide + 1} / {slides.length}
          </div>
          <button className="fullscreen-button" onClick={toggleFullscreen}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
            </svg>
          </button>
        </div>

        <button className="slide-nav next" onClick={goToNextSlide} disabled={currentSlide === slides.length - 1}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>

      <div className="slide-thumbnails">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`thumbnail ${index === currentSlide ? "active" : ""}`}
            onClick={() => setCurrentSlide(index)}
          >
            <img src={`/api/slides/${slide}?thumbnail=true`} alt={`Thumbnail ${index + 1}`} />
          </div>
        ))}
      </div>

      {fullscreen && (
        <div className="fullscreen-overlay" onClick={toggleFullscreen} onKeyDown={handleKeyDown} tabIndex={0}>
          <img
            src={`/api/slides/${slides[currentSlide]}`}
            alt={`Slide ${currentSlide + 1}`}
            className="fullscreen-image"
            onClick={(e) => e.stopPropagation()}
          />
          <button className="fullscreen-close" onClick={toggleFullscreen}>
            &times;
          </button>
          <button
            className="fullscreen-nav prev"
            onClick={(e) => {
              e.stopPropagation()
              goToPrevSlide()
            }}
            disabled={currentSlide === 0}
          >
            &lt;
          </button>
          <button
            className="fullscreen-nav next"
            onClick={(e) => {
              e.stopPropagation()
              goToNextSlide()
            }}
            disabled={currentSlide === slides.length - 1}
          >
            &gt;
          </button>
          <div className="fullscreen-counter">
            {currentSlide + 1} / {slides.length}
          </div>
        </div>
      )}
    </div>
  )
}

export default SlideViewer
