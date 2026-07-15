"use client"

import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Upload, Camera, AlertCircle, Sparkles, Zap, Link2 } from "lucide-react"
import { Output } from "./Output"
import { AttestationHandler, type AttestationResult } from "./AttestationHandler"
import { useConnection } from "wagmi"
import { lisk } from "@/lib/chains"
import {
  processImageFile,
  validateImage,
  calculateAspectRatioFit,
  bmpToBlob,
} from "@/lib/image"
import { usePredictionHistory } from "@/lib/hooks/usePredictionHistory"
import type { StoredPrediction } from "@/lib/hooks/usePredictionHistory"
import { shadeItems, colorItems } from "@/lib/hair-config"

// --- Types ---

interface Recommendation {
  style: {
    id: string
    name: string
    category: string
    description: string
    replicatePrompt: string
    hairTypes: string[]
    maintenance: { barberFrequency: string; barberFrequencyDays: number; dailyMinutes?: number; description: string }
    cost: { perVisit: number; currency: string; monthlyCost: number }
    comfort: { itchiness: number; heatRetention: number; helmetCompatible: boolean; headphoneCompatible: boolean; description: string }
    climate: { humid: number; dry: number; hot: number; cold: number; description: string }
    skillRequired: string
    skillDescription: string
    culturalContext: string
    popularity: number
    versatility: number
    tags: string[]
  }
  score: number
  matchReasons: string[]
  mismatchReasons: string[]
  tradeoffs: {
    maintenance: string
    cost: string
    comfort: string
    climate: string
  }
}

interface Prediction extends StoredPrediction {}

// --- Preference options ---

const HAIR_TYPES = [
  { value: "1A", label: "1A — Straight (fine)" },
  { value: "1B", label: "1B — Straight (medium)" },
  { value: "1C", label: "1C — Straight (coarse)" },
  { value: "2A", label: "2A — Wavy (fine)" },
  { value: "2B", label: "2B — Wavy (medium)" },
  { value: "2C", label: "2C — Wavy (coarse)" },
  { value: "3A", label: "3A — Curly (loose)" },
  { value: "3B", label: "3B — Curly (springy)" },
  { value: "3C", label: "3C — Curly (tight corkscrews)" },
  { value: "4A", label: "4A — Coily (soft S-pattern)" },
  { value: "4B", label: "4B — Coily (tight Z-pattern)" },
  { value: "4C", label: "4C — Coily (dense, tight)" },
]

const CLIMATES = [
  { value: "temperate", label: "Temperate" },
  { value: "humid", label: "Humid" },
  { value: "dry", label: "Dry" },
  { value: "hot", label: "Hot" },
  { value: "cold", label: "Cold" },
]

const MAINTENANCE_LEVELS = [
  { value: "low", label: "Low — minimal daily, monthly barber" },
  { value: "medium", label: "Medium — some daily, biweekly barber" },
  { value: "high", label: "High — daily styling, weekly barber OK" },
]

const LIFESTYLES = [
  { value: "corporate", label: "Corporate / Professional" },
  { value: "creative", label: "Creative / Fashion-forward" },
  { value: "athletic", label: "Athletic / Active" },
  { value: "casual", label: "Casual / Easygoing" },
]

// Face shapes available as a preference — currently passed to the API
// but not surfaced in the UI to keep the form simple. Can be added later.
// const FACE_SHAPES = [
//   { value: "oval", label: "Oval" },
//   { value: "round", label: "Round" },
//   { value: "square", label: "Square" },
//   { value: "diamond", label: "Diamond" },
//   { value: "oblong", label: "Oblong" },
//   { value: "heart", label: "Heart" },
// ]

// --- Component ---

