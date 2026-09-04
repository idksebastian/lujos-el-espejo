import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// El catálogo de una tienda como esta es pequeño (decenas/pocas centenas de
// productos), así que se carga una sola vez al montar y el filtrado es en
// memoria: sin ida y vuelta al servidor ni debounce por cada tecla, la
// búsqueda responde al instante mientras se escribe.
export default function ProductoAutocomplete({ onSelect }) {
  const [term, setTerm] = useState('')
  const [productos, setProductos] = useState([])
  const [abierto, setAbierto] = useState(false)

  useEffect(() => {
    supabase
      .from('productos')
      .select('id, nombre, costo, precio_sugerido, stock_actual, codigo_barras')
      .eq('activo', true)
      .order('nombre')
      .then(({ data, error }) => {
        if (!error) setProductos(data ?? [])
      })
  }, [])

  const resultados = useMemo(() => {
    const texto = term.trim().toLowerCase()
    if (!texto) return []
    return productos.filter((p) => p.nombre.toLowerCase().includes(texto)).slice(0, 8)
  }, [term, productos])

  function elegir(producto) {
    onSelect(producto)
    setTerm('')
    setAbierto(false)
  }

  return (
    <div className="relative">
      <input
        value={term}
        onChange={(e) => {
          setTerm(e.target.value)
          setAbierto(true)
        }}
        onFocus={() => resultados.length > 0 && setAbierto(true)}
        onBlur={() => setTimeout(() => setAbierto(false), 150)}
        placeholder="Buscar producto por nombre…"
        className="input"
      />
      {abierto && resultados.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-white/10 bg-surface-2 shadow-xl">
          {resultados.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => elegir(p)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-white hover:bg-white/8"
              >
                <span className="min-w-0 flex-1 truncate">{p.nombre}</span>
                <span className="ml-2 flex shrink-0 flex-col items-end text-xs">
                  {p.precio_sugerido != null && (
                    <span className="text-emerald-400">${Number(p.precio_sugerido).toLocaleString('es-CO')}</span>
                  )}
                  <span className="text-muted">stock {p.stock_actual}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
