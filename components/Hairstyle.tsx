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
import { Upload, ShoppingBag } from "lucide-react"
import { Output } from "./Output"
import { hairstyleItems, shadeItems, colorItems } from "@/lib/hair-config"

interface Prediction {
  id: string
  status: string
  output?: string
  hairstyle: string
  shade: string
  color: string
}

export function Hairstyle() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [image, setImage] = useState<string | null>(null)
  const [hairstyle, setHairstyle] = useState('fade hairstyle')
  const [shade, setShade] = useState('regular')
  const [color, setColor] = useState('blonde')
  const [loadingFile, setLoadingFile] = useState(false)
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [list, setList] = useState<Prediction[]>([])

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

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImage(null)
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
    } finally {
      setLoadingFile(false)
    }
  }

  const createPrediction = async () => {
    setLoadingSubmit(true)
    try {
      const data: Prediction = await fetch('/api/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image,
          hairstyle,
          shade,
          color
        })
      }).then(res => res.json())

      // Add response to beginning of list
      setList(prev => [{
        ...data,
        hairstyle,
        shade,
        color
      }, ...prev])
    } catch (e) {
      console.error(e)
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload area */}
        <div
          onClick={onClickUpload}
          className="aspect-square bg-[#e4e4e4] rounded-2xl cursor-pointer flex items-center justify-center hover:bg-[#dddddd] transition-colors relative overflow-hidden"
        >
          {image ? (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${image})` }}
            />
          ) : loadingFile ? (
            <div className="w-16 h-16 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="w-12 h-12 mb-2" />
              <p className="text-2xl">Upload photo</p>
            </div>
          )}
        </div>

        {/* Configuration area */}
        <div className="aspect-square flex flex-col justify-center gap-4">
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

          <Button
            onClick={createPrediction}
            disabled={!image || loadingSubmit}
            variant="secondary"
            size="xl"
            className="w-full rounded-full"
          >
            {loadingSubmit ? 'Creating...' : 'Create hairstyle'}
          </Button>
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