export function StyleAdvisor() {
  const { addPrediction } = usePredictionHistory()

  // Image state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [image, setImage] = useState<string | null>(null)
  const [loadingFile, setLoadingFile] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Preferences
  const [hairType, setHairType] = useState<string>("4C")
  const [climate, setClimate] = useState<string>("temperate")
  const [budgetPerVisit, setBudgetPerVisit] = useState<string>("")
  const [maintenanceTolerance, setMaintenanceTolerance] = useState<string>("medium")
  const [lifestyle, setLifestyle] = useState<string>("")
  const [helmetFriendly, setHelmetFriendly] = useState(false)
  const [headphoneFriendly, setHeadphoneFriendly] = useState(false)

  // Recommendations
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loadingRecs, setLoadingRecs] = useState(false)
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null)

  // Visualization
  const [shade, setShade] = useState("regular")
  const [color, setColor] = useState("black")
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [list, setList] = useState<Prediction[]>([])

  // Onchain premium (easter egg)
  const [showOnchainHint, setShowOnchainHint] = useState(false)

  // Attestation modal
  const { isConnected, chainId } = useConnection()
  const [showAttestation, setShowAttestation] = useState(false)
  const [attestingStyle, setAttestingStyle] = useState<Recommendation | null>(null)
  const [attestationResult, setAttestationResult] = useState<AttestationResult | null>(null)

  // Compute processing predictions
  const processing = useMemo(
    () =>
      list.filter(
        (item) => item?.status === "starting" || item?.status === "processing"
      ),
    [list]
  )

  // Read prediction status from API
  const readPrediction = useCallback(async (id: string) => {
    try {
      const data: Prediction = await fetch("/api/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      }).then((res) => res.json())

      setList((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...data } : item))
      )
    } catch (e) {
      console.error(e)
    }
  }, [])

  // Poll processing predictions
  useEffect(() => {
    if (processing.length === 0) return

    const interval = setInterval(async () => {
      await Promise.all(processing.map((item) => readPrediction(item.id)))
    }, 2000)

    return () => clearInterval(interval)
  }, [processing, readPrediction])

  // Reveal onchain hint after recommendations load
  useEffect(() => {
    if (recommendations.length > 0) {
      const timer = setTimeout(() => setShowOnchainHint(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [recommendations])

  // --- Image handling ---

  const onClickUpload = () => {
    if (loadingFile || loadingSubmit) return
    fileInputRef.current?.click()
  }

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      })
      setStream(mediaStream)
      setShowCamera(true)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
      setError("Could not access camera. Please upload a photo instead.")
      onClickUpload()
    }
  }

  const capturePhoto = async () => {
    if (!videoRef.current) return

    try {
      const video = videoRef.current
      const canvas = document.createElement("canvas")
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        setError("Failed to capture photo.")
        return
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", 0.95)
      })

      if (!blob) {
        setError("Failed to process captured photo.")
        return
      }

      const validationError = await validateImage(blob as File)
      if (validationError) {
        setError(validationError.solution)
        return
      }

      const { width: resizeWidth, height: resizeHeight } =
        calculateAspectRatioFit(canvas.width, canvas.height, 512, 512)

      const bmp = await createImageBitmap(blob, {
        resizeWidth,
        resizeHeight,
      })
      const resizedBlob = await bmpToBlob(bmp)
      if (!resizedBlob) {
        setError("Failed to process photo.")
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        setImage(String(reader.result))
        setShowCamera(false)
        if (stream) {
          stream.getTracks().forEach((track) => track.stop())
          setStream(null)
        }
        setError(null)
      }
      reader.readAsDataURL(resizedBlob)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to capture photo"
      setError(message)
    }
  }

  const closeCamera = () => {
    setShowCamera(false)
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
  }

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImage(null)
    setError(null)
    setLoadingFile(true)

    try {
      const file = e.target.files?.[0]
      if (!file) return

      const validationError = await validateImage(file)
      if (validationError) {
        setError(validationError.message)
        return
      }

      const processedImage = await processImageFile(file)
      setImage(processedImage)
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to process image. Please try another photo."
      setError(message)
    } finally {
      setLoadingFile(false)
    }
  }

  // --- Recommendations ---

  const getRecommendations = async () => {
    setError(null)
    setLoadingRecs(true)
    setRecommendations([])

    try {
      const prefs: Record<string, unknown> = {
        hairType,
        climate,
        maintenanceTolerance,
        helmetFriendly,
        headphoneFriendly,
        limit: 8,
      }

      if (budgetPerVisit) prefs.budgetPerVisit = Number(budgetPerVisit)
      if (lifestyle) prefs.lifestyle = lifestyle

      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      })

      if (!response.ok) throw new Error(`API error: ${response.status}`)

      const data = await response.json()
      setRecommendations(data.recommendations)
    } catch (e) {
      console.error("Recommendation error:", e)
      setError("Failed to get recommendations. Please try again.")
    } finally {
      setLoadingRecs(false)
    }
  }

  // --- Visualization ---

  const visualizeStyle = async (rec: Recommendation) => {
    setError(null)
    setSelectedStyleId(rec.style.id)

    if (!image) {
      setError("Please upload a photo first to visualize a style.")
      return
    }

    setLoadingSubmit(true)

    try {
      const response = await fetch("/api/visualize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image,
          styleId: rec.style.id,
          shade,
          color,
        }),
      })

      if (!response.ok) throw new Error(`API error: ${response.status}`)

      const data: Prediction = await response.json()

      const newPrediction: Prediction = {
        ...data,
        hairstyle: rec.style.name,
        shade,
        color,
        sourceImage: image || undefined,
        // eslint-disable-next-line react-hooks/purity -- Date.now() in event handler, not render
        timestamp: Date.now(),
      }
      setList((prev) => [newPrediction, ...prev])
      addPrediction(newPrediction)
    } catch (e) {
      console.error("Visualization error:", e)
      setError("Failed to generate visualization. Please try again.")
    } finally {
      setLoadingSubmit(false)
    }
  }

  // --- Attestation ---

  const openAttestation = (rec: Recommendation) => {
    setAttestingStyle(rec)
    setShowAttestation(true)
    setAttestationResult(null)
  }

  const handleAttestationSuccess = (result: AttestationResult) => {
    setAttestationResult(result)
  }

  // --- Render ---

  return (
    <main className="pt-16 pb-24">
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={onFileSelected}
        className="hidden"
      />

      {/* Technical Header */}
      <div className="mb-12 text-center">
        <div className="flex items-center justify-center gap-6 text-[10px] tracking-widest uppercase opacity-60 mb-4">
          <span>STYLE_ADVISOR</span>
          <span className="w-px h-3 bg-white/40" />
          <span>PREFERENCES</span>
          <span className="w-px h-3 bg-white/40" />
          <span>VISUALIZE</span>
        </div>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="relative w-full max-w-md">
            <button
              onClick={closeCamera}
              className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 z-10"
            >
              ✕
            </button>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full aspect-square object-cover rounded-lg"
            />
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <button
                onClick={capturePhoto}
                className="w-16 h-16 rounded-full bg-white border-4 border-gray-300 flex items-center justify-center"
              >
                <div className="w-12 h-12 rounded-full bg-gray-800" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {/* Upload Section */}
        <div className="relative">
          {/* Corner Brackets */}
          <div className="absolute -top-4 -left-4 w-8 h-8 border-l-2 border-t-2 border-white/20" />
          <div className="absolute -top-4 -right-4 w-8 h-8 border-r-2 border-t-2 border-white/20" />
          <div className="absolute -bottom-4 -left-4 w-8 h-8 border-l-2 border-b-2 border-white/20" />
          <div className="absolute -bottom-4 -right-4 w-8 h-8 border-r-2 border-b-2 border-white/20" />

          <div
            onClick={onClickUpload}
            className="relative aspect-square bg-black/40 border border-white/10 cursor-pointer overflow-hidden group hover:border-white/30 transition-all duration-300"
          >
            {/* Grid Overlay */}
            <div
              className="absolute inset-0 opacity-5 pointer-events-none"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, transparent, transparent 19px, #fff 19px, #fff 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, #fff 19px, #fff 20px)",
              }}
            />

            {image ? (
              <>
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url(${image})` }}
                />
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-linear-to-t from-black/80 to-transparent">
                  <p className="text-[10px] tracking-wider uppercase opacity-70">
                    IMAGE_LOADED
                  </p>
                </div>
              </>
            ) : loadingFile ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="w-16 h-16 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <p className="mt-4 text-[10px] tracking-widest uppercase">
                    LOADING
                  </p>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60 group-hover:text-white/90 transition-colors">
                <div className="flex items-center justify-center gap-8">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      startCamera()
                    }}
                    className="flex flex-col items-center justify-center hover:text-white/90 transition-colors"
                  >
                    <Camera className="w-12 h-12 mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-xs tracking-widest uppercase mb-1">SELFIE</p>
                    <p className="text-[10px] tracking-wider opacity-50">TAKE_PHOTO</p>
                  </button>
                  <button
                    onClick={onClickUpload}
                    className="flex flex-col items-center justify-center hover:text-white/90 transition-colors"
                  >
                    <Upload className="w-12 h-12 mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-xs tracking-widest uppercase mb-1">UPLOAD</p>
                    <p className="text-[10px] tracking-wider opacity-50">SELECT_FILE</p>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preferences Section */}
        <div className="flex flex-col justify-center gap-5 px-4">
          <div className="space-y-4">
            {/* Hair Type */}
            <div className="space-y-2">
              <label className="block text-[10px] tracking-widest uppercase opacity-60">
                HAIR_TYPE
              </label>
              <Select value={hairType} onValueChange={setHairType}>
                <SelectTrigger className="h-11 bg-black/40 border-white/10 text-sm tracking-wide hover:border-white/30 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black/95 border-white/10 backdrop-blur-xl max-h-60">
                  {HAIR_TYPES.map((item) => (
                    <SelectItem
                      key={item.value}
                      value={item.value}
                      className="text-xs tracking-wide hover:bg-white/10 focus:bg-white/10"
                    >
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Climate */}
            <div className="space-y-2">
              <label className="block text-[10px] tracking-widest uppercase opacity-60">
                CLIMATE
              </label>
              <Select value={climate} onValueChange={setClimate}>
                <SelectTrigger className="h-11 bg-black/40 border-white/10 text-sm tracking-wide hover:border-white/30 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black/95 border-white/10 backdrop-blur-xl">
                  {CLIMATES.map((item) => (
                    <SelectItem
                      key={item.value}
                      value={item.value}
                      className="text-xs tracking-wide hover:bg-white/10 focus:bg-white/10"
                    >
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Maintenance Tolerance */}
            <div className="space-y-2">
              <label className="block text-[10px] tracking-widest uppercase opacity-60">
                MAINTENANCE_TOLERANCE
              </label>
              <Select
                value={maintenanceTolerance}
                onValueChange={setMaintenanceTolerance}
              >
                <SelectTrigger className="h-11 bg-black/40 border-white/10 text-sm tracking-wide hover:border-white/30 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black/95 border-white/10 backdrop-blur-xl">
                  {MAINTENANCE_LEVELS.map((item) => (
                    <SelectItem
                      key={item.value}
                      value={item.value}
                      className="text-xs tracking-wide hover:bg-white/10 focus:bg-white/10"
                    >
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Budget (optional) */}
            <div className="space-y-2">
              <label className="block text-[10px] tracking-widest uppercase opacity-60">
                BUDGET_PER_VISIT (USD) — OPTIONAL
              </label>
              <input
                type="number"
                value={budgetPerVisit}
                onChange={(e) => setBudgetPerVisit(e.target.value)}
                placeholder="e.g. 30"
                className="w-full h-11 px-3 bg-black/40 border border-white/10 text-sm tracking-wide hover:border-white/30 transition-colors rounded-md focus:outline-none focus:border-white/40"
              />
            </div>

            {/* Lifestyle (optional) */}
            <div className="space-y-2">
              <label className="block text-[10px] tracking-widest uppercase opacity-60">
                LIFESTYLE — OPTIONAL
              </label>
              <Select value={lifestyle} onValueChange={setLifestyle}>
                <SelectTrigger className="h-11 bg-black/40 border-white/10 text-sm tracking-wide hover:border-white/30 transition-colors">
                  <SelectValue placeholder="SELECT_LIFESTYLE" />
                </SelectTrigger>
                <SelectContent className="bg-black/95 border-white/10 backdrop-blur-xl">
                  {LIFESTYLES.map((item) => (
                    <SelectItem
                      key={item.value}
                      value={item.value}
                      className="text-xs tracking-wide hover:bg-white/10 focus:bg-white/10"
                    >
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Compatibility toggles */}
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-[10px] tracking-widest uppercase opacity-60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={helmetFriendly}
                  onChange={(e) => setHelmetFriendly(e.target.checked)}
                  className="accent-white"
                />
                HELMET_FRIENDLY
              </label>
              <label className="flex items-center gap-2 text-[10px] tracking-widest uppercase opacity-60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={headphoneFriendly}
                  onChange={(e) => setHeadphoneFriendly(e.target.checked)}
                  className="accent-white"
                />
                HEADPHONE_FRIENDLY
              </label>
            </div>
          </div>

          {/* Get Recommendations Button */}
          <Button
            onClick={getRecommendations}
            disabled={loadingRecs}
            variant="secondary"
            size="lg"
            className="w-full h-14 text-sm tracking-widest uppercase mt-2 relative overflow-hidden group"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              {loadingRecs ? "ANALYZING..." : "GET_RECOMMENDATIONS"}
            </span>
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </Button>

          {/* Status Indicator */}
          <div className="flex items-center justify-center gap-3 text-[10px] tracking-wider uppercase opacity-40">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>ADVISOR_READY</span>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="mt-16 max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl tracking-widest uppercase opacity-80">
              RECOMMENDED_STYLES
            </h2>
            <span className="text-[10px] tracking-wider uppercase opacity-40">
              {recommendations.length} RESULTS
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec) => (
              <div
                key={rec.style.id}
                className={`border p-5 transition-all duration-300 cursor-pointer ${
                  selectedStyleId === rec.style.id
                    ? "border-white/40 bg-white/5"
                    : "border-white/10 hover:border-white/25 bg-black/20"
                }`}
                onClick={() => setSelectedStyleId(rec.style.id)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-medium">{rec.style.name}</h3>
                    <p className="text-[10px] tracking-widest uppercase opacity-50 mt-1">
                      {rec.style.category} {"//"} MATCH: {rec.score}%
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-2xl font-bold opacity-80">
                      {rec.score}
                      <span className="text-xs opacity-50">/100</span>
                    </div>
                    <div className="text-[10px] tracking-wider uppercase opacity-40">
                      POPULARITY: {rec.style.popularity}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs opacity-70 leading-relaxed mb-4">
                  {rec.style.description}
                </p>

                {/* Match reasons */}
                {rec.matchReasons.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] tracking-widest uppercase opacity-50 mb-1">
                      WHY_IT_FITS
                    </p>
                    <ul className="space-y-1">
                      {rec.matchReasons.slice(0, 3).map((reason, i) => (
                        <li
                          key={i}
                          className="text-xs text-green-400/70 flex items-start gap-2"
                        >
                          <span className="text-[8px] mt-1">+</span>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Mismatch reasons */}
                {rec.mismatchReasons.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] tracking-widest uppercase opacity-50 mb-1">
                      TRADEOFFS
                    </p>
                    <ul className="space-y-1">
                      {rec.mismatchReasons.slice(0, 2).map((reason, i) => (
                        <li
                          key={i}
                          className="text-xs text-yellow-500/60 flex items-start gap-2"
                        >
                          <span className="text-[8px] mt-1">!</span>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tradeoff metadata grid */}
                <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] tracking-wider uppercase">
                  <div className="bg-black/30 p-2 border border-white/5">
                    <span className="opacity-40 block">MAINTENANCE</span>
                    <span className="opacity-70 normal-case tracking-normal text-xs">
                      {rec.style.maintenance.barberFrequency}
                    </span>
                  </div>
                  <div className="bg-black/30 p-2 border border-white/5">
                    <span className="opacity-40 block">COST</span>
                    <span className="opacity-70 normal-case tracking-normal text-xs">
                      ${rec.style.cost.perVisit}/visit
                    </span>
                  </div>
                  <div className="bg-black/30 p-2 border border-white/5">
                    <span className="opacity-40 block">COMFORT</span>
                    <span className="opacity-70 normal-case tracking-normal text-xs">
                      Itch: {rec.style.comfort.itchiness}/5 · Heat:{" "}
                      {rec.style.comfort.heatRetention}/5
                    </span>
                  </div>
                  <div className="bg-black/30 p-2 border border-white/5">
                    <span className="opacity-40 block">SKILL</span>
                    <span className="opacity-70 normal-case tracking-normal text-xs">
                      {rec.style.skillRequired}
                    </span>
                  </div>
                </div>

                {/* Visualize button */}
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      visualizeStyle(rec)
                    }}
                    disabled={!image || loadingSubmit}
                    variant="secondary"
                    size="sm"
                    className="flex-1 text-xs tracking-widest uppercase"
                  >
                    <Zap className="w-3 h-3 mr-2" />
                    {image
                      ? loadingSubmit && selectedStyleId === rec.style.id
                        ? "GENERATING..."
                        : "VISUALIZE"
                      : "UPLOAD_FIRST"}
                  </Button>

                  {/* Onchain attestation — only visible when wallet connected */}
                  {isConnected && chainId === lisk.id && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        openAttestation(rec)
                      }}
                      variant="outline"
                      size="sm"
                      className="text-xs tracking-widest uppercase border-yellow-500/30 text-yellow-400/80 hover:bg-yellow-500/10"
                    >
                      <Link2 className="w-3 h-3 mr-1" />
                      ATTEST
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Shade & Color controls for visualization */}
          {image && (
            <div className="mt-8 grid grid-cols-2 gap-4 max-w-md mx-auto">
              <div className="space-y-2">
                <label className="block text-[10px] tracking-widest uppercase opacity-60">
                  SHADE
                </label>
                <Select value={shade} onValueChange={setShade}>
                  <SelectTrigger className="h-10 bg-black/40 border-white/10 text-xs tracking-wide">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black/95 border-white/10">
                    {shadeItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] tracking-widest uppercase opacity-60">
                  COLOR
                </label>
                <Select value={color} onValueChange={setColor}>
                  <SelectTrigger className="h-10 bg-black/40 border-white/10 text-xs tracking-wide">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black/95 border-white/10">
                    {colorItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Onchain premium hint (easter egg) */}
          {showOnchainHint && !isConnected && (
            <div className="mt-8 text-center">
              <p className="text-[10px] tracking-widest uppercase opacity-30 hover:opacity-60 transition-opacity cursor-pointer">
                {"⚡"} WANT_TO_ATTEST_YOUR_STYLE_ONCHAIN? {"//"} LISK_L2 {"//"}{" "}
                <span className="underline">CONNECT_WALLET_IN_HEADER</span>
              </p>
            </div>
          )}

          {/* Attestation success display */}
          {attestationResult && (
            <div className="mt-8 max-w-md mx-auto bg-green-500/5 border border-green-500/20 p-4 rounded text-center">
              <p className="text-[10px] tracking-widest uppercase text-green-400 mb-2">
                ATTESTATION_RECORDED
              </p>
              <p className="text-sm text-white/80 mb-2">
                {attestationResult.styleName} attested onchain
              </p>
              <p className="text-[10px] text-white/40 tracking-wider break-all">
                TOKEN: {attestationResult.tokenId.substring(0, 20)}...
                {attestationResult.tokenId.substring(58)}
              </p>
              <a
                href={`https://blockscout.lisk.com/address/${attestationResult.userAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] tracking-widest uppercase text-green-400/60 hover:text-green-400 underline mt-2 inline-block"
              >
                VIEW_ON_EXPLORER
              </a>
            </div>
          )}
        </div>
      )}

      {/* Attestation Modal */}
      {showAttestation && attestingStyle && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-black/95 border border-white/10 p-6 w-full max-w-md rounded-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-end items-center mb-4">
              <button
                onClick={() => {
                  setShowAttestation(false)
                  setAttestingStyle(null)
                  setAttestationResult(null)
                }}
                className="text-white/60 hover:text-white/90 text-xl"
              >
                ✕
              </button>
            </div>
            <AttestationHandler
              onAttestationSuccess={handleAttestationSuccess}
              amount="1"
              styleId={attestingStyle.style.id}
              styleName={attestingStyle.style.name}
              photoHash={undefined}
            />
          </div>
        </div>
      )}

      {/* Loading state for recommendations */}
      {loadingRecs && (
        <div className="mt-16 text-center">
          <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-[10px] tracking-widest uppercase opacity-50">
            ANALYZING_TRADEOFFS...
          </p>
        </div>
      )}

      {/* Results */}
      <div className="mt-8 space-y-4 max-w-6xl mx-auto">
        {list.map((item, index) => (
          <Output key={`item-${index}`} output={item} />
        ))}
      </div>

      {/* Error display */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-500 mt-4 p-3 bg-red-50/10 border border-red-500/20 rounded max-w-6xl mx-auto">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </main>
  )
}
