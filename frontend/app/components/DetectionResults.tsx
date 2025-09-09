"use client"

import { useState, useEffect } from "react"

interface DetectionResultsProps {
  detectedColor: string
  colorHistory: string[]
  isDetecting: boolean
  detectionCount: number
  lastDetectionTime: Date | null
}

export default function DetectionResults({
  detectedColor,
  colorHistory,
  isDetecting,
  detectionCount,
  lastDetectionTime,
}: DetectionResultsProps) {
  const [pulseKey, setPulseKey] = useState(0)
  const [showCelebration, setShowCelebration] = useState(false)

  // Trigger animation when color changes
  useEffect(() => {
    if (detectedColor && detectedColor !== "Detection failed") {
      setPulseKey((prev) => prev + 1)

      if (detectedColor !== "Unknown") {
        setShowCelebration(true)
        setTimeout(() => setShowCelebration(false), 1000)
      }
    }
  }, [detectedColor])

  // Get color preview style
  const getColorPreview = (colorName: string) => {
    const colorMap: { [key: string]: string } = {
      brown: "#92400e",
      green: "#22c55e",
      blue: "#3b82f6",
      yellow: "#eab308",
    }

    const lowerColor = colorName.toLowerCase()
    for (const [colorKey, hexValue] of Object.entries(colorMap)) {
      if (lowerColor.includes(colorKey)) {
        return hexValue
      }
    }
    return "#6366f1" // Default primary color
  }

  return (
    <div className="space-y-6">
      {/* Current Detection */}
      <div className="bg-card rounded-lg shadow-lg p-6 relative overflow-hidden">
        {showCelebration && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-primary rounded-full animate-bounce"
                style={{
                  left: `${20 + i * 12}%`,
                  top: `${30 + (i % 2) * 20}%`,
                  animationDelay: `${i * 100}ms`,
                  animationDuration: "800ms",
                }}
              />
            ))}
          </div>
        )}

        <h2 className="text-xl font-semibold mb-4 text-center">Live Detection</h2>

        <div className="text-center space-y-4">
          {/* Status Indicator with enhanced animation */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                isDetecting ? "bg-green-500 animate-pulse scale-110" : "bg-gray-400"
              }`}
            />
            <span className="text-sm text-muted-foreground">{isDetecting ? "Detecting..." : "Standby"}</span>
          </div>

          {/* Color Display with enhanced animations */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Current Color:</p>

            {detectedColor ? (
  <div key={pulseKey} className="animate-in fade-in-0 zoom-in-95 duration-500">
    <div className="flex items-center justify-center gap-3 mb-3">
      <div
        className={`w-8 h-8 rounded-full border-2 border-border shadow-lg transition-all duration-300 ${
          showCelebration ? "animate-spin" : ""
        }`}
        style={{ backgroundColor: getColorPreview(detectedColor) }}
      />
      <span className="text-2xl font-bold capitalize animate-in slide-in-from-left-2 duration-300"
        style={{ color: getColorPreview(detectedColor) }}  // optional: make text match color
      >
        {(() => {
          const yearMap: { [key: string]: string } = {
            brown: "You are a First Year student",
            green: "You are a Second Year student",
            blue: "You are a Third Year student",
            yellow: "You are a Fourth Year student",
          }
          const lowerColor = detectedColor.toLowerCase()
          for (const [colorName, yearText] of Object.entries(yearMap)) {
            if (lowerColor.includes(colorName)) {
              return yearText
            }
          }
          return detectedColor // fallback if not mapped
        })()}
      </span>
    </div>
  </div>
) : (
  <div className="text-xl text-muted-foreground">No detection yet</div>
)}

          </div>
        </div>
      </div>

      {/* Color History with enhanced animations */}
{colorHistory.length > 0 && (
  <div className="bg-card rounded-lg shadow-lg p-6">
    <h3 className="text-lg font-semibold mb-4 text-center">Detection History</h3>

    <div className="space-y-3">
      {colorHistory.map((color, index) => (
        <div
          key={`${color}-${index}`}
          className="flex items-center gap-3 p-3 bg-muted rounded-lg transition-all duration-300 hover:bg-muted/80 hover:scale-105 animate-in slide-in-from-right-2"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div
            className="w-6 h-6 rounded-full border-2 border-border shadow-sm flex-shrink-0 transition-transform hover:scale-110"
            style={{ backgroundColor: getColorPreview(color) }}
          />
          <span className="font-medium flex-1">
            {(() => {
              const yearMap: { [key: string]: string } = {
                brown: "First Year Students",
                green: "Second Year Students",
                blue: "Third Year Students",
                yellow: "Fourth Year Students",
              }
              const lowerColor = color.toLowerCase()
              for (const [colorName, yearText] of Object.entries(yearMap)) {
                if (lowerColor.includes(colorName)) {
                  return yearText
                }
              }
              return color // fallback
            })()}
          </span>
          <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded-full">
            #{index + 1}
          </span>
        </div>
      ))}
    </div>
  </div>
)}


      {/* Instructions with enhanced styling */}
      <div className="bg-gradient-to-r from-muted/30 to-muted/50 rounded-lg p-4 border border-border/50">
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          How it works:
        </h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Camera captures frames in <strong>15 seconds</strong>.</li>
          <li>• AI analyzes the dominant color.</li>
          <li>• Results appear in real-time.</li>
          <li>• Audio feedback announces colors.</li>
        </ul>
      </div>
    </div>
  )
}
