import { useRef, useState } from 'react'
import { Plus, Pencil, TriangleAlert } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import CropModal from './CropModal'

export default function FotoSlotAdmin({ slotKey, url, onGuardado }) {
  const { usuario } = useAuth()
  const inputRef = useRef(null)
  const [archivoSrc, setArchivoSrc] = useState(null)
  const [error, setError] = useState('')

  function handleSeleccionArchivo(e) {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (!archivo) return
    setError('')
    const reader = new FileReader()
    reader.onload = () => setArchivoSrc(reader.result)
    reader.readAsDataURL(archivo)
  }

  async function handleConfirmarRecorte(blob) {
    setError('')
    const path = `${slotKey}/${Date.now()}.jpg`
    const pathAnterior = url ? new URL(url).pathname.split('/sitio-fotos/')[1] : null

    const { error: errorSubida } = await supabase.storage.from('sitio-fotos').upload(path, blob, {
      contentType: 'image/jpeg',
      upsert: false,
    })
    if (errorSubida) return setError(errorSubida.message)

    const { data: publicUrlData } = supabase.storage.from('sitio-fotos').getPublicUrl(path)
    const nuevaUrl = publicUrlData.publicUrl

    const { error: errorUpsert } = await supabase.from('sitio_fotos').upsert(
      {
        slot_key: slotKey,
        url: nuevaUrl,
        storage_path: path,
        actualizado_por: usuario?.id ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'slot_key' }
    )
    if (errorUpsert) return setError(errorUpsert.message)

    if (pathAnterior && pathAnterior !== path) {
      await supabase.storage.from('sitio-fotos').remove([pathAnterior])
    }

    setArchivoSrc(null)
    onGuardado?.(nuevaUrl)
  }

  return (
    <div className="group relative aspect-square overflow-hidden rounded-xl border border-white/8 bg-linear-to-br from-surface to-surface-2">
      {url ? (
        <img src={url} alt="" className="size-full object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center text-white/20">
          <Plus size={28} />
        </div>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`absolute inset-0 flex items-center justify-center gap-1.5 bg-black/70 text-sm font-medium text-white opacity-0 transition group-hover:opacity-100 ${!url ? 'sm:opacity-100 sm:bg-black/40' : ''}`}
      >
        {url ? (
          <>
            <Pencil size={16} />
            Editar
          </>
        ) : (
          <>
            <Plus size={16} />
            Subir
          </>
        )}
      </button>

      <input ref={inputRef} type="file" accept="image/*" onChange={handleSeleccionArchivo} className="hidden" />

      {error && (
        <p className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-brand-700/90 px-2 py-1 text-[11px] text-white">
          <TriangleAlert size={12} className="shrink-0" />
          {error}
        </p>
      )}

      {archivoSrc && (
        <CropModal src={archivoSrc} onCancelar={() => setArchivoSrc(null)} onConfirmar={handleConfirmarRecorte} />
      )}
    </div>
  )
}
