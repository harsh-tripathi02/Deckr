import "./ProgressBar.css"

function ProgressBar({ status, processingStage }) {
  const getProgressPercentage = () => {
    switch (status) {
      case "processing":
        return 50
      case "completed":
        return 100
      case "error":
        return 100
      default:
        return 0
    }
  }

  const getProgressClass = () => {
    switch (status) {
      case "completed":
        return "progress-success"
      case "error":
        return "progress-error"
      default:
        return ""
    }
  }

  const getCurrentStep = () => {
    if (status === "completed") return 3
    if (status === "error") return 3

    if (processingStage && processingStage.includes("Downloading")) return 1
    if (processingStage && processingStage.includes("Extracting")) return 2

    return 1
  }

  const currentStep = getCurrentStep()

  return (
    <div>
      <div className="progress-container">
        <div className={`progress-bar ${getProgressClass()}`} style={{ width: `${getProgressPercentage()}%` }}>
          {status === "processing" && <div className="progress-animation"></div>}
        </div>
      </div>

      <div className="progress-steps">
        <div className={`progress-step ${currentStep >= 1 ? "completed" : ""} ${currentStep === 1 ? "active" : ""}`}>
          <div className="step-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {currentStep > 1 ? (
                <polyline points="20 6 9 17 4 12"></polyline>
              ) : (
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"></path>
              )}
            </svg>
          </div>
          <div className="step-label">Downloading</div>
        </div>

        <div className={`progress-step ${currentStep >= 2 ? "completed" : ""} ${currentStep === 2 ? "active" : ""}`}>
          <div className="step-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {currentStep > 2 ? (
                <polyline points="20 6 9 17 4 12"></polyline>
              ) : (
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              )}
            </svg>
          </div>
          <div className="step-label">Extracting</div>
        </div>

        <div className={`progress-step ${currentStep >= 3 ? "completed" : ""} ${currentStep === 3 ? "active" : ""}`}>
          <div className="step-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {status === "completed" ? (
                <polyline points="20 6 9 17 4 12"></polyline>
              ) : (
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
              )}
            </svg>
          </div>
          <div className="step-label">Completed</div>
        </div>
      </div>

      <div className="progress-mobile-step">
        {processingStage || (status === "completed" ? "Extraction completed!" : "Processing...")}
      </div>
    </div>
  )
}

export default ProgressBar
