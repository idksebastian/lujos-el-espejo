import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { CATEGORIAS } from './publicContent'

function secuencia(prefijo, n) {
  return Array.from({ length: n }, (_, i) => `${prefijo}-${i + 1}`)
}

// Manifiesto de todos los "espacios" de foto del sitio público, agrupados
// tal como se ven en la página real — generado a partir de CATEGORIAS para
// no desincronizarse si cambian los servicios. Cada slot es cuadrado
// (aspect-square en todas las galerías públicas), por eso el recorte del
// admin siempre usa relación 1:1.
export const SECCIONES_FOTOS = [
  { titulo: 'Inicio — "Nuestro trabajo"', slots: secuencia('home-trabajo', 6) },
  { titulo: 'Lunas — Trabajos realizados', slots: secuencia('lunas-galeria', 6) },
  ...CATEGORIAS.filter((c) => c.grupo === 'servicios').map((s) => ({
    titulo: `${s.nombre} — Trabajos realizados`,
    slots: secuencia(`servicio-${s.id}`, 4),
  })),
  ...CATEGORIAS.map((c) => ({
    titulo: `Productos — ${c.nombre}`,
    slots: secuencia(`productos-${c.id}`, 4),
  })),
]

export function useSitioFotos() {
  const [fotos, setFotos] = useState({})
  const [cargando, setCargando] = useState(true)

  async function recargar() {
    setCargando(true)
    const { data } = await supabase.from('sitio_fotos').select('slot_key, url')
    setFotos(Object.fromEntries((data ?? []).map((r) => [r.slot_key, r.url])))
    setCargando(false)
  }

  useEffect(() => {
    recargar()
  }, [])

  return { fotos, cargando, recargar }
}
