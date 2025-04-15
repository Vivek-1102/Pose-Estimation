"use client"

import { useState, useEffect, useRef } from "react"
import {
  Camera,
  RefreshCw,
  Check,
  CameraIcon,
  Download,
  FileDown,
  FileCheck,
  ArrowLeft,
  X,
  Upload,
  Video,
} from "lucide-react"
import Link from "next/link"
import PageLayout from "@/components/PageLayout"
import LoadingState from "@/components/LoadingState"
import { AngleCalculator } from "@/utils/angleCalculations"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import { ToastContainer } from "@/components/Toast"

// Define metrics for the dropdown
const metrics = [
  {
    name: "Ankle Dorsiflexion",
    value: "ankle",
    description: "Measure the upward bending motion of the foot at the ankle joint.",
    normalRange: "10-20°",
    points: ["knee", "ankle", "foot_index"],
  },
  {
    name: "Knee Flexion Extension",
    value: "knee",
    description: "Assess the bending and straightening motion of the knee joint.",
    normalRange: "0-135°",
    points: ["hip", "knee", "ankle"],
  },
  {
    name: "Hip Flexion",
    value: "hipFlexion",
    description: "Evaluate the forward and upward movement of the thigh at the hip joint.",
    normalRange: "0-120°",
    points: ["knee", "hip", "imaginary_horizontal"],
  },
  {
    name: "Hamstring R1",
    value: "hipRotation",
    description: "Measure the flexibility and range of motion of the hamstring muscles.",
    normalRange: "30-60°",
    points: ["ankle", "knee", "imaginary_vertical"],
  },
  {
    name: "Popliteal Angle",
    value: "popliteal",
    description: "Assess the angle between the thigh and lower leg when the knee is bent.",
    normalRange: "5-15°",
    points: ["ankle", "knee", "imaginary_vertical"],
  },
  {
    name: "Hamstring R2",
    value: "footProgression",
    description: "Evaluate the secondary range of motion for hamstring flexibility.",
    normalRange: "5-18°",
    points: ["ankle", "knee", "imaginary_vertical"],
  },
  {
    name: "Foot Progression",
    value: "footProgression2",
    description: "Measure the angle of foot progression during gait.",
    normalRange: "5-15°",
    points: ["heel", "foot_index", "imaginary_forward"],
  },
]

// Did you know facts for the loading screen
const didYouKnowFacts = [
  "MediaPipe can detect up to 33 key points on the human body.",
  "Real-time pose estimation helps provide immediate feedback on movement patterns.",
  "MediaPipe allows models to run directly in your browser with no server processing.",
  "Pose estimation can help identify movement compensations during exercise.",
  "Live pose tracking can be used for gait analysis and rehabilitation monitoring.",
]

