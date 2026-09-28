import { useState } from 'react'
import Cropper from 'react-easy-crop'
import { X } from 'lucide-react'
import { recortarImagenABlob } from '../../lib/cropImage'

export default function CropModal({ src, onCancelar, onConfirmar }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [pixelCrop, setPixelCrop] = useState(null)
  const [guardando, setGuardando] = useState(false)

  async function handleConfirmar() {
    if (!pixelCrop) return
    setGuardando(true)
    try {
      const blob = await recortarImagenABlob(src, pixelCrop)
      await onConfirmar(blob)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Ajustar foto</p>
          <button onClick={onCancelar} className="rounded-lg p-1.5 text-white/60 hover:bg-white/10" aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="relative h-80 w-full overflow-hidden rounded-xl bg-black">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, pixels) => setPixelCrop(pixels)}
          />
        </div>

        <label className="mt-4 block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full"
          />
        </label>

        <p className="mt-2 text-xs text-muted">Arrastra la imagen para elegir qué parte se muestra en el cuadro.</p>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onCancelar} className="btn-secondary" disabled={guardando}>
            Cancelar
          </button>
          <button onClick={handleConfirmar} className="btn-primary" disabled={guardando || !pixelCrop}>
            {guardando ? 'Guardando…' : 'Guardar foto'}
          </button>
        </div>
      </div>
    </div>
  )
}
