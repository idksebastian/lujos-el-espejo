import { useEffect, useState } from 'react'
import { Download, Share2 } from 'lucide-react'
import { descargarBlob, puedeCompartirArchivo, compartirArchivo } from '../lib/exportImagen'

// Vista previa de una imagen generada (factura o cierre) con dos acciones
// separadas y explícitas: descargar (siempre disponible, primero) y
// compartir (aparte, solo si el navegador lo soporta). Nunca comparte de
// forma automática — eso es justo lo que causaba que la imagen llegara a
// veces "sin poder abrirse" del otro lado.
export default function ImagenGeneradaPreview({ blob, nombreArchivo, textoCompartir }) {
  const [url, setUrl] = useState(null)
  const [compartiendo, setCompartiendo] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const objectUrl = URL.createObjectURL(blob)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [blob])

  async function handleCompartir() {
    setError('')
    setCompartiendo(true)
    try {
      await compartirArchivo(blob, nombreArchivo, textoCompartir)
    } catch (err) {
      if (err?.name !== 'AbortError') setError('No se pudo compartir: ' + err.message)
    } finally {
      setCompartiendo(false)
    }
  }

  return (
    <div className="space-y-3">
      {url && (
        <img src={url} alt={nombreArchivo} className="mx-auto max-h-[70vh] w-full max-w-xs rounded-lg border border-white/10 object-contain" />
      )}

      <button onClick={() => descargarBlob(blob, nombreArchivo)} className="btn-primary w-full">
        <Download size={16} />
        Descargar imagen
      </button>

      {puedeCompartirArchivo(blob, nombreArchivo) && (
        <button onClick={handleCompartir} disabled={compartiendo} className="btn-secondary w-full">
          <Share2 size={16} />
          {compartiendo ? 'Abriendo…' : 'Compartir'}
        </button>
      )}

      {error && <p className="text-center text-xs text-brand-400">{error}</p>}
    </div>
  )
}