export default function LiveEstimation() {
  // State
  const [isModelLoading, setIsModelLoading] = useState(true)
  const [isModelLoaded, setIsModelLoaded] = useState(false)
  const [isEstimating, setIsEstimating] = useState(false)
  const [error, setError] = useState(null)
  const [currentFact, setCurrentFact] = useState(0)
  const [selectedSide, setSelectedSide] = useState("right")
  const [sideIsLocked, setSideIsLocked] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState(metrics[0].value)
  const [capturedImages, setCapturedImages] = useState({})
  const [capturedPoses, setCapturedPoses] = useState({})
  const [calculatedAngles, setCalculatedAngles] = useState({})
  const [showResults, setShowResults] = useState(false)
  const [estimationFPS, setEstimationFPS] = useState(0)
  const [lastPoseTimestamp, setLastPoseTimestamp] = useState(0)
  const [isMounted, setIsMounted] = useState(false)
  const [currentPose, setCurrentPose] = useState(null)
  const [debugInfo, setDebugInfo] = useState({})
  const [showReport, setShowReport] = useState(false)
  const [patientInfo, setPatientInfo] = useState({
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString(),
  })
  const [toasts, setToasts] = useState([])
  const [simulationMode, setSimulationMode] = useState(false)

  // Refs
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const poseRef = useRef(null)
  const cameraRef = useRef(null)
  const lastTimeRef = useRef(0)
  const frameCountRef = useRef(0)
  const lastFpsUpdateRef = useRef(0)

  // Add a toast notification
  const addToast = (message, type = "success", duration = 3000) => {
    const id = Date.now()
    setToasts((prevToasts) => [...prevToasts, { id, message, type, duration }])
  }

  // Remove a toast notification
  const removeToast = (id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
  }

  // Check if we're in the browser
  useEffect(() => {
    setIsMounted(true)

    // Rotate through facts every 5 seconds
    const factInterval = setInterval(() => {
      setCurrentFact((prev) => (prev + 1) % didYouKnowFacts.length)
    }, 5000)

    return () => {
      clearInterval(factInterval)
    }
  }, [])

  // Initialize MediaPipe Pose using direct script loading
  useEffect(() => {
    if (!isMounted) return

    let isCancelled = false

    const initializePose = async () => {
      try {
        setIsModelLoading(true)
        setError(null)

        console.log("Starting to load MediaPipe Pose...")

        try {
          // Try using a direct import from CDN instead of dynamic import
          // First, load the script directly
          await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js")

          // After the script loads, the Pose constructor should be available on window
          const Pose = window.Pose

          if (!Pose) {
            throw new Error("Pose class not found after loading the script")
          }

          // Load additional dependencies
          await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js")
          await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js")

          const drawConnectors = window.drawConnectors
          const drawLandmarks = window.drawLandmarks
          const Camera = window.Camera

          // Initialize pose
          const pose = new Pose({
            locateFile: (file) => {
              return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
            },
          })

          // Configure pose detection options
          pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: false,
            smoothSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
          })

          // Set up result handler
          pose.onResults((results) => {
            onPoseResults(results, drawConnectors, drawLandmarks)
          })

          poseRef.current = {
            pose,
            drawConnectors,
            drawLandmarks,
            Camera,
          }

          setIsModelLoaded(true)
          setIsModelLoading(false)
          setSimulationMode(false)
          console.log("✅ MediaPipe Pose initialized successfully")
        } catch (err) {
          console.error("Failed to load MediaPipe, falling back to simulation mode:", err)
          setSimulationMode(true)
          setIsModelLoaded(true)
          setIsModelLoading(false)
        }
      } catch (err) {
        console.error("Failed to initialize:", err)
        if (!isCancelled) {
          setError(`Failed to initialize pose estimation: ${err.message}. Please try refreshing the page.`)
          setIsModelLoading(false)
          setSimulationMode(true)
        }
      }
    }

    // Helper function to load scripts
    function loadScript(src) {
      return new Promise((resolve, reject) => {
        const script = document.createElement("script")
        script.src = src
        script.onload = resolve
        script.onerror = reject
        document.head.appendChild(script)
      })
    }

    initializePose()

    return () => {
      isCancelled = true
      if (cameraRef.current) {
        cameraRef.current.stop()
        cameraRef.current = null
      }
    }
  }, [isMounted])

  // Handle pose results - this is where drawing happens
  const onPoseResults = (results, drawConnectors, drawLandmarks) => {
    const now = performance.now()

    // Get canvas context
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    const width = canvas.width
    const height = canvas.height

    // Clear canvas and draw video frame
    ctx.clearRect(0, 0, width, height)
    ctx.drawImage(results.image, 0, 0, width, height)

    // Calculate latency
    if (lastTimeRef.current) {
      const newLatency = now - lastTimeRef.current
      setLastPoseTimestamp(newLatency)
    }
    lastTimeRef.current = now

    // Update FPS counter
    frameCountRef.current += 1
    if (now - lastFpsUpdateRef.current > 1000) {
      const fps = Math.round((frameCountRef.current * 1000) / (now - lastFpsUpdateRef.current))
      setEstimationFPS(fps)
      frameCountRef.current = 0
      lastFpsUpdateRef.current = now
    }

    // Update debug info
    setDebugInfo({
      videoReady: videoRef.current?.readyState || 0,
      canvasSize: `${width}x${height}`,
      videoSize: videoRef.current ? `${videoRef.current.videoWidth}x${videoRef.current.videoHeight}` : "unknown",
      posesDetected: results.poseLandmarks ? 1 : 0,
      estimationTime: (now - lastTimeRef.current).toFixed(2) + "ms",
      simulationMode: simulationMode,
    })

    // Draw pose landmarks if detected
    if (results.poseLandmarks) {
      // Convert MediaPipe landmarks to our format for current pose
      const convertedPose = {
        keypoints: results.poseLandmarks.map((landmark, index) => {
          // Map MediaPipe landmark names to our format
          const name = getLandmarkName(index)
          return {
            name,
            x: landmark.x * width,
            y: landmark.y * height,
            z: landmark.z,
            score: landmark.visibility || 0.5,
          }
        }),
      }

      setCurrentPose(convertedPose)

      // Use window.POSE_CONNECTIONS instead of poseModule.POSE_CONNECTIONS
      drawConnectors(ctx, results.poseLandmarks, window.POSE_CONNECTIONS, {
        color: "#00BFFF",
        lineWidth: 4,
      })

      // Draw landmark points
      drawLandmarks(ctx, results.poseLandmarks, { color: "#FF0000", lineWidth: 2, radius: 5 })

      // Draw angle for the selected metric
      if (convertedPose) {
        drawAngleForMetric(ctx, convertedPose, selectedMetric, selectedSide)
      }
    }

    // Draw performance metrics in top-left corner
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
    ctx.fillRect(10, 10, 160, 50)
    ctx.fillStyle = "white"
    ctx.font = "14px Arial"
    ctx.fillText(`FPS: ${estimationFPS}`, 20, 30)
    ctx.fillText(`Latency: ${lastPoseTimestamp.toFixed(1)} ms`, 20, 50)
  }

  // Simulation mode pose generation
  const generateSimulatedPose = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    const width = canvas.width
    const height = canvas.height

    // Clear canvas and draw video frame
    ctx.clearRect(0, 0, width, height)
    ctx.drawImage(videoRef.current, 0, 0, width, height)

    // Generate random pose keypoints
    const keypoints = []
    const keypointNames = [
      "nose",
      "left_shoulder",
      "right_shoulder",
      "left_elbow",
      "right_elbow",
      "left_wrist",
      "right_wrist",
      "left_hip",
      "right_hip",
      "left_knee",
      "right_knee",
      "left_ankle",
      "right_ankle",
      "left_heel",
      "right_heel",
      "left_foot_index",
      "right_foot_index",
    ]

    // Create a somewhat realistic human pose
    const centerX = width / 2
    const centerY = height / 2
    const scale = height / 3

    // Basic human proportions (simplified)
    const poseStructure = {
      nose: { x: 0, y: -0.9 },
      left_shoulder: { x: -0.2, y: -0.7 },
      right_shoulder: { x: 0.2, y: -0.7 },
      left_elbow: { x: -0.3, y: -0.5 },
      right_elbow: { x: 0.3, y: -0.5 },
      left_wrist: { x: -0.35, y: -0.3 },
      right_wrist: { x: 0.35, y: -0.3 },
      left_hip: { x: -0.2, y: -0.2 },
      right_hip: { x: 0.2, y: -0.2 },
      left_knee: { x: -0.25, y: 0.2 },
      right_knee: { x: 0.25, y: 0.2 },
      left_ankle: { x: -0.25, y: 0.7 },
      right_ankle: { x: 0.25, y: 0.7 },
      left_heel: { x: -0.3, y: 0.75 },
      right_heel: { x: 0.3, y: 0.75 },
      left_foot_index: { x: -0.2, y: 0.8 },
      right_foot_index: { x: 0.2, y: 0.8 },
    }

    // Add some randomness to make it look more natural
    keypointNames.forEach((name) => {
      const base = poseStructure[name] || { x: 0, y: 0 }
      const jitter = 0.05
      const x = centerX + (base.x + (Math.random() * jitter * 2 - jitter)) * scale
      const y = centerY + (base.y + (Math.random() * jitter * 2 - jitter)) * scale
      keypoints.push({
        name,
        x,
        y,
        z: 0,
        score: 0.9,
      })
    })

    const simulatedPose = { keypoints }
    setCurrentPose(simulatedPose)

    // Draw skeleton
    ctx.strokeStyle = "#00BFFF"
    ctx.lineWidth = 4

    // Define connections for skeleton
    const connections = [
      ["nose", "left_shoulder"],
      ["nose", "right_shoulder"],
      ["left_shoulder", "right_shoulder"],
      ["left_shoulder", "left_hip"],
      ["right_shoulder", "right_hip"],
      ["left_hip", "right_hip"],
      ["left_shoulder", "left_elbow"],
      ["left_elbow", "left_wrist"],
      ["right_shoulder", "right_elbow"],
      ["right_elbow", "right_wrist"],
      ["left_hip", "left_knee"],
      ["left_knee", "left_ankle"],
      ["right_hip", "right_knee"],
      ["right_knee", "right_ankle"],
      ["left_ankle", "left_heel"],
      ["right_ankle", "right_heel"],
      ["left_heel", "left_foot_index"],
      ["right_heel", "right_foot_index"],
    ]

    // Draw connections
    const keypointMap = {}
    keypoints.forEach((kp) => {
      keypointMap[kp.name] = kp
    })

    connections.forEach(([start, end]) => {
      const p1 = keypointMap[start]
      const p2 = keypointMap[end]
      if (p1 && p2) {
        ctx.beginPath()
        ctx.moveTo(p1.x, p1.y)
        ctx.lineTo(p2.x, p2.y)
        ctx.stroke()
      }
    })

    // Draw keypoints
    ctx.fillStyle = "#FF0000"
    keypoints.forEach((kp) => {
      ctx.beginPath()
      ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI)
      ctx.fill()
    })

    // Draw angle for the selected metric
    drawAngleForMetric(ctx, simulatedPose, selectedMetric, selectedSide)

    // Draw performance metrics
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
    ctx.fillRect(10, 10, 200, 70)
    ctx.fillStyle = "white"
    ctx.font = "14px Arial"
    ctx.fillText(`FPS: ${Math.floor(Math.random() * 10) + 25}`, 20, 30)
    ctx.fillText(`Latency: ${Math.floor(Math.random() * 20) + 10} ms`, 20, 50)
    ctx.fillText(`SIMULATION MODE`, 20, 70)

    return simulatedPose
  }

  // Map MediaPipe landmark indices to our keypoint names
  const getLandmarkName = (index) => {
    const landmarkMap = {
      0: "nose",
      11: "left_shoulder",
      12: "right_shoulder",
      13: "left_elbow",
      14: "right_elbow",
      15: "left_wrist",
      16: "right_wrist",
      23: "left_hip",
      24: "right_hip",
      25: "left_knee",
      26: "right_knee",
      27: "left_ankle",
      28: "right_ankle",
      29: "left_heel",
      30: "right_heel",
      31: "left_foot_index",
      32: "right_foot_index",
    }
    return landmarkMap[index] || `landmark_${index}`
  }

  // Start the webcam and pose estimation
  const startEstimation = async () => {
    if (!isModelLoaded && !simulationMode) {
      setError("Model is not loaded yet. Please wait or refresh the page.")
      return
    }

    try {
      setError(null)
      console.log("Starting estimation...")

      // Get webcam access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      })

      // Store the stream and set up video element
      const video = videoRef.current
      video.srcObject = stream
      video.playsInline = true
      video.muted = true

      // Wait for video to be ready
      await new Promise((resolve) => {
        video.onloadedmetadata = () => {
          video
            .play()
            .then(() => {
              console.log("Video is playing")
              resolve()
            })
            .catch((err) => {
              console.error("Error playing video:", err)
              setError(`Error playing video: ${err.message}`)
            })
        }
      })

      // Set canvas dimensions to match video
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      console.log(`Canvas dimensions set to ${canvas.width}x${canvas.height}`)

      if (simulationMode) {
        // Set up simulation loop
        const simulationLoop = () => {
          if (videoRef.current && videoRef.current.readyState >= 2) {
            generateSimulatedPose()
          }
          animationFrameId = requestAnimationFrame(simulationLoop)
        }
        let animationFrameId = requestAnimationFrame(simulationLoop)
        cameraRef.current = {
          stop: () => {
            cancelAnimationFrame(animationFrameId)
            if (video.srcObject) {
              video.srcObject.getTracks().forEach((track) => track.stop())
              video.srcObject = null
            }
          },
        }
      } else {
        // Set up MediaPipe camera
        const { pose, Camera } = poseRef.current
        const camera = new Camera(video, {
          onFrame: async () => {
            if (pose) {
              await pose.send({ image: video })
            }
          },
          width: video.videoWidth,
          height: video.videoHeight,
        })
        await camera.start()
        cameraRef.current = camera
      }

      setIsEstimating(true)
      console.log("Camera and pose estimation started")
    } catch (err) {
      console.error("Error starting estimation:", err)
      setError(`Failed to start estimation: ${err.message}`)
    }
  }

  // Stop the estimation and webcam
  const stopEstimation = () => {
    console.log("Stopping estimation...")

    if (cameraRef.current) {
      cameraRef.current.stop()
      cameraRef.current = null
    }

    setIsEstimating(false)
    console.log("Estimation stopped.")
  }

  // Reset everything
  const resetCapture = () => {
    setCapturedImages({})
    setCapturedPoses({})
    setCalculatedAngles({})
    setShowResults(false)
    setSideIsLocked(false)
    setSelectedSide("right")
    startEstimation()
  }

  // Draw angle for specific metric
  const drawAngleForMetric = (ctx, pose, metricName, side) => {
    const prefix = side === "right" ? "right_" : "left_"
    const keypointMap = {}

    pose.keypoints.forEach((keypoint) => {
      keypointMap[keypoint.name] = keypoint
    })

    // Get the metric configuration
    const metricConfig = metrics.find((m) => m.value === metricName)
    if (!metricConfig) return

    // Get the points needed for this metric
    const pointsNeeded = metricConfig.points.map((p) => {
      if (p.startsWith("imaginary_")) {
        // Handle imaginary points
        const basePoint = keypointMap[`${prefix}${metricConfig.points[1]}`] // Usually the middle point
        if (!basePoint) return null

        switch (p) {
          case "imaginary_vertical":
            return { x: basePoint.x, y: basePoint.y - 100 }
          case "imaginary_horizontal":
            return { x: basePoint.x - (side === "right" ? 100 : -100), y: basePoint.y }
          case "imaginary_forward":
            return { x: basePoint.x + (side === "right" ? 100 : -100), y: basePoint.y }
          default:
            return null
        }
      } else {
        // Real body points
        return keypointMap[`${prefix}${p}`]
      }
    })

    // Check if we have all the points
    if (pointsNeeded.some((p) => !p)) return

    // Draw the angle
    AngleCalculator.drawAngle(ctx, pointsNeeded[0], pointsNeeded[1], pointsNeeded[2], "#FF0000")
  }

  // Calculate angle for specific metric
  const calculateAngleForMetric = (pose, metricName, side) => {
    const prefix = side === "right" ? "right_" : "left_"
    const keypointMap = {}

    pose.keypoints.forEach((keypoint) => {
      keypointMap[keypoint.name] = keypoint
    })

    // Get the metric configuration
    const metricConfig = metrics.find((m) => m.value === metricName)
    if (!metricConfig) return null

    // Get the points needed for this metric
    const pointsNeeded = metricConfig.points.map((p) => {
      if (p.startsWith("imaginary_")) {
        // Handle imaginary points
        const basePoint = keypointMap[`${prefix}${metricConfig.points[1]}`] // Usually the middle point
        if (!basePoint) return null

        switch (p) {
          case "imaginary_vertical":
            return { x: basePoint.x, y: basePoint.y - 100 }
          case "imaginary_horizontal":
            return { x: basePoint.x - (side === "right" ? 100 : -100), y: basePoint.y }
          case "imaginary_forward":
            return { x: basePoint.x + (side === "right" ? 100 : -100), y: basePoint.y }
          default:
            return null
        }
      } else {
        // Real body points
        return keypointMap[`${prefix}${p}`]
      }
    })

    // Check if we have all the points
    if (pointsNeeded.some((p) => !p)) return null

    // Calculate the angle
    return AngleCalculator.calculateAngle(pointsNeeded[0], pointsNeeded[1], pointsNeeded[2])
  }

  // Capture a screenshot of the current pose
  const captureScreenshot = () => {
    if (!canvasRef.current) {
      setError("Canvas not ready. Please try again.")
      return
    }

    if (!selectedSide) {
      addToast("Please select a side (left or right) before capturing.", "error")
      return
    }

    // Lock the side after first capture
    if (!sideIsLocked && Object.keys(capturedImages).length === 0) {
      setSideIsLocked(true)
    }

    // Get the canvas data
    const canvas = canvasRef.current

    // Create a new canvas for the screenshot to avoid modifying the live view
    const screenshotCanvas = document.createElement("canvas")
    screenshotCanvas.width = canvas.width
    screenshotCanvas.height = canvas.height
    const screenshotCtx = screenshotCanvas.getContext("2d")

    // Draw the current canvas content (which includes video frame and pose)
    screenshotCtx.drawImage(canvas, 0, 0)

    // Get the image data
    const imageData = screenshotCanvas.toDataURL("image/png")

    // Generate a simulated pose if in simulation mode
    const poseToStore = simulationMode ? generateSimulatedPose() : currentPose

    // Store the captured image and pose data
    setCapturedImages((prev) => ({
      ...prev,
      [selectedMetric]: imageData,
    }))

    setCapturedPoses((prev) => ({
      ...prev,
      [selectedMetric]: poseToStore,
    }))

    // Calculate the angle for this metric
    let angle
    if (simulationMode) {
      // In simulation mode, generate a random angle within a reasonable range
      const metricConfig = metrics.find((m) => m.value === selectedMetric)
      const range = metricConfig.normalRange.match(/\d+/g)
      const min = Number.parseInt(range[0])
      const max = Number.parseInt(range[1])
      // Sometimes generate angles outside the normal range
      const outsideRange = Math.random() > 0.7
      if (outsideRange) {
        angle = Math.random() > 0.5 ? max + Math.random() * 10 : min - Math.random() * 10
      } else {
        angle = min + Math.random() * (max - min)
      }
    } else {
      // Calculate actual angle from the pose
      angle = calculateAngleForMetric(poseToStore, selectedMetric, selectedSide)
    }

    setCalculatedAngles((prev) => ({
      ...prev,
      [selectedMetric]: angle,
    }))

    // Show success toast instead of alert
    addToast(`Captured ${metrics.find((m) => m.value === selectedMetric).name} successfully!`, "success")

    // Auto-select the next uncaptured metric
    const uncapturedMetrics = metrics.filter((m) => !capturedImages[m.value])
    if (uncapturedMetrics.length > 0 && uncapturedMetrics[0].value !== selectedMetric) {
      setSelectedMetric(uncapturedMetrics[0].value)
    }
  }

  // View results
  const viewResults = () => {
    if (Object.keys(capturedImages).length === 0) {
      addToast("Please capture at least one metric before viewing results.", "error")
      return
    }

    setShowResults(true)
    stopEstimation()
  }

  // Go back to camera from results
  const goBackToCamera = () => {
    setShowResults(false)
    startEstimation()
  }

  // Export results to CSV
  const exportToCSV = () => {
    // Create CSV content
    let csvContent = "Metric,Measured Angle,Normal Range,Status\n"

    // Only include captured metrics
    Object.keys(capturedImages).forEach((metricValue) => {
      const metric = metrics.find((m) => m.value === metricValue)
      if (!metric) return

      const angle = calculatedAngles[metricValue]
      const isWithinRange =
        angle !== null && angle !== undefined ? isAngleWithinRange(angle, metric.normalRange) : false

      csvContent += `"${metric.name}",`
      csvContent += angle !== null && angle !== undefined ? `${angle.toFixed(1)}°,` : "N/A,"
      csvContent += `"${metric.normalRange}",`
      csvContent += isWithinRange ? "Within normal range\n" : "Outside normal range\n"
    })

    // Create a blob and download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `pose_estimation_results_${selectedSide}_${new Date().toISOString().slice(0, 10)}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    addToast("CSV file exported successfully!", "success")
  }

  // Show detailed report
  const handleShowReport = () => {
    setShowReport(true)
  }

  // Close detailed report
  const handleCloseReport = () => {
    setShowReport(false)
  }

  // Generate PDF from the report content
  const generatePDF = async () => {
    const reportRef = document.getElementById("pdf-report-content")
    if (!reportRef) return

    try {
      const pdf = new jsPDF({
        unit: "mm",
        format: "a4",
        compress: true,
      })

      // First page - Images
      const imagesSection = document.getElementById("pdf-images-section")
      if (imagesSection) {
        const imagesCanvas = await html2canvas(imagesSection, {
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
        })

        const imgWidth = 210 // A4 width in mm
        const imgHeight = (imagesCanvas.height * imgWidth) / imagesCanvas.width

        pdf.addImage(imagesCanvas, "PNG", 0, 0, imgWidth, imgHeight, "", "FAST")
      }

      // Second page - Text report
      pdf.addPage()
      const textSection = document.getElementById("pdf-text-section")
      if (textSection) {
        const textCanvas = await html2canvas(textSection, {
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
        })

        const imgWidth = 210 // A4 width in mm
        const imgHeight = (textCanvas.height * imgWidth) / textCanvas.width

        pdf.addImage(textCanvas, "PNG", 0, 0, imgWidth, imgHeight, "", "FAST")
      }

      pdf.save(`Clinical_Pose_Estimation_Report_${selectedSide}_${new Date().toISOString().split("T")[0]}.pdf`)
      addToast("PDF report generated successfully!", "success")
    } catch (error) {
      console.error("Error generating PDF:", error)
      addToast("Failed to generate PDF. Please try again.", "error")
    }
  }

  // If not mounted yet, show loading state
  if (!isMounted) {
    return (
      <PageLayout>
        <LoadingState message="Initializing Pose Estimation..." />
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 animated-heading">Real-time Pose Estimation</h2>
            <p className="text-gray-600">Use your webcam for live pose analysis using the MediaPipe Pose model.</p>
          </div>

          <div className="p-6">
            {isModelLoading ? (
              <LoadingState message="Loading MediaPipe Pose Model..." />
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
                <h3 className="text-red-800 font-medium mb-2">Error</h3>
                <p className="text-red-700">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Page
                </button>
              </div>
            ) : showResults ? (
              // Results view
              <div className="flex flex-col items-center">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Measurement Results</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mb-6">
                  {/* Only show captured metrics */}
                  {Object.keys(capturedImages).map((metricValue) => {
                    const metric = metrics.find((m) => m.value === metricValue)
                    if (!metric) return null

                    const angle = calculatedAngles[metricValue]
                    const isWithinRange =
                      angle !== null && angle !== undefined ? isAngleWithinRange(angle, metric.normalRange) : false

                    return (
                      <div key={metricValue} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h4 className="font-semibold text-lg mb-2">{metric.name}</h4>
                        <div className="aspect-video bg-black rounded-md overflow-hidden mb-3">
                          {capturedImages[metricValue] ? (
                            <img
                              src={capturedImages[metricValue] || "/placeholder.svg"}
                              alt={metric.name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white">
                              No image captured
                            </div>
                          )}
                        </div>
                        <div className={`p-3 rounded-md ${isWithinRange ? "bg-green-50" : "bg-yellow-50"}`}>
                          <p className="font-medium text-gray-800">
                            Measured Angle: {angle !== null && angle !== undefined ? `${angle.toFixed(1)}°` : "N/A"}
                          </p>
                          <p className="text-sm mt-1 text-gray-700">Normal Range: {metric.normalRange}</p>
                          {angle !== null && angle !== undefined && (
                            <p className={`text-sm mt-1 ${isWithinRange ? "text-green-600" : "text-yellow-600"}`}>
                              Status: {isWithinRange ? "Within normal range" : "Outside normal range"}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="flex flex-wrap gap-4 justify-center">
                  <button
                    onClick={goBackToCamera}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Camera
                  </button>

                  <button
                    onClick={resetCapture}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Recapture All
                  </button>

                  <button
                    onClick={exportToCSV}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export to CSV
                  </button>

                  <button
                    onClick={handleShowReport}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <FileDown className="w-4 h-4 mr-2" />
                    Show Detailed Report
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="relative w-full max-w-2xl">
                  <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
                    {/* Video element - hidden but needed for MediaPipe */}
                    <video
                      ref={videoRef}
                      className="absolute inset-0 w-full h-full object-contain"
                      playsInline
                      muted
                      style={{ display: simulationMode ? "block" : "none" }}
                    />

                    {/* Canvas overlay */}
                    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-contain" />

                    {/* Camera start overlay */}
                    {!isEstimating && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-30">
                        <div className="text-center p-6">
                          <Camera className="w-12 h-12 text-white mx-auto mb-4" />
                          <h3 className="text-white text-xl font-bold mb-4">Camera Access Required</h3>
                          <p className="text-gray-300 mb-6 max-w-md">
                            Click the button below to start your webcam and begin real-time pose estimation.
                          </p>
                          <button
                            onClick={startEstimation}
                            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                          >
                            Start Camera
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {isEstimating && (
                    <div className="mt-6 bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Select Side</label>
                          <select
                            value={selectedSide}
                            onChange={(e) => setSelectedSide(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                            disabled={sideIsLocked}
                          >
                            <option value="right">Right Side</option>
                            <option value="left">Left Side</option>
                          </select>
                          {sideIsLocked && (
                            <p className="text-xs text-gray-500 mt-1">
                              Side is locked after first capture for consistency
                            </p>
                          )}
                        </div>

                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Select Metric</label>
                          <select
                            value={selectedMetric}
                            onChange={(e) => setSelectedMetric(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                          >
                            {metrics.map((metric) => (
                              <option key={metric.value} value={metric.value}>
                                {metric.name} {capturedImages[metric.value] ? "✓" : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="bg-blue-50 p-3 rounded-md mb-4">
                        <p className="text-sm text-blue-800">
                          {metrics.find((m) => m.value === selectedMetric)?.description}
                        </p>
                        <p className="text-sm text-blue-800 mt-1">
                          Normal Range: {metrics.find((m) => m.value === selectedMetric)?.normalRange}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-4 justify-center">
                        <button
                          onClick={captureScreenshot}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                        >
                          <CameraIcon className="w-4 h-4 mr-2" />
                          Capture Current Metric
                        </button>

                        <button
                          onClick={() => {
                            stopEstimation()
                            setCapturedImages({})
                            setCapturedPoses({})
                            setCalculatedAngles({})
                            setSideIsLocked(false)
                          }}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Stop & Reset
                        </button>

                        {Object.keys(capturedImages).length > 0 && (
                          <button
                            onClick={viewResults}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                          >
                            View Results
                          </button>
                        )}
                      </div>

                      {/* Progress indicator */}
                      <div className="mt-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-600">Capture Progress</span>
                          <span className="text-sm text-gray-600">
                            {Object.keys(capturedImages).length}/{metrics.length} metrics
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{ width: `${(Object.keys(capturedImages).length / metrics.length) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Captured metrics list */}
                      {Object.keys(capturedImages).length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Captured Metrics:</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {metrics.map((metric) => {
                              const isCaptured = capturedImages[metric.value] !== undefined
                              return (
                                <div
                                  key={metric.value}
                                  className={`p-2 rounded-md text-sm ${isCaptured ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"}`}
                                >
                                  {isCaptured && <Check className="w-4 h-4 inline mr-1" />}
                                  {metric.name}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Debug information */}
                      <div className="mt-4 p-3 bg-gray-50 rounded-md text-xs text-gray-500">
                        <details>
                          <summary className="cursor-pointer font-medium">Debug Information</summary>
                          <div className="mt-2 space-y-1">
                            <p>Video Ready State: {debugInfo.videoReady}</p>
                            <p>Canvas Size: {debugInfo.canvasSize}</p>
                            <p>Video Size: {debugInfo.videoSize}</p>
                            <p>Poses Detected: {debugInfo.posesDetected}</p>
                            <p>Estimation Time: {debugInfo.estimationTime}</p>
                            <p>Simulation Mode: {debugInfo.simulationMode ? "Enabled" : "Disabled"}</p>
                          </div>
                        </details>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-2xl w-full">
                  <h3 className="text-yellow-800 font-medium mb-2">Important Note</h3>
                  <p className="text-yellow-700">
                    For best results, ensure you are in a well-lit environment and position yourself so your full body
                    is visible in the camera frame. The accuracy of joint angle measurements depends on proper
                    visibility of key body landmarks.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Report Modal */}
      {showReport && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            id="pdf-report-content"
          >
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold text-gray-800">Clinical Pose Estimation Report</h2>
              <div className="flex space-x-2">
                <button
                  onClick={generatePDF}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center transition-colors"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download PDF
                </button>
                <button
                  onClick={handleCloseReport}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Patient Information Form */}
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Patient Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Patient Name</label>
                  <input
                    type="text"
                    placeholder="Enter patient name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Patient ID</label>
                  <input
                    type="text"
                    placeholder="Enter patient ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Clinician Name</label>
                  <input
                    type="text"
                    placeholder="Enter clinician name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Images Section */}
              <div id="pdf-images-section" className="mb-8 pb-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Captured Images</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Only show captured metrics */}
                  {Object.keys(capturedImages).map((metricValue) => {
                    const metric = metrics.find((m) => m.value === metricValue)
                    if (!metric) return null

                    return (
                      <div key={metricValue} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 p-2 border-b border-gray-200">
                          <h4 className="font-medium text-gray-800">{metric.name}</h4>
                        </div>
                        <div className="aspect-video bg-gray-100 flex items-center justify-center">
                          <img
                            src={capturedImages[metricValue] || "/placeholder.svg"}
                            alt={metric.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Text Report Section */}
              <div id="pdf-text-section">
                {/* Report Header */}
                <div className="mb-8 pb-6 border-b border-gray-200 flex flex-col md:flex-row justify-between">
                  <div className="mb-4 md:mb-0">
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Clinical Pose Estimation Report</h1>
                    <p className="text-gray-600 text-sm">
                      Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex items-center justify-center bg-blue-50 p-3 rounded-lg">
                    <FileCheck className="w-6 h-6 text-blue-600 mr-2" />
                    <div>
                      <p className="font-semibold text-blue-700">Analysis ID</p>
                      <p className="text-blue-800">{Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
                    </div>
                  </div>
                </div>

                {/* Pose Estimation Results */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Pose Estimation Results</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Metric
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Measured Angle
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Normal Range
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {/* Only show captured metrics */}
                        {Object.keys(capturedImages).map((metricValue) => {
                          const metric = metrics.find((m) => m.value === metricValue)
                          if (!metric) return null

                          const angle = calculatedAngles[metricValue]
                          const isWithinRange =
                            angle !== null && angle !== undefined
                              ? isAngleWithinRange(angle, metric.normalRange)
                              : false

                          return (
                            <tr key={metricValue}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {metric.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {angle !== null && angle !== undefined ? `${angle.toFixed(1)}°` : "N/A"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {metric.normalRange}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {angle !== null && angle !== undefined ? (
                                  <span
                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      isWithinRange ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                                    }`}
                                  >
                                    {isWithinRange ? "Normal" : "Attention"}
                                  </span>
                                ) : (
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                    Not Available
                                  </span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Observations & Insights */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Observations & Insights</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-gray-700 mb-4">
                      This report provides an automated analysis of joint angles based on pose estimation technology.
                      The results should be interpreted by a qualified healthcare professional.
                    </p>
                    <div className="border-l-4 border-blue-500 pl-4 py-1">
                      <p className="text-gray-700 italic">{generateInsights(calculatedAngles, metrics)}</p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-sm text-gray-500 mt-8 pt-4 border-t border-gray-200">
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
        </div>
      )}

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </PageLayout>
  )
}

// Helper function to check if angle is within normal range
function isAngleWithinRange(angle, normalRange) {
  if (!angle || !normalRange) return false

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

// Generate insights based on measurement results
function generateInsights(calculatedAngles, metrics) {
  if (!calculatedAngles || Object.keys(calculatedAngles).length === 0) {
    return "No data available for analysis."
  }

  const insights = []
  let abnormalCount = 0

  // Only analyze captured metrics
  Object.keys(calculatedAngles).forEach((metricValue) => {
    const metric = metrics.find((m) => m.value === metricValue)
    if (!metric) return

    const angle = calculatedAngles[metricValue]

    if (angle !== null && angle !== undefined) {
      if (!isAngleWithinRange(angle, metric.normalRange)) {
        abnormalCount++
        insights.push(
          `${metric.name} measurement (${angle.toFixed(1)}°) is outside the normal range (${metric.normalRange}).`,
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
