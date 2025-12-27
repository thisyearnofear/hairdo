"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Upload, Camera, Lock, AlertCircle, WifiOff } from "lucide-react"
import { Output } from "./Output"
import { hairstyleItems, shadeItems, colorItems } from "@/lib/hair-config"
import { useAccount, useSwitchChain, useConfig } from "wagmi"
import { PaymentHandler } from "./PaymentHandler"
import { lisk } from "@/lib/chains"
import {
  processImageFile,
  validateImage,
  ImageValidationError,
  calculateAspectRatioFit,
  bmpToBlob
} from "@/lib/image"
import { usePredictionHistory, StoredPrediction } from "@/lib/hooks/usePredictionHistory"

interface Prediction extends StoredPrediction {
  // Extends stored prediction with additional runtime properties
}

export function Hairstyle() {
  const { isConnected, address, isConnecting, isReconnecting, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { chains } = useConfig();
  const { history, addPrediction, updatePrediction } = usePredictionHistory();
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [image, setImage] = useState<string | null>(null)
  const [sourceImage, setSourceImage] = useState<string | null>(null)
  const [hairstyle, setHairstyle] = useState('fade hairstyle')
  const [shade, setShade] = useState('regular')
  const [color, setColor] = useState('blonde')
  const [loadingFile, setLoadingFile] = useState(false)
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [list, setList] = useState<Prediction[]>([])
  const [showPayment, setShowPayment] = useState(false)
  const [paymentToken, setPaymentToken] = useState<string | null>(null)
  const [showCamera, setShowCamera] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [web3Error, setWeb3Error] = useState<string | null>(null)

  // Debug web3 state
  useEffect(() => {
    console.log("Web3 State:", {
      isConnected,
      isConnecting,
      isReconnecting,
      chains: chains?.length || 0,
      chainId,
      address: address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : null
    });
    
    // Check for web3 errors
    if (!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
      setWeb3Error("WalletConnect not configured. Some wallet features may not work.");
    }
  }, [isConnected, isConnecting, isReconnecting, chains, chainId, address]);

  // Automatic network switching to Lisk
  useEffect(() => {
    if (isConnected && chainId && chainId !== lisk.id) {
      const switchToLisk = async () => {
        try {
          console.log(`Switching from chain ${chainId} to Lisk (${lisk.id})`);
          await switchChain({ chainId: lisk.id });
          console.log("Successfully switched to Lisk network");
        } catch (error) {
          console.error("Failed to switch to Lisk network:", error);
          setWeb3Error("Please switch your wallet to Lisk network manually");
        }
      };
      
      switchToLisk();
    }
  }, [isConnected, chainId, switchChain]);

  // Compute processing predictions
  const processing = useMemo(
    () => list.filter(item => item?.status === 'starting' || item?.status === 'processing'),
    [list]
  )

  // Poll processing predictions
  useEffect(() => {
    if (processing.length === 0) return

    const interval = setInterval(async () => {
      await Promise.all(processing.map(item => readPrediction(item.id)))
    }, 2000)

    return () => clearInterval(interval)
  }, [processing])



  const onClickUpload = () => {
    if (loadingFile || loadingSubmit) return
    fileInputRef.current?.click()
  }

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      })
      setStream(mediaStream)
      setShowCamera(true)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      console.error('Error accessing camera:', err)
      setError('Could not access camera. Please check permissions and try uploading a photo instead.')
      // Fallback to file upload if camera is not available
      onClickUpload()
    }
  }

  const capturePhoto = async () => {
    if (!videoRef.current) return
    
    try {
      const video = videoRef.current
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        setError('Failed to capture photo. Please try again.')
        return
      }
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.95)
      })
      
      if (!blob) {
        setError('Failed to process captured photo. Please try again.')
        return
      }

      // Validate and process the captured image
      const validationError = await validateImage(blob as any)
      if (validationError) {
        setError(validationError.solution)
        return
      }

      // Resize and convert
      const { width: resizeWidth, height: resizeHeight } = calculateAspectRatioFit(
        canvas.width,
        canvas.height,
        512,
        512
      )
      
      const bmp = await createImageBitmap(blob, {
        resizeWidth,
        resizeHeight
      })
      const resizedBlob = await bmpToBlob(bmp)
      if (!resizedBlob) {
        setError('Failed to process photo. Please try again.')
        return
      }
      
      const reader = new FileReader()
      reader.onload = () => {
        setImage(String(reader.result))
        setSourceImage(String(reader.result))
        setShowCamera(false)
        if (stream) {
          stream.getTracks().forEach(track => track.stop())
          setStream(null)
        }
        setError(null)
      }
      reader.readAsDataURL(resizedBlob)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to capture photo'
      setError(message)
      console.error(err)
    }
  }

  const closeCamera = () => {
    setShowCamera(false)
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImage(null)
    setSourceImage(null)
    setError(null)
    setLoadingFile(true)
    
    try {
      const file = e.target.files?.[0]
      if (!file) return

      // Validate image before processing
      const validationError = await validateImage(file)
      if (validationError) {
        setError(validationError.message)
        return
      }

      // Process image: resize, convert, validate
      const processedImage = await processImageFile(file)
      setImage(processedImage)
      setSourceImage(processedImage) // Store original for comparison
    } catch (err) {
      // Handle validation errors and processing errors
      const message = err instanceof Error ? err.message : 'Failed to process image. Please try another photo.'
      setError(message)
      console.error(err)
    } finally {
      setLoadingFile(false)
    }
  }

  const handlePaymentSuccess = (tokenId: string) => {
    console.log("Payment successful with token:", tokenId);
    setPaymentToken(tokenId)
    setShowPayment(false)
    // Automatically trigger the hairstyle creation after payment
    // Pass the token directly to avoid race condition with state update
    setTimeout(() => {
      startPredictionWithToken(tokenId)
    }, 500)
  }

  // Helper function to actually create the prediction with a token
  const startPredictionWithToken = async (token: string) => {
    console.log("Starting prediction with token:", token);
    setLoadingSubmit(true)
    try {
      const response = await fetch('/api/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image,
          hairstyle,
          shade,
          color,
          paymentToken: token
        })
      })
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      
      const data: Prediction = await response.json()

      // Add response to beginning of list with source image for comparison
      const newPrediction: Prediction = {
        ...data,
        hairstyle,
        shade,
        color,
        sourceImage: image || undefined,
        timestamp: Date.now()
      }
      setList(prev => [newPrediction, ...prev])
      
      // Store in history
      addPrediction(newPrediction)
      
      // Clear the token since backend has consumed it (one payment = one generation)
      setPaymentToken(null)
    } catch (e) {
      console.error("Error creating prediction:", e)
      setError("Failed to create hairstyle. Please try again.")
    } finally {
      setLoadingSubmit(false)
    }
  }

  const createPrediction = async () => {
    console.log("Create prediction called with:", { 
      image: !!image, 
      isConnected, 
      isConnecting,
      isReconnecting,
      paymentToken: !!paymentToken,
      address,
      chainId
    });
    
    // Reset any previous errors
    setError(null)
    setWeb3Error(null)
    
    // Check if image is selected
    if (!image) {
      setError("Please select an image first")
      return
    }
    
    // Check if wallet is connected
    if (!isConnected && !isConnecting && !isReconnecting) {
      setError("Please connect your wallet first")
      return
    }
    
    // Check if user is on the wrong network
    if (isConnected && chainId && chainId !== lisk.id) {
      setWeb3Error("Please switch to Lisk network")
      return
    }
    
    // If wallet is connecting/reconnecting, wait a bit and try again
    if (isConnecting || isReconnecting) {
      setError("Wallet is connecting, please wait...")
      setTimeout(createPrediction, 1000)
      return
    }
    
    // Check if user has paid
    if (!paymentToken) {
      console.log("No payment token, showing payment modal");
      setShowPayment(true)
      return
    }

    // Use existing payment token
    await startPredictionWithToken(paymentToken)
  }

  const readPrediction = async (id: string) => {
    try {
      const data: Prediction = await fetch('/api/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id })
      }).then(res => res.json())

      // Patch response back to list
      setList(prev => prev.map(item => 
        item.id === id ? { ...item, ...data } : item
      ))
    } catch (e) {
      console.error(e)
    }
  }

  // Debug effect to log state changes
  useEffect(() => {
    console.log("State changed:", { 
      image: !!image, 
      isConnected, 
      isConnecting,
      isReconnecting,
      paymentToken: !!paymentToken,
      showPayment,
      address,
      chainId
    });
  }, [image, isConnected, isConnecting, isReconnecting, paymentToken, showPayment, address, chainId]);

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
          <span>MODEL_SELECT</span>
          <span className="w-px h-3 bg-white/40" />
          <span>CONFIG_v1.0</span>
          <span className="w-px h-3 bg-white/40" />
          <span>RENDER_ENGINE</span>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="bg-black/95 border border-white/10 p-6 w-full max-w-md rounded-lg">
            <div className="flex justify-end items-center mb-4">
              <button
                onClick={() => setShowPayment(false)}
                className="text-white/60 hover:text-white/90 text-xl"
              >
                ✕
              </button>
            </div>
            <PaymentHandler
              onPaymentSuccess={handlePaymentSuccess}
              amount="1"
            />
          </div>
        </div>
      )}

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="relative w-full max-w-md">
            <button 
              onClick={closeCamera}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 z-10"
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
            <div className="absolute inset-0 opacity-5 pointer-events-none"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 19px, #fff 19px, #fff 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, #fff 19px, #fff 20px)',
              }}
            />
            
            {image ? (
              <>
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url(${image})` }}
                />
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-[10px] tracking-wider uppercase opacity-70">IMAGE_LOADED</p>
                </div>
              </>
            ) : loadingFile ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="w-16 h-16 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <p className="mt-4 text-[10px] tracking-widest uppercase">LOADING</p>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60 group-hover:text-white/90 transition-colors">
                <div className="flex items-center justify-center gap-8">
                  <button
                    onClick={(e) => { e.stopPropagation(); startCamera(); }}
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

        {/* Configuration Section */}
        <div className="flex flex-col justify-center gap-6 px-4">
          {/* Technical Labels */}
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="block text-[10px] tracking-widest uppercase opacity-60">
                STYLE_PARAM_01
              </label>
              <Select value={hairstyle} onValueChange={setHairstyle}>
                <SelectTrigger className="h-12 bg-black/40 border-white/10 text-sm tracking-wide hover:border-white/30 transition-colors">
                  <SelectValue placeholder="SELECT_STYLE" />
                </SelectTrigger>
                <SelectContent className="bg-black/95 border-white/10 backdrop-blur-xl">
                  {hairstyleItems.map(item => (
                    <SelectItem 
                      key={item.value} 
                      value={item.value}
                      className="text-xs tracking-wide uppercase hover:bg-white/10 focus:bg-white/10"
                    >
                      {item.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] tracking-widest uppercase opacity-60">
                SHADE_PARAM_02
              </label>
              <Select value={shade} onValueChange={setShade}>
                <SelectTrigger className="h-12 bg-black/40 border-white/10 text-sm tracking-wide hover:border-white/30 transition-colors">
                  <SelectValue placeholder="SELECT_SHADE" />
                </SelectTrigger>
                <SelectContent className="bg-black/95 border-white/10 backdrop-blur-xl">
                  {shadeItems.map(item => (
                    <SelectItem 
                      key={item.value} 
                      value={item.value}
                      className="text-xs tracking-wide uppercase hover:bg-white/10 focus:bg-white/10"
                    >
                      {item.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] tracking-widest uppercase opacity-60">
                COLOR_PARAM_03
              </label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger className="h-12 bg-black/40 border-white/10 text-sm tracking-wide hover:border-white/30 transition-colors">
                  <SelectValue placeholder="SELECT_COLOR" />
                </SelectTrigger>
                <SelectContent className="bg-black/95 border-white/10 backdrop-blur-xl">
                  {colorItems.map(item => (
                    <SelectItem 
                      key={item.value} 
                      value={item.value}
                      className="text-xs tracking-wide uppercase hover:bg-white/10 focus:bg-white/10"
                    >
                      {item.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Execute Button */}
          <Button
            onClick={createPrediction}
            disabled={!image || loadingSubmit || isConnecting || isReconnecting}
            variant="secondary"
            size="lg"
            className="w-full h-14 text-sm tracking-widest uppercase mt-4 relative overflow-hidden group"
          >
            <span className="relative z-10">EXECUTE_TRANSFORM</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </Button>

          {/* Status Indicator */}
          <div className="flex items-center justify-center gap-3 text-[10px] tracking-wider uppercase opacity-40">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>SYSTEM_READY</span>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mt-6 space-y-4">
        {list.map((item, index) => (
          <Output key={`item-${index}`} output={item} />
        ))}
      </div>

      {/* Error displays */}
      {web3Error && (
        <div className="flex items-center gap-2 text-sm text-yellow-600 mt-2 p-2 bg-yellow-50 rounded">
          <WifiOff className="w-4 h-4" />
          <span>{web3Error}</span>
        </div>
      )}
      
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-500 mt-2 p-2 bg-red-50 rounded">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
      
      
      {/* Payment indicator */}
      {!paymentToken && isConnected && (
        <div className="flex items-center justify-center text-sm text-muted-foreground mt-2">
          <Lock className="w-4 h-4 mr-1" />
          Payment required to generate hairstyle
        </div>
      )}
      
      {paymentToken && (
        <div className="flex items-center justify-center text-sm text-green-600 mt-2">
          <Lock className="w-4 h-4 mr-1" />
          Payment verified - ready to generate
        </div>
      )}
    </main>
  )
}