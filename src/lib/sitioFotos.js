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

// El "Nuestro trabajo" del Home no tiene espacio propio para subir fotos —
// reutiliza la primera foto de cada galería de servicio (Lunas aporta dos,
// por ser la especialidad) para no pedirles subir la misma foto dos veces.
export const GALERIA_HOME = [
  'lunas-galeria-1',
  'servicio-plumillas-1',
  'servicio-bombilleria-1',
  'servicio-proteccion-antirrobo-1',
  'servicio-identicar-1',
  'lunas-galeria-2',
]

// Texto alternativo por defecto según la categoría del espacio (lo que el
// admin eligió al ubicar la foto). Describe la categoría, no una foto puntual,
// porque el sistema no sabe qué muestra cada imagen. Un alt propio guardado
// en la columna `alt` de sitio_fotos tiene prioridad sobre este.
const ALT_POR_CATEGORIA = {
  'lunas-galeria': 'Trabajo de luna para carro, Lujos El Espejo en Pereira',
  'servicio-plumillas': 'Cambio de plumillas para carro',
  'servicio-bombilleria': 'Bombillería LED para vehículo',
  'servicio-proteccion-antirrobo': 'Protección antirrobo para emblemas y lunas de carro',
  'servicio-identicar': 'Placa grabada en la luna con Identicar',
  'productos-lunas': 'Luna de espejo para carro',
  'productos-plumillas': 'Plumillas para carro',
  'productos-bombilleria': 'Bombillería LED para vehículo',
  'productos-proteccion-antirrobo': 'Protección antirrobo para carro',
  'productos-identicar': 'Identicar en luna de carro',
}

export function altPorSlot(slotKey, alts) {
  const propio = alts?.[slotKey]
  if (propio) return propio
  const categoria = slotKey.replace(/-\d+$/, '')
  return ALT_POR_CATEGORIA[categoria] ?? ''
}

export function useSitioFotos() {
  const [fotos, setFotos] = useState({})
  const [alts, setAlts] = useState({})
  const [cargando, setCargando] = useState(true)

  async function recargar() {
    setCargando(true)
    // La columna `alt` llega con la migración 0014. Mientras no esté aplicada
    // en Supabase, la consulta con `alt` falla: en ese caso se lee solo
    // slot_key y url, para que las fotos sigan viéndose igual.
    let { data, error } = await supabase.from('sitio_fotos').select('slot_key, url, alt')
    if (error) ({ data } = await supabase.from('sitio_fotos').select('slot_key, url'))
    const filas = data ?? []
    setFotos(Object.fromEntries(filas.map((r) => [r.slot_key, r.url])))
    setAlts(Object.fromEntries(filas.filter((r) => r.alt).map((r) => [r.slot_key, r.alt])))
    setCargando(false)
  }

  useEffect(() => {
    recargar()
  }, [])

  return { fotos, alts, cargando, recargar }
}
