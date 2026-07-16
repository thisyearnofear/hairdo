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
import { Upload, Camera, AlertCircle, Sparkles, Zap, Link2, Scissors, ChevronDown, HelpCircle } from "lucide-react"
import { Output } from "./Output"
import Link from "next/link"
import { AttestationHandler, type AttestationResult } from "./AttestationHandler"
import { useConnection } from "wagmi"
import { lisk } from "@/lib/chains"
import { RadarChart } from "@/components/ui/radar-chart"
import { StatBar } from "@/components/ui/tradeoff-bars"
import { ProgressSteps } from "@/components/ui/progress-steps"
import { HairTypeGuide } from "@/components/ui/hair-type-guide"
import { StyleIllustration } from "@/components/ui/style-illustration"
import { Reveal } from "@/components/ui/reveal"
import { play } from "@/lib/sound"
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

  // Hair type guide
  const [showHairGuide, setShowHairGuide] = useState(false)

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

  // Flow progress: 0=upload, 1=prefs, 2=recs, 3=visualize, 4=attest
  const currentStep = useMemo(() => {
    if (attestationResult) return 4
    if (list.length > 0) return 3
    if (recommendations.length > 0) return 2
    if (image) return 1
    return 0
  }, [image, recommendations, list, attestationResult])

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
    play("press")
    fileInputRef.current?.click()
  }

  const startCamera = async () => {
    play("press")
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
        play("chime")
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
      play("chime")
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
    play("press")

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
      play("chime")
    } catch (e) {
      console.error("Recommendation error:", e)
      setError("Failed to get recommendations. Please try again.")
      play("error")
    } finally {
      setLoadingRecs(false)
    }
  }

  // --- Visualization ---

  const visualizeStyle = async (rec: Recommendation) => {
    setError(null)
    setSelectedStyleId(rec.style.id)
    play("press")

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
      play("success")
    } catch (e) {
      console.error("Visualization error:", e)
      setError("Failed to generate visualization. Please try again.")
      play("error")
    } finally {
      setLoadingSubmit(false)
    }
  }

  // --- Attestation ---

  const openAttestation = (rec: Recommendation) => {
    setAttestingStyle(rec)
    setShowAttestation(true)
    setAttestationResult(null)
    play("press")
  }

  const handleAttestationSuccess = (result: AttestationResult) => {
    setAttestationResult(result)
    play("success")
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

      {/* Flow Progress Steps */}
      <div className="mb-12">
        <ProgressSteps currentStep={currentStep} />
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
        <Reveal direction="left" className="relative">
          {/* Corner Brackets — warm tone */}
          <div className="absolute -top-4 -left-4 w-8 h-8 border-l-2 border-t-2 border-amber/20" />
          <div className="absolute -top-4 -right-4 w-8 h-8 border-r-2 border-t-2 border-amber/20" />
          <div className="absolute -bottom-4 -left-4 w-8 h-8 border-l-2 border-b-2 border-amber/20" />
          <div className="absolute -bottom-4 -right-4 w-8 h-8 border-r-2 border-b-2 border-amber/20" />

          <div
            onClick={onClickUpload}
            className="relative aspect-square bg-black/40 border border-white/10 cursor-pointer overflow-hidden group hover:border-amber/30 transition-[border-color] duration-200 rounded-lg press-scale border-gradient-warm"
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
                  <p className="text-xs tracking-wide opacity-70">
                    Image loaded
                  </p>
                </div>
              </>
            ) : loadingFile ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="w-16 h-16 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <p className="mt-4 text-xs tracking-wide">
                    Loading
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
                    <p className="text-sm tracking-wide font-medium mb-1">Selfie</p>
                    <p className="text-[10px] tracking-wide opacity-50">Take photo</p>
                  </button>
                  <button
                    onClick={onClickUpload}
                    className="flex flex-col items-center justify-center hover:text-white/90 transition-colors"
                  >
                    <Upload className="w-12 h-12 mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-sm tracking-wide font-medium mb-1">Upload</p>
                    <p className="text-[10px] tracking-wide opacity-50">Select file</p>
                  </button>
                </div>
              </div>
            )}
          </div>
        </Reveal>

        {/* Preferences Section */}
        <Reveal direction="right" className="flex flex-col justify-center gap-5 px-4">
          <div className="space-y-4">
            {/* Hair Type — with visual guide toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs tracking-wide font-medium opacity-60">
                  Hair type
                </label>
                <button
                  type="button"
                  onClick={() => setShowHairGuide(!showHairGuide)}
                  className="flex items-center gap-1 text-[10px] tracking-wide text-amber/70 hover:text-amber transition-colors"
                >
                  <HelpCircle className="w-3 h-3" />
                  Not sure?
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showHairGuide ? "rotate-180" : ""}`} />
                </button>
              </div>
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
              {/* Visual hair type guide */}
              {showHairGuide && (
                <div className="animate-enter-up">
                  <HairTypeGuide selected={hairType} onSelect={(v) => { setHairType(v); setShowHairGuide(false); play("toggle") }} />
                  <p className="text-[10px] opacity-40 mt-1.5 text-center">
                    Tap a pattern that matches your hair
                  </p>
                </div>
              )}
            </div>

            {/* Climate */}
            <div className="space-y-2">
              <label className="text-xs tracking-wide font-medium opacity-60">
                Climate
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
              <label className="text-xs tracking-wide font-medium opacity-60">
                Maintenance tolerance
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
              <label className="text-xs tracking-wide font-medium opacity-60">
                Budget per visit (USD) — optional
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
              <label className="text-xs tracking-wide font-medium opacity-60">
                Lifestyle — optional
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
              <label className="flex items-center gap-2 text-xs tracking-wide font-medium opacity-60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={helmetFriendly}
                  onChange={(e) => { setHelmetFriendly(e.target.checked); play("toggle") }}
                  className="accent-amber"
                />
                Helmet friendly
              </label>
              <label className="flex items-center gap-2 text-xs tracking-wide font-medium opacity-60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={headphoneFriendly}
                  onChange={(e) => { setHeadphoneFriendly(e.target.checked); play("toggle") }}
                  className="accent-amber"
                />
                Headphone friendly
              </label>
            </div>
          </div>

          {/* Get Recommendations Button */}
          <Button
            onClick={getRecommendations}
            disabled={loadingRecs}
            variant="secondary"
            size="lg"
            className="w-full h-14 text-sm tracking-wide mt-2 relative overflow-hidden group"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              {loadingRecs ? "Analyzing..." : "Get recommendations"}
            </span>
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </Button>

          {/* Status Indicator */}
          <div className="flex items-center justify-center gap-3 text-[10px] tracking-wider uppercase opacity-30">
            <div className="w-2 h-2 rounded-full bg-sage animate-pulse" />
            <span>Advisor ready</span>
          </div>
        </Reveal>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="mt-16 max-w-6xl mx-auto">
          <Reveal direction="up" className="flex items-center justify-between mb-8">
            <h2 className="text-2xl tracking-tight opacity-80 font-display text-gradient-gold">
              Recommended styles
            </h2>
            <span className="text-xs tracking-wide opacity-40 tabular-nums">
              {recommendations.length} results
            </span>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec, index) => {
              // Compute radar data from style attributes
              const radarData = [
                { label: "MATCH", value: rec.score },
                { label: "COMFORT", value: 100 - (rec.style.comfort.itchiness + rec.style.comfort.heatRetention) * 10 },
                { label: "CLIMATE", value: rec.style.climate[climate as keyof typeof rec.style.climate] as number * 20 },
                { label: "COST", value: Math.max(0, 100 - rec.style.cost.perVisit * 2) },
                { label: "MAINT.", value: Math.max(0, 100 - rec.style.maintenance.barberFrequencyDays * 3) },
                { label: "POPULAR", value: rec.style.popularity },
              ]

              return (
              <Reveal
                key={rec.style.id}
                direction="up"
                delay={index * 60}
                className={`border p-5 rounded-lg transition-[border-color,background-color,box-shadow] duration-300 cursor-pointer press-scale border-gradient-warm glass-warm ${
                  selectedStyleId === rec.style.id
                    ? "border-amber/40 bg-amber/5 shadow-gold-glow"
                    : "border-white/10 hover:border-amber/25 hover:shadow-warm"
                }`}
              >
                {/* Header with illustration + score + radar */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <StyleIllustration category={rec.style.category} size={36} className="text-amber/60 flex-shrink-0" />
                      <div className="min-w-0">
                        <h3 className="text-lg font-medium font-display">{rec.style.name}</h3>
                        <p className="text-[10px] tracking-wide uppercase opacity-50 mt-0.5">
                          {rec.style.category}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-2xl font-bold tabular-nums animate-count-up font-display text-gradient-warm" style={{ animationDelay: `${index * 45 + 100}ms` }}>
                        {rec.score}
                        <span className="text-xs opacity-50">/100</span>
                      </div>
                      <div className="text-[10px] tracking-wide uppercase opacity-40">
                        Match
                      </div>
                    </div>
                    <RadarChart data={radarData} size={80} />
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs opacity-70 leading-relaxed mb-4">
                  {rec.style.description}
                </p>

                {/* Match reasons */}
                {rec.matchReasons.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] tracking-wide uppercase opacity-50 mb-1">
                      Why it fits
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
                    <p className="text-[10px] tracking-wide uppercase opacity-50 mb-1">
                      Tradeoffs
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

                {/* Tradeoff visual bars */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <StatBar
                    label="Maintenance"
                    value={rec.style.maintenance.barberFrequency}
                    barPct={Math.max(20, 100 - rec.style.maintenance.barberFrequencyDays * 3)}
                    color="blue"
                  />
                  <StatBar
                    label="Cost"
                    value={`$${rec.style.cost.perVisit}/visit`}
                    barPct={Math.max(15, 100 - rec.style.cost.perVisit * 2)}
                    color="green"
                  />
                  <StatBar
                    label="Comfort"
                    value={`Itch ${rec.style.comfort.itchiness}/5 · Heat ${rec.style.comfort.heatRetention}/5`}
                    barPct={100 - (rec.style.comfort.itchiness + rec.style.comfort.heatRetention) * 10}
                    color="purple"
                  />
                  <StatBar
                    label="Skill"
                    value={rec.style.skillRequired}
                    barPct={rec.style.skillRequired === "Any barber" ? 90 : rec.style.skillRequired === "Experienced" ? 60 : 30}
                    color="orange"
                  />
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
                    className="flex-1 text-xs tracking-wide"
                  >
                    <Zap className="w-3 h-3 mr-2" />
                    {image
                      ? loadingSubmit && selectedStyleId === rec.style.id
                        ? "Generating..."
                        : "Visualize"
                      : "Upload first"}
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
                      className="text-xs tracking-wide border-amber/30 text-amber/80 hover:bg-amber/10"
                    >
                      <Link2 className="w-3 h-3 mr-1" />
                      Attest
                    </Button>
                  )}
                </div>

                {/* Find barbers link — Phase 4 integration, filtered by style */}
                <Link
                  href={`/barbers?style=${rec.style.id}`}
                  className="flex items-center justify-center gap-1.5 mt-3 text-[10px] tracking-wide uppercase opacity-40 hover:opacity-70 transition-opacity"
                >
                  <Scissors className="w-3 h-3" />
                  Find barbers for this style
                </Link>
              </Reveal>
              )
            })}
          </div>

          {/* Shade & Color controls for visualization */}
          {image && (
            <>
            <div className="max-w-xs mx-auto barbershop-divider mt-8 mb-8" />
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              <div className="space-y-2">
                <label className="text-xs tracking-wide font-medium opacity-60">
                  Shade
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
                <label className="text-xs tracking-wide font-medium opacity-60">
                  Color
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
            </>
          )}

          {/* Onchain premium hint (easter egg) */}
          {showOnchainHint && !isConnected && (
            <div className="mt-8 text-center">
              <p className="text-xs tracking-wide opacity-30 hover:opacity-60 transition-opacity cursor-pointer">
                {"⚡"} Want to attest your style onchain? Lisk L2 —{" "}
                <span className="underline">connect wallet in header</span>
              </p>
            </div>
          )}

          {/* Attestation success display */}
          {attestationResult && (
            <div className="mt-8 max-w-md mx-auto bg-green-500/5 border border-green-500/20 p-4 rounded-lg text-center animate-enter-scale shadow-glow">
              <p className="text-xs tracking-wide uppercase text-green-400 mb-2">
                Attestation recorded
              </p>
              <p className="text-sm text-white/80 mb-2">
                {attestationResult.styleName} attested onchain
              </p>
              <p className="text-[10px] text-white/40 tracking-wider break-all">
                Token: {attestationResult.tokenId.substring(0, 20)}...
                {attestationResult.tokenId.substring(58)}
              </p>
              <a
                href={`https://blockscout.lisk.com/address/${attestationResult.userAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs tracking-wide text-green-400/60 hover:text-green-400 underline mt-2 inline-block"
              >
                View on explorer
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
        <div className="mt-16 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="border border-white/10 bg-black/20 p-5 rounded-lg space-y-3"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex justify-between">
                  <div className="space-y-2">
                    <div className="h-4 w-32 shimmer rounded" />
                    <div className="h-3 w-20 shimmer rounded" />
                  </div>
                  <div className="h-12 w-12 shimmer rounded-full" />
                </div>
                <div className="h-3 w-full shimmer rounded" />
                <div className="h-3 w-3/4 shimmer rounded" />
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="h-12 shimmer rounded-md" />
                  <div className="h-12 shimmer rounded-md" />
                  <div className="h-12 shimmer rounded-md" />
                  <div className="h-12 shimmer rounded-md" />
                </div>
                <div className="h-8 w-full shimmer rounded-md" />
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs tracking-wide opacity-50">
            Analyzing tradeoffs...
          </p>
        </div>
      )}

      {/* Results */}
      <div className="mt-8 space-y-4 max-w-6xl mx-auto">
        {list.map((item, index) => (
          <Reveal key={`item-${index}`} direction="scale" delay={index * 100}>
            <Output output={item} />
          </Reveal>
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
