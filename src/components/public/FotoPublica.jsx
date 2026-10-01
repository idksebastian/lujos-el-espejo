import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

// Muestra la foto real subida desde /admin/sitio-web para este slot, o el
// degradado placeholder mientras no exista una — así las páginas públicas
// no dependen de que las fotos ya estén cargadas para verse bien. Si hay
// foto, es clicable: abre un visor a pantalla completa para ver el detalle.
export default function FotoPublica({ slotKey, fotos, className = '' }) {
  const [abierta, setAbierta] = useState(false)
  const url = fotos?.[slotKey]

  useEffect(() => {
    if (!abierta) return
    function onKeyDown(e) {
      if (e.key === 'Escape') setAbierta(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [abierta])

  if (!url) {
    return <div className={`${className} bg-linear-to-br from-surface to-surface-2`} />
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setAbierta(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setAbierta(true)
        }}
        className={`${className} cursor-zoom-in overflow-hidden`}
      >
        <img src={url} alt="" loading="lazy" className="size-full object-cover" />
      </div>

      {abierta && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setAbierta(false)}
        >
          <button
            type="button"
            onClick={() => setAbierta(false)}
            aria-label="Cerrar"
            className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X size={20} />
          </button>
          <img
            src={url}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-full rounded-lg object-contain"
          />
        </div>
      )}
    </>
  )
}
