"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Upload } from "lucide-react"
import { hairstyleItems, shadeItems, colorItems } from "@/lib/hair-config"

export function Hairstyle() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [image, setImage] = useState<string | null>(null)
  const [hairstyle, setHairstyle] = useState('fade hairstyle')
  const [shade, setShade] = useState('regular')
  const [color, setColor] = useState('blonde')
  const [loadingFile, setLoadingFile] = useState(false)

  const onClickUpload = () => {
    if (loadingFile) return
    fileInputRef.current?.click()
  }

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImage(null)
    setLoadingFile(true)
    
    try {
      const file = e.target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = () => {
        setImage(String(reader.result))
      }
      reader.readAsDataURL(file)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingFile(false)
    }
  }

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
                <Upload className="w-16 h-16 mb-6 group-hover:scale-110 transition-transform" />
                <p className="text-xs tracking-widest uppercase mb-2">UPLOAD_IMAGE</p>
                <p className="text-[10px] tracking-wider opacity-50">CLICK_TO_SELECT</p>
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
            disabled={!image}
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
    </main>
  )
}