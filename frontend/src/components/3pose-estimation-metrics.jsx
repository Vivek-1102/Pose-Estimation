"use client"

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import {
  Upload,
  ChevronLeft,
  ChevronRight,
  Check,
  Send,
  Loader2,
  RefreshCw,
  UploadCloud,
  Eye,
  EyeOff,
  Download,
  FileDown,
  Moon,
  Sun,
  ZoomIn,
  ZoomOut,
  Info,
  X,
  ArrowLeft,
  ArrowRight,
  FileCheck,
  Activity,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import axios from "axios"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"

// Constants
const API_ENDPOINT = "http://localhost:5000/analyze-metrics"
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

// Data
const metrics = [
  {
    name: "Ankle Dorsiflexion",
    description: "Measure the upward bending motion of the foot at the ankle joint.",
    instructions:
      "Stand sideways next to a wall. Bend your knee towards the wall without lifting your heel. Capture a side view of your lower leg and foot.",
    normalRange: "10-20°",
    fieldName: "ankle",
  },
  {
    name: "Knee Flexion Extension",
    description: "Assess the bending and straightening motion of the knee joint.",
    instructions:
      "Stand sideways. Perform a partial squat, then fully extend your leg. Capture a side view of your entire leg during this motion.",
    normalRange: "0-135°",
    fieldName: "knee",
  },
  {
    name: "Hip Flexion",
    description: "Evaluate the forward and upward movement of the thigh at the hip joint.",
    instructions:
      "Stand sideways. Lift your knee towards your chest as high as comfortable. Capture a side view of your hip and thigh.",
    normalRange: "0-120°",
    fieldName: "hipFlexion",
  },
  {
    name: "Hip Internal/External Rotation",
    description: "Measure the inward and outward rotation of the thigh at the hip joint.",
    instructions:
      "Sit on a chair with your knee bent at 90 degrees. Rotate your thigh inward, then outward. Capture a front view of your legs during this motion.",
    normalRange: "Internal: 30-40°, External: 40-60°",
    fieldName: "hipRotation",
  },
  {
    name: "Thigh Foot Angle",
    description: "Assess the angle between the thigh and foot during standing or walking.",
    instructions:
      "Stand naturally or walk a few steps. Capture a front view of your legs and feet while standing or mid-stride.",
    normalRange: "5-15°",
    fieldName: "popliteal",
  },
  {
    name: "Foot Progression",
    description: "Evaluate the angle of the foot relative to the direction of movement during walking.",
    instructions: "Walk naturally for a few steps. Capture a top-down view of your feet during mid-stride.",
    normalRange: "5-18°",
    fieldName: "footProgression",
  },
]

// Create a mapping from metric name to field name
const fieldNameMapping = Object.fromEntries(metrics.map((metric) => [metric.name, metric.fieldName]))

// Helper functions
const isWithinNormalRange = (angle, normalRange) => {
  if (!angle || !normalRange) return false

  // Parse ranges like "10-20°" or "Internal: 30-40°, External: 40-60°"
  const ranges = normalRange.split(",").map((r) => r.trim())

  for (const range of ranges) {
    const numbers = range.match(/\d+/g)
    if (numbers && numbers.length >= 2) {
      const min = Number.parseInt(numbers[0])
      const max = Number.parseInt(numbers[1])
      if (angle >= min && angle <= max) return true
    }
  }

  return false
}

const generateInsights = (results, metrics) => {
  if (!results) return "No data available for analysis."

  const insights = []
  let abnormalCount = 0

  metrics.forEach((metric) => {
    const fieldName = metric.fieldName
    const result = results[fieldName]

    if (result && result.angle !== null) {
      if (!isWithinNormalRange(result.angle, metric.normalRange)) {
        abnormalCount++
        insights.push(
          `${metric.name} measurement (${result.angle.toFixed(1)}°) is outside the normal range (${metric.normalRange}).`,
        )
      }
    }
  })

  if (insights.length === 0) {
    return "All measurements appear to be within normal ranges. Continue with your current exercise regimen."
  } else if (insights.length <= 2) {
    return `${insights.join(" ")} Consider consulting with a healthcare professional for further evaluation.`
  } else {
    return `Multiple measurements (${abnormalCount}) are outside normal ranges: ${insights.join(" ")} It is recommended to consult with a healthcare professional for a comprehensive evaluation.`
  }
}

// Custom tooltip component
const CustomTooltip = ({ children, content, position = "top" }) => {
  const [isVisible, setIsVisible] = useState(false)

  const positions = {
    top: "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 transform -translate-x-1/2 mt-2",
    left: "right-full top-1/2 transform -translate-y-1/2 mr-2",
    right: "left-full top-1/2 transform -translate-y-1/2 ml-2",
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onClick={() => setIsVisible(!isVisible)}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute z-50 ${positions[position]} bg-gray-800 dark:bg-gray-700 text-white text-sm rounded-md px-3 py-2 w-max max-w-xs shadow-lg`}
        >
          {content}
          <div
            className={`absolute ${
              position === "top"
                ? "top-full left-1/2 transform -translate-x-1/2 border-t-gray-800 dark:border-t-gray-700"
                : position === "bottom"
                  ? "bottom-full left-1/2 transform -translate-x-1/2 border-b-gray-800 dark:border-b-gray-700"
                  : position === "left"
                    ? "left-full top-1/2 transform -translate-y-1/2 border-l-gray-800 dark:border-l-gray-700"
                    : "right-full top-1/2 transform -translate-y-1/2 border-r-gray-800 dark:border-r-gray-700"
            } border-solid border-8 border-transparent`}
          ></div>
        </div>
      )}
    </div>
  )
}

// Image viewer component
const ImageViewer = ({ src, alt, onClose }) => {
  const [scale, setScale] = useState(1)

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3))
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5))

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="absolute top-4 right-4 flex space-x-2">
        <button
          onClick={handleZoomIn}
          className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-colors"
        >
          <ZoomIn className="w-6 h-6" />
        </button>
        <button
          onClick={handleZoomOut}
          className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-colors"
        >
          <ZoomOut className="w-6 h-6" />
        </button>
        <button
          onClick={onClose}
          className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="overflow-auto max-w-full max-h-full">
        <img
          src={src || "/placeholder.svg"}
          alt={alt}
          className="transform transition-transform duration-200 ease-in-out"
          style={{ transform: `scale(${scale})`, imageOrientation: "from-image" }}
        />
      </div>
    </div>
  )
}

// Progress indicator component
const ProgressIndicator = ({ currentStep, totalSteps, completedSteps, onStepClick }) => {
  return (
    <div className="w-full mb-8">
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {completedSteps}/{totalSteps} completed
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
        <div
          className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
        ></div>
      </div>
      <div className="relative mt-1">
        <div className="absolute inset-0 flex">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div key={index} className="flex-1 flex justify-center">
              <button
                onClick={() => onStepClick(index)}
                className={`w-4 h-4 rounded-full transition-colors ${
                  index < completedSteps
                    ? "bg-blue-600 dark:bg-blue-500"
                    : index === currentStep
                      ? "border-2 border-blue-600 dark:border-blue-500 bg-white dark:bg-gray-800"
                      : "bg-gray-300 dark:bg-gray-600"
                }`}
                aria-label={`Go to step ${index + 1}`}
              ></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Comparison view component
const ComparisonView = ({ originalImage, processedImage, onClose }) => {
  const [position, setPosition] = useState(50)

  const handleMove = (e) => {
    const container = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - container.left
    const newPosition = (x / container.width) * 100
    setPosition(Math.max(0, Math.min(100, newPosition)))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="absolute top-4 right-4">
        <button
          onClick={onClose}
          className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="max-w-4xl w-full">
        <h3 className="text-white text-xl mb-4 text-center">Original vs. Processed Image</h3>
        <div
          className="relative w-full h-[70vh] overflow-hidden rounded-lg cursor-col-resize"
          onMouseMove={handleMove}
          onClick={handleMove}
        >
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={processedImage || "/placeholder.svg"}
              alt="Processed"
              className="absolute inset-0 w-full h-full object-contain"
              style={{ imageOrientation: "from-image" }}
            />
          </div>
          <div className="absolute inset-0 overflow-hidden" style={{ width: `${position}%` }}>
            <img
              src={originalImage || "/placeholder.svg"}
              alt="Original"
              className="absolute inset-0 w-full h-full object-contain"
              style={{ imageOrientation: "from-image" }}
            />
          </div>
          <div className="absolute inset-y-0 w-1 bg-white cursor-col-resize" style={{ left: `${position}%` }}>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <ArrowLeft className="w-3 h-3 text-gray-800" />
              <ArrowRight className="w-3 h-3 text-gray-800" />
            </div>
          </div>
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-md">
            Original
          </div>
          <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-md">
            Processed
          </div>
        </div>
      </div>
    </div>
  )
}

// Metric card component
const MetricCard = ({
  metric,
  onUpload,
  uploadedImage,
  isActive,
  estimatedAngle = null,
  estimatedImage = null,
  showEstimated,
  disabled = false,
  hasResults = false,
}) => {
  const fileInputRef = useRef(null)
  const [imageError, setImageError] = useState(null)
  const [isZoomed, setIsZoomed] = useState(false)
  const [showComparison, setShowComparison] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)

  const handleFileChange = async (event) => {
    const file = event.target.files[0]
    if (file) {
      // Check file size (max 10MB)
      if (file.size > MAX_FILE_SIZE) {
        setImageError("Image size exceeds 10MB limit")
        return
      }

      setImageError(null)
      onUpload(metric.name, file)
    }
  }

  const displayImage = showEstimated && estimatedImage ? estimatedImage : uploadedImage
  const hasImage = !!uploadedImage
  const canCompare = uploadedImage && estimatedImage && !hasResults

  return (
    <motion.div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden relative ${isActive ? "ring-2 ring-blue-500 dark:ring-blue-400" : ""}`}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.5 }}
    >
      <div className="p-4 sm:p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{metric.name}</h3>
          <CustomTooltip content="View capture instructions" position="left">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
              aria-label="Toggle instructions"
            >
              <Info className="w-5 h-5" />
            </button>
          </CustomTooltip>
        </div>

        <p className="text-gray-600 dark:text-gray-300 mb-4">{metric.description}</p>

        <AnimatePresence>
          {showInstructions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md mb-4 overflow-hidden"
            >
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">How to capture this metric:</h4>
              <p className="text-gray-700 dark:text-gray-300">{metric.instructions}</p>
              <p className="text-gray-700 dark:text-gray-300 mt-2">
                <span className="font-semibold">Normal Range:</span> {metric.normalRange}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {hasImage ? (
          <div className="relative mb-4">
            <div
              className="aspect-video w-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden cursor-pointer"
              onClick={() => setIsZoomed(true)}
            >
              <img
                src={displayImage || "/placeholder.svg"}
                alt={metric.name}
                className="w-full h-full object-contain"
                style={{ imageOrientation: "from-image" }}
              />
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                Click to zoom
              </div>
            </div>

            <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
              <Check className="w-4 h-4" />
            </div>

            {estimatedAngle !== null && (
              <div className="absolute bottom-2 left-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md px-2 py-1 shadow-md">
                Estimated Angle: {estimatedAngle}°
              </div>
            )}

            {canCompare && (
              <button
                onClick={() => setShowComparison(true)}
                className="absolute top-2 left-2 bg-purple-600 dark:bg-purple-700 text-white rounded-md px-2 py-1 text-xs flex items-center shadow-md transition-colors hover:bg-purple-700 dark:hover:bg-purple-800"
              >
                <Eye className="w-3 h-3 mr-1" />
                Compare
              </button>
            )}
          </div>
        ) : (
          <div className="aspect-video bg-gray-200 dark:bg-gray-700 flex flex-col items-center justify-center rounded-md mb-4 p-4">
            <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-2" />
            <p className="text-gray-500 dark:text-gray-400 text-center">No image uploaded</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm text-center mt-1">
              Click the button below to upload
            </p>
          </div>
        )}

        {imageError && (
          <div className="text-red-500 text-sm mb-2 bg-red-100 dark:bg-red-900 dark:text-red-200 p-2 rounded">
            {imageError}
          </div>
        )}
      </div>

      <div className="px-4 sm:px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <button
          className={`w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-bold py-2 px-4 rounded flex items-center justify-center transition-colors ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={() => !disabled && fileInputRef.current.click()}
          disabled={disabled}
        >
          <Upload className="w-4 h-4 mr-2" />
          {hasImage ? "Replace Image" : "Upload Image"}
        </button>
        <input
          type="file"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          disabled={disabled}
        />
      </div>

      {isZoomed && (
        <ImageViewer src={displayImage || "/placeholder.svg"} alt={metric.name} onClose={() => setIsZoomed(false)} />
      )}

      {showComparison && (
        <ComparisonView
          originalImage={uploadedImage}
          processedImage={estimatedImage}
          onClose={() => setShowComparison(false)}
        />
      )}
    </motion.div>
  )
}

// Loading component
const PoseEstimationLoader = () => {
  const didYouKnowFacts = [
    "Pose estimation can detect up to 33 key points on the human body.",
    "Clinical gait analysis using pose estimation can help identify movement disorders.",
    "Proper joint angle measurement can help prevent injuries during rehabilitation.",
    "Pose estimation technology is used in sports medicine to optimize athletic performance.",
    "Regular monitoring of joint angles can track progress in physical therapy treatments.",
    "AI-powered pose estimation can analyze movement patterns with high precision.",
    "Pose estimation helps clinicians make more objective assessments of patient mobility.",
    "The technology can detect subtle changes in movement that might be missed by the human eye.",
  ]

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-70 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl flex flex-col items-center max-w-md w-full">
        <div className="relative w-32 h-32 mb-6">
          {/* Skeleton outline */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
            <g className="text-blue-500 dark:text-blue-400">
              <circle cx="50" cy="15" r="5" className="fill-current animate-pulse" />
              <circle cx="50" cy="50" r="6" className="fill-current animate-pulse" style={{ animationDelay: "0.2s" }} />
              <circle cx="50" cy="85" r="5" className="fill-current animate-pulse" style={{ animationDelay: "0.4s" }} />
              <circle cx="15" cy="50" r="5" className="fill-current animate-pulse" style={{ animationDelay: "0.6s" }} />
              <circle cx="85" cy="50" r="5" className="fill-current animate-pulse" style={{ animationDelay: "0.8s" }} />

              {/* Dotted lines connecting the points */}
              <line x1="50" y1="15" x2="50" y2="50" className="stroke-current stroke-2" strokeDasharray="4 4" />
              <line x1="50" y1="50" x2="50" y2="85" className="stroke-current stroke-2" strokeDasharray="4 4" />
              <line x1="15" y1="50" x2="50" y2="50" className="stroke-current stroke-2" strokeDasharray="4 4" />
              <line x1="50" y1="50" x2="85" y2="50" className="stroke-current stroke-2" strokeDasharray="4 4" />
            </g>
          </svg>

          {/* Rotating circle animation */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Analyzing Pose Data</h2>
        <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
          Please wait while our AI processes your images...
        </p>

        <div className="w-full bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
          <h3 className="text-blue-700 dark:text-blue-300 font-medium mb-2">Did you know?</h3>
          <div className="space-y-3 text-gray-700 dark:text-gray-300">
            {didYouKnowFacts.map((fact, index) => (
              <p key={index} className="animate-pulse" style={{ animationDelay: `${index * 3}s` }}>
                {fact}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Side selector component
const SideSelector = ({ selectedSide, onSelectSide, disabled }) => (
  <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md mb-6">
    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Select Side for Analysis</h3>
    <p className="text-gray-600 dark:text-gray-300 mb-4">
      Please select which side of your body you are analyzing. This is important for accurate pose estimation.
    </p>
    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
      <button
        className={`flex-1 py-3 px-4 rounded-lg border-2 flex items-center justify-center transition-colors ${
          selectedSide === "left"
            ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-900 dark:bg-opacity-30 dark:text-blue-300"
            : "border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        onClick={() => !disabled && onSelectSide("left")}
        disabled={disabled}
      >
        <span className="font-medium">Left Side</span>
      </button>
      <button
        className={`flex-1 py-3 px-4 rounded-lg border-2 flex items-center justify-center transition-colors ${
          selectedSide === "right"
            ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-900 dark:bg-opacity-30 dark:text-blue-300"
            : "border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        onClick={() => !disabled && onSelectSide("right")}
        disabled={disabled}
      >
        <span className="font-medium">Right Side</span>
      </button>
    </div>
  </div>
)

// PDF Report component
const PdfReport = ({ patientInfo, results, metrics, selectedSide, onClose }) => {
  const reportRef = useRef(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [patientName, setPatientName] = useState("")
  const [patientId, setPatientId] = useState("")
  const [clinicianName, setClinicianName] = useState("")

  const generatePDF = async () => {
    if (!reportRef.current) return

    setIsGenerating(true)
    try {
      const pdf = new jsPDF("p", "mm", "a4")
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
      })

      const imgData = canvas.toDataURL("image/png")
      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight)
      pdf.save(`Clinical_Pose_Estimation_Report_${selectedSide}_${new Date().toISOString().split("T")[0]}.pdf`)
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Failed to generate PDF. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  // Count abnormal measurements
  const abnormalCount = useMemo(() => {
    if (!results) return 0

    return metrics.reduce((count, metric) => {
      const result = results[metric.fieldName]
      if (result && result.angle !== null && !isWithinNormalRange(result.angle, metric.normalRange)) {
        return count + 1
      }
      return count
    }, 0)
  }, [results, metrics])

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-90 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Clinical Pose Estimation Report</h2>
          <div className="flex space-x-2">
            <button
              onClick={generatePDF}
              disabled={isGenerating}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white py-2 px-4 rounded-lg flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Download className="w-5 h-5 mr-2" />}
              {isGenerating ? "Generating..." : "Download PDF"}
            </button>
            <button
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Patient Information Form */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Patient Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Patient Name</label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Enter patient name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Patient ID</label>
              <input
                type="text"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                placeholder="Enter patient ID"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Clinician Name</label>
              <input
                type="text"
                value={clinicianName}
                onChange={(e) => setClinicianName(e.target.value)}
                placeholder="Enter clinician name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="p-6" ref={reportRef}>
          {/* Report Header */}
          <div className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between">
            <div className="mb-4 md:mb-0">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Clinical Pose Estimation Report</h1>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
              </p>
            </div>
            <div className="flex items-center justify-center bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 p-3 rounded-lg">
              <FileCheck className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-2" />
              <div>
                <p className="font-semibold text-blue-700 dark:text-blue-300">Analysis ID</p>
                <p className="text-blue-800 dark:text-blue-200">
                  {Math.random().toString(36).substring(2, 10).toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          {/* Patient Information Display */}
          <div className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h4 className="text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                  Patient Details
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Name:</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {patientName || "Not specified"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">ID:</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">{patientId || "Not specified"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Clinician:</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {clinicianName || "Not specified"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h4 className="text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                  Assessment Summary
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Date:</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {new Date().toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Side Analyzed:</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {selectedSide.charAt(0).toUpperCase() + selectedSide.slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Abnormal Findings:</span>
                    <span
                      className={`font-medium ${abnormalCount > 0 ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400"}`}
                    >
                      {abnormalCount} of {metrics.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pose Estimation Results */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Pose Estimation Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {metrics.map((metric) => {
                const result = results && results[metric.fieldName]
                const isNormal =
                  result && result.angle !== null && isWithinNormalRange(result.angle, metric.normalRange)

                return (
                  <div
                    key={metric.name}
                    className={`border ${isNormal ? "border-green-200 dark:border-green-800" : "border-yellow-200 dark:border-yellow-800"} rounded-lg overflow-hidden`}
                  >
                    <div
                      className={`${isNormal ? "bg-green-50 dark:bg-green-900 dark:bg-opacity-20" : "bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20"} p-3 border-b ${isNormal ? "border-green-200 dark:border-green-800" : "border-yellow-200 dark:border-yellow-800"}`}
                    >
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold text-gray-800 dark:text-white">{metric.name}</h4>
                        {result && result.angle !== null && (
                          <div
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              isNormal
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:bg-opacity-50 dark:text-green-300"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:bg-opacity-50 dark:text-yellow-300"
                            }`}
                          >
                            {isNormal ? "Normal" : "Attention"}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      {result && result.image ? (
                        <div className="aspect-video w-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden mb-3">
                          <img
                            src={result.image || "/placeholder.svg"}
                            alt={metric.name}
                            className="w-full h-full object-contain"
                            style={{ imageOrientation: "from-image" }}
                          />
                        </div>
                      ) : (
                        <div className="aspect-video w-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-md mb-3">
                          <p className="text-gray-500 dark:text-gray-400">No image available</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
                          <p className="text-gray-700 dark:text-gray-300 text-sm mb-1">Measured Angle</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {result && result.angle !== null ? `${result.angle.toFixed(1)}°` : "N/A"}
                          </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
                          <p className="text-gray-700 dark:text-gray-300 text-sm mb-1">Normal Range</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">{metric.normalRange}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Observations & Insights */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Observations & Insights</h3>
            <div className="bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                This report provides an automated analysis of joint angles based on pose estimation technology. The
                results should be interpreted by a qualified healthcare professional.
              </p>
              <div className="border-l-4 border-blue-500 dark:border-blue-400 pl-4 py-1">
                <p className="text-gray-700 dark:text-gray-300 italic">{generateInsights(results, metrics)}</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row justify-between">
              <div>
                <p>Generated using Clinical Pose Estimation System</p>
                <p>This report is for informational purposes only and does not constitute medical advice.</p>
              </div>
              <div className="mt-2 md:mt-0 text-right">
                <p>Page 1 of 1</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main component
export default function PoseEstimationMetrics() {
  // State
  const [uploadedImages, setUploadedImages] = useState({})
  const [uploadedFiles, setUploadedFiles] = useState({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState(null)
  const [showEstimated, setShowEstimated] = useState(false)
  const [selectedSide, setSelectedSide] = useState(null)
  const [showReport, setShowReport] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [patientInfo, setPatientInfo] = useState({
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString(),
  })

  // Derived state
  const allImagesUploaded = useMemo(() => metrics.every((metric) => uploadedImages[metric.name]), [uploadedImages])
  const sideSelected = selectedSide !== null
  const canUpload = sideSelected
  const canSubmit = allImagesUploaded && sideSelected
  const completedSteps = Object.keys(uploadedImages).length

  // Dark mode handling
  useEffect(() => {
    // Check for system preference
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches

    // Set initial dark mode based on system preference or saved preference
    const savedDarkMode = localStorage.getItem("darkMode")
    const initialDarkMode = savedDarkMode !== null ? savedDarkMode === "true" : prefersDark
    setIsDarkMode(initialDarkMode)

    // Apply dark mode
    if (initialDarkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }

    // Listen for system preference changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = (e) => {
      if (savedDarkMode === null) {
        setIsDarkMode(e.matches)
        if (e.matches) {
          document.documentElement.classList.add("dark")
        } else {
          document.documentElement.classList.remove("dark")
        }
      }
    }

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange)
      return () => mediaQuery.removeEventListener("change", handleChange)
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange)
      return () => mediaQuery.removeListener(handleChange)
    }
  }, [])

  // Update dark mode when toggled
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
    localStorage.setItem("darkMode", isDarkMode.toString())
  }, [isDarkMode])

  // Handlers
  const handleUpload = useCallback(
    (metricName, file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImages((prev) => ({ ...prev, [metricName]: e.target.result }))
        setUploadedFiles((prev) => ({ ...prev, [metricName]: file }))

        // If we already have results, clear them for this specific metric
        if (results) {
          const fieldName = fieldNameMapping[metricName]
          if (fieldName && results[fieldName]) {
            setResults((prev) => {
              const newResults = { ...prev }
              // Clear the estimated image but keep other data
              if (newResults[fieldName]) {
                newResults[fieldName] = {
                  ...newResults[fieldName],
                  image: null,
                }
              }
              return newResults
            })
          }
        }
      }
      reader.readAsDataURL(file)
    },
    [results],
  )

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : metrics.length - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex < metrics.length - 1 ? prevIndex + 1 : 0))
  }

  const handleSendToBackend = async () => {
    if (!selectedSide) {
      alert("Please select which side (left or right) you are analyzing before proceeding.")
      return
    }

    setIsProcessing(true)
    try {
      const formData = new FormData()

      // Add the selected side to the form data
      formData.append("side", selectedSide)

      // Add all the image files with proper orientation preservation
      Object.entries(uploadedFiles).forEach(([metricName, file]) => {
        const fieldName = fieldNameMapping[metricName]
        if (fieldName) {
          // Append the original file without modifications
          formData.append(fieldName, file, `${fieldName}.jpg`)
        }
      })

      // Add a flag to tell the backend to preserve orientation
      formData.append("preserveOrientation", "true")

      const response = await axios.post(API_ENDPOINT, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      setResults(response.data)
      setShowEstimated(true)
    } catch (error) {
      console.error("Error processing images:", error)
      alert("Failed to process images. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRecalculate = () => {
    handleSendToBackend()
  }

  const handleReupload = () => {
    setResults(null)
    setUploadedImages({})
    setUploadedFiles({})
    setCurrentIndex(0)
    setShowEstimated(false)
    setShowReport(false)
  }

  const toggleEstimatedView = () => {
    setShowEstimated((prev) => !prev)
  }

  const handleShowReport = () => {
    setShowReport(true)
  }

  const handleCloseReport = () => {
    setShowReport(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      <header className="bg-white dark:bg-gray-800 shadow sticky top-0 z-10 transition-colors duration-200">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Clinical Pose Estimation</h1>
          </div>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-white mb-2">
              {results ? "Pose Estimation Results" : "Upload Images for Pose Estimation"}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              {results
                ? "Review your pose estimation results below. You can recalculate or reupload images if needed."
                : "Please select which side you are analyzing and upload an image for each of the following metrics."}
            </p>
          </div>

          {!results && (
            <>
              <SideSelector
                selectedSide={selectedSide}
                onSelectSide={setSelectedSide}
                disabled={Object.keys(uploadedImages).length > 0}
              />

              <ProgressIndicator
                currentStep={currentIndex}
                totalSteps={metrics.length}
                completedSteps={completedSteps}
                onStepClick={setCurrentIndex}
              />
            </>
          )}

          <div className="relative">
            <AnimatePresence mode="wait">
              <MetricCard
                key={metrics[currentIndex].name}
                metric={metrics[currentIndex]}
                onUpload={handleUpload}
                uploadedImage={uploadedImages[metrics[currentIndex].name]}
                isActive={true}
                estimatedAngle={results ? results[metrics[currentIndex].fieldName]?.angle : null}
                estimatedImage={results ? results[metrics[currentIndex].fieldName]?.image : null}
                showEstimated={showEstimated}
                disabled={!canUpload}
                hasResults={!!results}
              />
            </AnimatePresence>

            <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1/2 sm:-translate-x-0">
              <button
                className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                onClick={handlePrevious}
                aria-label="Previous metric"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            </div>

            <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/2 sm:translate-x-0">
              <button
                className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                onClick={handleNext}
                aria-label="Next metric"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex space-x-2 order-2 sm:order-1">
              {metrics.map((metric, index) => (
                <button
                  key={metric.name}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    uploadedImages[metric.name]
                      ? "bg-green-500"
                      : index === currentIndex
                        ? "bg-blue-500"
                        : "bg-gray-300 dark:bg-gray-600"
                  }`}
                  onClick={() => setCurrentIndex(index)}
                  aria-label={`Go to ${metric.name}`}
                />
              ))}
            </div>

            <div className="flex flex-wrap gap-3 justify-center sm:justify-end order-1 sm:order-2">
              {!results ? (
                <CustomTooltip
                  content={canSubmit ? "Send images for analysis" : "Upload all 6 images to enable analysis"}
                  position="top"
                >
                  <button
                    className={`bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white font-bold py-3 px-6 rounded-lg text-lg flex items-center transition-colors ${!canSubmit ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={handleSendToBackend}
                    disabled={!canSubmit}
                  >
                    <Send className="w-5 h-5 mr-2" />
                    Send Images to Backend
                  </button>
                </CustomTooltip>
              ) : (
                <>
                  <button
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors"
                    onClick={handleRecalculate}
                  >
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Recalculate Angles
                  </button>
                  <button
                    className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors"
                    onClick={handleReupload}
                  >
                    <UploadCloud className="w-5 h-5 mr-2" />
                    Reupload Images
                  </button>
                  <button
                    className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors"
                    onClick={handleShowReport}
                  >
                    <FileDown className="w-5 h-5 mr-2" />
                    Show Detailed Report
                  </button>
                  <button
                    className="bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-800 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors"
                    onClick={toggleEstimatedView}
                  >
                    {showEstimated ? <EyeOff className="w-5 h-5 mr-2" /> : <Eye className="w-5 h-5 mr-2" />}
                    {showEstimated ? "Hide Points" : "Show Points"}
                  </button>
                </>
              )}
            </div>
          </div>

          {!sideSelected && !results && (
            <div className="mt-6 bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-yellow-700 dark:text-yellow-300">
                <span className="font-semibold">Important:</span> Please select which side (left or right) you are
                analyzing before uploading images.
              </p>
            </div>
          )}

          {sideSelected && !allImagesUploaded && !results && (
            <div className="mt-6 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-blue-700 dark:text-blue-300">
                <span className="font-semibold">Tip:</span> Upload an image for each of the 6 metrics to enable
                analysis. You've uploaded {Object.keys(uploadedImages).length} of 6 required images.
              </p>
            </div>
          )}
        </div>
      </main>

      {isProcessing && <PoseEstimationLoader />}

      {showReport && (
        <PdfReport
          patientInfo={patientInfo}
          results={results}
          metrics={metrics}
          selectedSide={selectedSide}
          onClose={handleCloseReport}
        />
      )}

      {/* Add CSS for animations */}
      <style jsx global>{`
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
        
        .animate-progress {
          animation: progress 2s ease-in-out infinite;
        }
        
        .animate-scan {
          animation: scan 2s linear infinite;
        }

        @keyframes fadeInOut {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }

        .animate-pulse {
          animation: fadeInOut 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

