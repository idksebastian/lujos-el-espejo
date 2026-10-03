import { useRef, useState } from 'react'
import { Plus, Pencil, TriangleAlert } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import { altPorSlot } from '../../lib/sitioFotos'
import CropModal from './CropModal'

export default function FotoSlotAdmin({ slotKey, url, alt, onGuardado }) {
  const { usuario } = useAuth()
  const inputRef = useRef(null)
  const [archivoSrc, setArchivoSrc] = useState(null)
  const [error, setError] = useState('')
  const [altGuardado, setAltGuardado] = useState(alt ?? '')
  const [editandoAlt, setEditandoAlt] = useState(false)
  const [textoAlt, setTextoAlt] = useState('')
  const [guardandoAlt, setGuardandoAlt] = useState(false)
  const [errorAlt, setErrorAlt] = useState('')

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

    // El ALT describía la foto anterior: se limpia para que la nueva use el
    // texto por defecto de su categoría hasta que alguien escriba uno propio.
    // Si la columna alt aún no existe (migración 0014 sin aplicar), este
    // update falla sin efecto y se ignora: no hay alt que limpiar.
    if (altGuardado) {
      await supabase.from('sitio_fotos').update({ alt: null }).eq('slot_key', slotKey)
      setAltGuardado('')
    }

    if (pathAnterior && pathAnterior !== path) {
      await supabase.storage.from('sitio-fotos').remove([pathAnterior])
    }

    setArchivoSrc(null)
    onGuardado?.(nuevaUrl)
  }

  function abrirEditorAlt() {
    setTextoAlt(altGuardado)
    setErrorAlt('')
    setEditandoAlt(true)
  }

  async function handleGuardarAlt(e) {
    e.preventDefault()
    const limpio = textoAlt.trim()
    setGuardandoAlt(true)
    setErrorAlt('')
    // Vacío se guarda como null: la foto vuelve al texto por defecto de su categoría.
    const { error: errorAltGuardado } = await supabase
      .from('sitio_fotos')
      .update({ alt: limpio || null })
      .eq('slot_key', slotKey)
    setGuardandoAlt(false)
    if (errorAltGuardado) return setErrorAlt(errorAltGuardado.message)
    setAltGuardado(limpio)
    setEditandoAlt(false)
  }

  return (
    <div className="group relative aspect-square overflow-hidden rounded-xl border border-white/8 bg-linear-to-br from-surface to-surface-2">
      {url ? (
        <img src={url} alt={altGuardado || altPorSlot(slotKey)} className="size-full object-cover" />
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

      {url && !editandoAlt && (
        <button
          type="button"
          onClick={abrirEditorAlt}
          title={altGuardado ? `ALT: ${altGuardado}` : 'Escribir texto alternativo'}
          className={`absolute left-1.5 top-1.5 z-10 rounded-md px-2 py-1 text-[11px] font-semibold text-white transition hover:bg-black/90 ${altGuardado ? 'bg-black/70' : 'bg-brand-700/90'}`}
        >
          ALT
        </button>
      )}

      {editandoAlt && (
        <form
          onSubmit={handleGuardarAlt}
          className="absolute inset-0 z-20 flex flex-col justify-center gap-2 bg-ink/95 p-3"
        >
          <label htmlFor={`alt-${slotKey}`} className="text-[11px] font-medium text-white/80">
            Texto alternativo (ALT)
          </label>
          <textarea
            id={`alt-${slotKey}`}
            value={textoAlt}
            onChange={(e) => setTextoAlt(e.target.value)}
            maxLength={125}
            rows={3}
            placeholder={altPorSlot(slotKey)}
            className="w-full resize-none rounded-md border border-white/15 bg-surface px-2 py-1.5 text-xs text-white outline-none focus:border-brand-500"
          />
          <p className="text-[10px] text-muted">Vacío = usa el texto por defecto de la categoría.</p>
          {errorAlt && <p className="text-[11px] text-brand-400">{errorAlt}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={guardandoAlt} className="btn-primary flex-1 text-xs">
              {guardandoAlt ? 'Guardando…' : 'Guardar'}
            </button>
            <button type="button" onClick={() => setEditandoAlt(false)} className="btn-secondary text-xs">
              Cancelar
            </button>
          </div>
        </form>
      )}

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
