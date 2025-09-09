"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface CameraCaptureProps {
  backendUrl: string
  onColorDetected: (color: string) => void
  onDetectionStateChange: (isDetecting: boolean) => void
  isOnline: boolean
}

export default function CameraCapture({
  backendUrl,
  onColorDetected,
  onDetectionStateChange,
  isOnline,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string>("")
  const [detectedColor, setDetectedColor] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string>("")
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [flashEffect, setFlashEffect] = useState(false)
  const [pulseEffect, setPulseEffect] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const enumerateCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const cameras = devices.filter((device) => device.kind === "videoinput")
      setAvailableCameras(cameras)

      // Prefer rear camera if available
      const rearCamera = cameras.find(
        (camera) =>
          camera.label.toLowerCase().includes("back") ||
          camera.label.toLowerCase().includes("rear") ||
          camera.label.toLowerCase().includes("environment"),
      )

      if (rearCamera) {
        setSelectedCameraId(rearCamera.deviceId)
      } else if (cameras.length > 0) {
        setSelectedCameraId(cameras[0].deviceId)
      }
    } catch (err) {
      console.error("Failed to enumerate cameras:", err)
      setError("Unable to access camera devices. Please check permissions.")
    }
  }, [])

  const playAudioFeedback = useCallback(
    (color: string) => {
      if (
        !audioEnabled ||
        !("speechSynthesis" in window) ||
        color === "Unknown" ||
        color === "Detection failed"
      ) {
        return
      }
  
      try {
        // Cancel any ongoing speech
        speechSynthesis.cancel()
  
        // Map color to student year
        const yearMap: { [key: string]: string } = {
          brown: "You are a First Year Student",
          green: "You are a Second Year Student",
          blue: "You are a Third Year Student",
          yellow: "You are a Fourth Year Student",
        }
  
        let speechText = "Color detected"
        const lowerColor = color.toLowerCase()
        for (const [c, yearText] of Object.entries(yearMap)) {
          if (lowerColor.includes(c)) {
            speechText = yearText
            break
          }
        }
  
        // Create enhanced speech utterance
        const utterance = new SpeechSynthesisUtterance(speechText)
        utterance.rate = 0.9
        utterance.volume = 0.8
        utterance.pitch = 1.1
  
        // Try to use a more natural voice if available
        const voices = speechSynthesis.getVoices()
        const preferredVoice = voices.find(
          (voice) =>
            voice.lang.startsWith("en") &&
            (voice.name.includes("Google") || voice.name.includes("Microsoft"))
        )
        if (preferredVoice) {
          utterance.voice = preferredVoice
        }
  
        utterance.onerror = (event) => {
          console.error("Speech synthesis error:", event)
        }
  
        speechSynthesis.speak(utterance)
  
        // Subtle notification sound
        try {
          const audioContext =
            new (window.AudioContext || (window as any).webkitAudioContext)()
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()
  
          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)
  
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
          oscillator.frequency.exponentialRampToValueAtTime(
            400,
            audioContext.currentTime + 0.1
          )
  
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioContext.currentTime + 0.1
          )
  
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.1)
        } catch (err) {
          console.log("Web Audio API not supported")
        }
      } catch (err) {
        console.error("Audio feedback error:", err)
      }
    },
    [audioEnabled]
  )  

  const triggerVisualEffects = useCallback((color: string) => {
    if (color !== "Unknown" && color !== "Detection failed") {
      // Flash effect
      setFlashEffect(true)
      setTimeout(() => setFlashEffect(false), 200)

      // Pulse effect
      setPulseEffect(true)
      setTimeout(() => setPulseEffect(false), 600)
    }
  }, [])

  const startCamera = async () => {
    try {
      setIsLoading(true)
      setError("")
      setRetryCount(0)

      // Check if camera is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported in this browser")
      }

      // Request permissions first to enumerate devices properly
      await navigator.mediaDevices.getUserMedia({ video: true })
      await enumerateCameras()

      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: selectedCameraId ? { exact: selectedCameraId } : undefined,
          facingMode: selectedCameraId ? undefined : { ideal: "environment" },
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 15 },
        },
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)

      if (videoRef.current) {
        videoRef.current.srcObject = stream

        videoRef.current.onloadedmetadata = () => {
          setIsStreaming(true)
          setIsLoading(false)

          toast({
            title: "Camera Started",
            description: "Real-time color detection is now active.",
          })

          // Start automatic frame capture every 1 second
          intervalRef.current = setInterval(() => {
            if (isOnline) {
              captureAndSendFrame()
            }
          }, 15000)
        }

        videoRef.current.onerror = (event) => {
          console.error("Video error:", event)
          setError("Video stream error occurred")
          setIsLoading(false)
        }
      }
    } catch (err) {
      setIsLoading(false)
      const errorMessage = err instanceof Error ? err.message : "Unknown error"

      if (errorMessage.includes("Permission denied") || errorMessage.includes("NotAllowedError")) {
        setError("Camera permission denied. Please allow camera access and try again.")
      } else if (errorMessage.includes("NotFoundError")) {
        setError("No camera found. Please connect a camera and try again.")
      } else if (errorMessage.includes("NotReadableError")) {
        setError("Camera is already in use by another application.")
      } else {
        setError(`Failed to access camera: ${errorMessage}`)
      }

      console.error("Camera access error:", err)
    }
  }

  // Stop camera stream
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    setIsStreaming(false)
    setDetectedColor("")
    onColorDetected("")
    setIsLoading(false)

    toast({
      title: "Camera Stopped",
      description: "Color detection has been paused.",
    })
  }

  const captureAndSendFrame = async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing || !isOnline) return

    const video = videoRef.current

    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      console.log("Video not ready for capture")
      return
    }

    setIsProcessing(true)
    onDetectionStateChange(true)

    try {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        throw new Error("Unable to get canvas context")
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            console.error("Failed to create blob from canvas")
            return
          }

          // Create FormData for multipart/form-data
          const formData = new FormData()
          formData.append("image", blob, "frame.jpg")

          try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

            const response = await fetch(backendUrl, {
              method: "POST",
              body: formData,
              signal: controller.signal,
            })

            clearTimeout(timeoutId)

            if (response.ok) {
              const result = await response.json()
              const color = result.color || result.detected_color || result.dominant_color || "Unknown"
              setDetectedColor(color)
              onColorDetected(color)

              playAudioFeedback(color)
              triggerVisualEffects(color)

              setError("")
              setRetryCount(0)
            } else {
              const errorText = await response.text()
              throw new Error(`Backend error: ${response.status} - ${errorText}`)
            }
          } catch (err) {
            console.error("Detection error:", err)
            setRetryCount((prev) => prev + 1)

            if (err instanceof Error && err.name === "AbortError") {
              setError("Request timeout. Please check your connection.")
            } else if (retryCount < 3) {
              setError(`Detection failed (attempt ${retryCount + 1}/3). Retrying...`)
            } else {
              setError("Detection failed after multiple attempts. Please check backend connection.")
            }

            onColorDetected("Detection failed")
          }
        },
        "image/jpeg",
        0.9,
      )
    } catch (err) {
      console.error("Frame capture error:", err)
      setError("Failed to capture frame from camera")
    } finally {
      setIsProcessing(false)
      onDetectionStateChange(false)
    }
  }

  useEffect(() => {
    enumerateCameras()

    return () => {
      stopCamera()
    }
  }, [enumerateCameras])

  // Get border color based on detected color
  const getBorderColor = () => {
    if (!detectedColor || detectedColor === "Unknown" || detectedColor === "Detection failed") {
      return "border-border"
    }

    // Map common color names to Tailwind classes
    const colorMap: { [key: string]: string } = {
      brown: "border-amber-700",
      green: "border-green-500",
      blue: "border-blue-500",
      yellow: "border-yellow-500",
    }

    const lowerColor = detectedColor.toLowerCase()
    for (const [colorName, className] of Object.entries(colorMap)) {
      if (lowerColor.includes(colorName)) {
        return className
      }
    }

    return "border-primary"
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Camera Feed</h2>

        <div className="flex justify-center items-center gap-4 mb-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={audioEnabled}
              onChange={(e) => setAudioEnabled(e.target.checked)}
              className="rounded"
              aria-label="Enable audio feedback"
            />
            Audio Feedback
          </label>
        </div>

        {availableCameras.length > 1 && !isStreaming && (
          <div className="mb-4">
            <label htmlFor="camera-select" className="block text-sm font-medium mb-2">
              Select Camera:
            </label>
            <select
              id="camera-select"
              value={selectedCameraId}
              onChange={(e) => setSelectedCameraId(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background"
              aria-label="Select camera device"
            >
              {availableCameras.map((camera) => (
                <option key={camera.deviceId} value={camera.deviceId}>
                  {camera.label || `Camera ${camera.deviceId.slice(0, 8)}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Camera Controls */}
        <div className="flex justify-center gap-4 mb-6">
          {!isStreaming ? (
            <Button
              onClick={startCamera}
              size="lg"
              disabled={isLoading || !isOnline}
              aria-label="Start camera for color detection"
            >
              {isLoading ? "Starting..." : "Start Camera"}
            </Button>
          ) : (
            <Button onClick={stopCamera} variant="destructive" size="lg" aria-label="Stop camera">
              Stop Camera
            </Button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4" role="alert">
            <p className="text-destructive font-medium">{error}</p>
            {retryCount > 0 && retryCount < 3 && (
              <p className="text-sm text-muted-foreground mt-2">Automatically retrying... ({retryCount}/3)</p>
            )}
          </div>
        )}

        {/* Offline Warning */}
        {!isOnline && isStreaming && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4" role="alert">
            <p className="text-yellow-700 dark:text-yellow-300 font-medium">
              You're offline. Color detection is paused until connection is restored.
            </p>
          </div>
        )}

        <div className="relative inline-block">
          {/* Flash overlay effect */}
          {flashEffect && (
            <div className="absolute inset-0 bg-white/30 rounded-lg pointer-events-none animate-in fade-in-0 fade-out-100 duration-200" />
          )}

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`rounded-lg shadow-lg border-4 transition-all duration-300 ${getBorderColor()} ${
              isStreaming ? "block" : "hidden"
            } ${pulseEffect ? "animate-pulse scale-105" : ""}`}
            style={{ maxWidth: "100%", height: "auto" }}
            aria-label="Camera feed for color detection"
          />

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-background/80 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Starting camera...</p>
              </div>
            </div>
          )}

          {/* Processing Indicator with enhanced animation */}
          {isProcessing && (
            <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium animate-pulse">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                Processing...
              </div>
            </div>
          )}

          {/* Detected Color Display with enhanced styling */}
{detectedColor && isStreaming && (
  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-background/95 backdrop-blur-sm px-6 py-3 rounded-full border shadow-lg animate-in slide-in-from-bottom-2 duration-300">
    <p className="text-lg font-semibold text-primary flex items-center gap-2">
      <div
        className="w-4 h-4 rounded-full border border-border"
        style={{
          backgroundColor: (() => {
            const colorMap: { [key: string]: string } = {
              brown: "#92400e",
              green: "#22c55e",
              blue: "#3b82f6",
              yellow: "#eab308",
            }
            const lowerColor = detectedColor.toLowerCase()
            for (const [colorName, hexValue] of Object.entries(colorMap)) {
              if (lowerColor.includes(colorName)) {
                return hexValue
              }
            }
            return "#6366f1"
          })(),
        }}
      />

      {/* Display student year */}
      {(() => {
        const yearMap: { [key: string]: string } = {
          brown: "First Year student",
          green: "Second Year student",
          blue: "Third Year student",
          yellow: "Fourth Year student",
        }
        const lowerColor = detectedColor.toLowerCase()
        for (const [colorName, yearText] of Object.entries(yearMap)) {
          if (lowerColor.includes(colorName)) {
            return yearText
          }
        }
        return detectedColor // fallback if unknown color
      })()}
    </p>
  </div>
)}
        </div>

        {/* Hidden canvas for frame capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Instructions */}
        {!isStreaming && !isLoading && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-muted-foreground">
              Click "Start Camera" to begin real-time color detection. The system will automatically capture frames
              every second and detect colors. {availableCameras.length > 1 && "Select your preferred camera above."}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
