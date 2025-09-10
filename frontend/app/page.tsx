"use client"

import { useState, useEffect } from "react"
import CameraCapture from "./components/CameraCapture"
import Header from "./components/Header"
import DetectionResults from "./components/DetectionResults"
import ErrorBoundary from "./components/ErrorBoundary"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"

// ✅ Use env variable (can change easily without touching code)
const backendUrl = "https://id-year-detection-using-computer-vision.onrender.com/detect/" || process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000/detect/" 
console.log("Backend URL:", process.env.NEXT_PUBLIC_BACKEND_URL);

export default function Home() {
  const [detectedColor, setDetectedColor] = useState<string>("")
  const [colorHistory, setColorHistory] = useState<string[]>([])
  const [isDetecting, setIsDetecting] = useState<boolean>(false)
  const [detectionCount, setDetectionCount] = useState<number>(0)
  const [lastDetectionTime, setLastDetectionTime] = useState<Date | null>(null)
  const [isOnline, setIsOnline] = useState<boolean>(true)
  const { toast } = useToast()

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      toast({
        title: "Connection Restored",
        description: "You're back online. Detection will resume.",
      })
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast({
        title: "Connection Lost",
        description: "You're offline. Detection is paused.",
        variant: "destructive",
      })
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [toast])

  const handleColorDetected = (color: string) => {
    setDetectedColor(color)
    setDetectionCount((prev) => prev + 1)
    setLastDetectionTime(new Date())

    if (color !== "Detection failed" && color !== "Unknown" && color.trim() !== "") {
      setColorHistory((prevHistory) => {
        const newHistory = [color, ...prevHistory.filter((c) => c !== color).slice(0, 4)]
        return newHistory
      })

      if (!colorHistory.includes(color)) {
        toast({
          title: "New Color Detected!",
          description: `Found: ${color}`,
        })
      }
    } else if (color === "Detection failed") {
      toast({
        title: "Detection Failed",
        description: "Unable to detect color. Please try adjusting lighting or camera angle.",
        variant: "destructive",
      })
    }
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <Header />

        {!isOnline && (
          <div className="bg-destructive text-destructive-foreground px-4 py-2 text-center text-sm font-medium">
            You're currently offline. Some features may not work properly.
          </div>
        )}

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Camera Section */}
              <div className="lg:col-span-2">
                <div className="bg-card rounded-lg shadow-lg p-6">
                  <CameraCapture
                    backendUrl={backendUrl}
                    onColorDetected={handleColorDetected}
                    onDetectionStateChange={setIsDetecting}
                    isOnline={isOnline}
                  />
                </div>
              </div>

              {/* Detection Results Sidebar */}
              <div className="lg:col-span-1">
                <DetectionResults
                  detectedColor={detectedColor}
                  colorHistory={colorHistory}
                  isDetecting={isDetecting}
                  detectionCount={detectionCount}
                  lastDetectionTime={lastDetectionTime}
                />
              </div>
            </div>
          </div>
        </main>
        <Toaster />
      </div>
    </ErrorBoundary>
  )
}
