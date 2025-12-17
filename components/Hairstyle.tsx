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
import { Upload, Camera, ShoppingBag, Lock, Info, AlertCircle, WifiOff } from "lucide-react"
import { Output } from "./Output"
import { hairstyleItems, shadeItems, colorItems } from "@/lib/hair-config"
import { useAccount, useConfig } from "wagmi"
import { PaymentHandler } from "./PaymentHandler"

interface Prediction {
  id: string
  status: string
  output?: string
  hairstyle: string
  shade: string
  color: string
}

export function Hairstyle() {
  const { isConnected, address, isConnecting, isReconnecting } = useAccount();
  const { chains } = useConfig();
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [image, setImage] = useState<string | null>(null)
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
      chains: chains.length,
      address: address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : null
    });
    
    // Check for web3 errors
    if (!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
      setWeb3Error("WalletConnect not configured. Some wallet features may not work.");
    }
  }, [isConnected, isConnecting, isReconnecting, chains, address]);

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

  // Image processing helpers
  const getFileDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        const { width, height } = img
        URL.revokeObjectURL(img.src)
        resolve({ width, height })
      }
      img.src = url
    })
  }

  const calculateAspectRatioFit = (
    srcWidth: number,
    srcHeight: number,
    maxWidth: number,
    maxHeight: number
  ) => {
    const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight)
    return { width: srcWidth * ratio, height: srcHeight * ratio }
  }

  const bmpToBlob = async (bmp: ImageBitmap): Promise<Blob | null> => {
    const canvas = document.createElement('canvas')
    canvas.width = bmp.width
    canvas.height = bmp.height
    const ctx = canvas.getContext('bitmaprenderer')
    if (!ctx) return null
    ctx.transferFromImageBitmap(bmp)
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res))
    return blob
  }

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

  const capturePhoto = () => {
    if (!videoRef.current) return
    
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(async (blob) => {
        if (!blob) return
        
        // Resize the captured image
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
        if (!resizedBlob) return
        
        const reader = new FileReader()
        reader.onload = () => {
          setImage(String(reader.result))
          setShowCamera(false)
          if (stream) {
            stream.getTracks().forEach(track => track.stop())
            setStream(null)
          }
          setError(null)
        }
        reader.readAsDataURL(resizedBlob)
      }, 'image/jpeg', 0.8)
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
    setError(null)
    setLoadingFile(true)
    
    try {
      const file = e.target.files?.[0]
      if (!file) return

      // Get uploaded file dimensions
      const { width, height } = await getFileDimensions(file)

      // Resize image (max width/height 512/512)
      const { width: resizeWidth, height: resizeHeight } = calculateAspectRatioFit(
        width,
        height,
        512,
        512
      )
      const bmp = await createImageBitmap(file, {
        resizeWidth,
        resizeHeight
      })
      const blob = await bmpToBlob(bmp)
      if (!blob) throw new Error('Failed to create blob.')

      const reader = new FileReader()
      reader.onload = () => {
        setImage(String(reader.result))
      }
      reader.readAsDataURL(blob)
    } catch (e) {
      console.error(e)
      setError('Failed to process image. Please try another photo.')
    } finally {
      setLoadingFile(false)
    }
  }

  const handlePaymentSuccess = (tokenId: string) => {
    console.log("Payment successful with token:", tokenId);
    setPaymentToken(tokenId)
    setShowPayment(false)
    // Automatically trigger the hairstyle creation after payment
    setTimeout(() => {
      createPrediction()
    }, 500)
  }

  const createPrediction = async () => {
    console.log("Create prediction called with:", { 
      image: !!image, 
      isConnected, 
      isConnecting,
      isReconnecting,
      paymentToken: !!paymentToken,
      address
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

    console.log("Payment token exists, proceeding with creation");
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
          paymentToken // Include payment token in the request
        })
      })
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      
      const data: Prediction = await response.json()

      // Add response to beginning of list
      setList(prev => [{
        ...data,
        hairstyle,
        shade,
        color
      }, ...prev])
      
      // Reset payment token after successful use
      setPaymentToken(null)
    } catch (e) {
      console.error("Error creating prediction:", e)
      setError("Failed to create hairstyle. Please try again.")
    } finally {
      setLoadingSubmit(false)
    }
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
      address
    });
  }, [image, isConnected, isConnecting, isReconnecting, paymentToken, showPayment, address]);

  return (
    <main className="pt-16">
      {/* Hidden input */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={onFileSelected}
        className="hidden"
      />

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Payment Required</h2>
              <button 
                onClick={() => setShowPayment(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <PaymentHandler 
              onPaymentSuccess={handlePaymentSuccess} 
              amount="0.001" 
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload area */}
        <div className="aspect-square bg-[#e4e4e4] rounded-2xl relative overflow-hidden">
          {image ? (
            <div
              className="absolute inset-0 bg-cover bg-center cursor-pointer"
              style={{ backgroundImage: `url(${image})` }}
              onClick={() => setImage(null)}
            />
          ) : loadingFile ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : showCamera ? (
            <div className="w-full h-full flex items-center justify-center bg-black">
              <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-6 p-6">
              <h2 className="text-2xl font-bold text-center">Choose Your Photo</h2>
              <div className="flex gap-6">
                <button
                  onClick={onClickUpload}
                  className="flex flex-col items-center gap-3 p-6 rounded-xl bg-white shadow-md hover:bg-gray-50 transition-all"
                >
                  <Upload className="w-12 h-12 text-blue-500" />
                  <span className="text-lg font-medium">Upload Photo</span>
                </button>
                <button
                  onClick={startCamera}
                  className="flex flex-col items-center gap-3 p-6 rounded-xl bg-white shadow-md hover:bg-gray-50 transition-all"
                >
                  <Camera className="w-12 h-12 text-green-500" />
                  <span className="text-lg font-medium">Take Selfie</span>
                </button>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-4">
                <Info className="w-4 h-4" />
                <span>Photos are processed locally and never stored</span>
              </div>
            </div>
          )}
        </div>

        {/* Configuration area */}
        <div className="aspect-square flex flex-col justify-center gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Hairstyle</label>
            <Select value={hairstyle} onValueChange={setHairstyle}>
              <SelectTrigger>
                <SelectValue placeholder="Style" />
              </SelectTrigger>
              <SelectContent>
                {hairstyleItems.map(item => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Shade</label>
            <Select value={shade} onValueChange={setShade}>
              <SelectTrigger>
                <SelectValue placeholder="Shade" />
              </SelectTrigger>
              <SelectContent>
                {shadeItems.map(item => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Color</label>
            <Select value={color} onValueChange={setColor}>
              <SelectTrigger>
                <SelectValue placeholder="Color" />
              </SelectTrigger>
              <SelectContent>
                {colorItems.map(item => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={createPrediction}
            disabled={!image || loadingSubmit || isConnecting || isReconnecting}
            variant="secondary"
            size="xl"
            className="w-full rounded-full mt-4"
          >
            {loadingSubmit ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </div>
            ) : isConnecting || isReconnecting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Connecting Wallet...
              </div>
            ) : (
              'Transform Hairstyle'
            )}
          </Button>
          
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
          
          {/* Debug info */}
          <div className="text-xs text-gray-500 mt-2">
            <div>Image: {image ? 'Selected' : 'None'}</div>
            <div>Wallet: {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : isReconnecting ? 'Reconnecting...' : 'Not connected'}</div>
            <div>Payment: {paymentToken ? 'Done' : 'Required'}</div>
          </div>
          
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
        </div>
      </div>

      {/* Results */}
      <div className="mt-6 space-y-4">
        {list.map((item, index) => (
          <Output key={`item-${index}`} output={item} />
        ))}
      </div>

      {/* Ad button */}
      <div className="text-center mt-16 md:mt-20">
        <Button
          asChild
          variant="secondary"
          size="lg"
          className="rounded-xl"
        >
          <a
            href="https://nettilaukku.fi/?utm_campaign=changehairstyleai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            <ShoppingBag className="w-5 h-5" />
            Need a quality bag?
          </a>
        </Button>
      </div>
    </main>
  )
}