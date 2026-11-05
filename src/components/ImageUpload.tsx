'use client'

import { useState } from 'react'
import { supabase, OrderImage } from '@/lib/supabase'
import { Camera, X, Upload, Loader2 } from 'lucide-react'

interface ImageUploadProps {
  orderId: string
  images: OrderImage[]
  onImagesChange: (images: OrderImage[]) => void
}

export default function ImageUpload({ orderId, images, onImagesChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    const newImages: OrderImage[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const ext = file.name.split('.').pop()
      const fileName = `${orderId}/${Date.now()}-${i}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('order-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: false })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        continue
      }

      const { data: urlData } = supabase.storage
        .from('order-images')
        .getPublicUrl(fileName)

      const { data: imgRecord, error: dbError } = await supabase
        .from('order_images')
        .insert({
          order_id: orderId,
          file_name: file.name,
          file_path: fileName,
          file_url: urlData.publicUrl,
        })
        .select()
        .single()

      if (!dbError && imgRecord) {
        newImages.push(imgRecord as OrderImage)
      }
    }

    onImagesChange([...images, ...newImages])
    setUploading(false)
    e.target.value = ''
  }

  async function removeImage(img: OrderImage) {
    if (!confirm('Remover esta imagem?')) return

    await supabase.storage.from('order-images').remove([img.file_path])
    await supabase.from('order_images').delete().eq('id', img.id)
    onImagesChange(images.filter(i => i.id !== img.id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-700">Fotos do Equipamento</h3>
        <label className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-colors ${
          uploading ? 'bg-gray-100 text-gray-400' : 'bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20'
        }`}>
          {uploading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
          ) : (
            <><Camera className="w-4 h-4" /> Adicionar Fotos</>
          )}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {images.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
          <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Nenhuma foto anexada</p>
          <p className="text-xs text-gray-300 mt-1">Clique em &quot;Adicionar Fotos&quot; ou arraste imagens</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map(img => (
            <div key={img.id} className="group relative aspect-square rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
              <img
                src={img.file_url}
                alt={img.file_name}
                className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setPreview(img.file_url)}
              />
              <button
                onClick={() => removeImage(img)}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[10px] text-white truncate">{img.file_name}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <button onClick={() => setPreview(null)} className="absolute top-4 right-4 text-white/80 hover:text-white">
            <X className="w-8 h-8" />
          </button>
          <img src={preview} alt="Preview" className="max-w-full max-h-[90vh] rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}
