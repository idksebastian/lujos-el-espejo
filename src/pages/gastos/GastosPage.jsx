import { useEffect, useState } from 'react'
import { TriangleAlert, Plus, Trash2, Link2 } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { rangoDiaLocal } from '../../lib/fechas'
import MoneyInput from '../../components/MoneyInput'
import { useConfiguracion } from '../../contexts/ConfiguracionContext'

function hoyISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function GastosPage() {
  const { nombre_socio_1: nombreSocio1, nombre_socio_2: nombreSocio2 } = useConfiguracion()
  const [fecha, setFecha] = useState(hoyISO())
  const [gastos, setGastos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [monto, setMonto] = useState('')
  const [reparto, setReparto] = useState('ambos')
  const [guardando, setGuardando] = useState(false)

  async function cargar() {
    setCargando(true)
    setError('')
    const { desde, hasta } = rangoDiaLocal(fecha)
    const { data, error } = await supabase
      .from('gastos')
      .select('id, descripcion, monto, fecha, reparto, venta_id, registrador:usuarios(nombre_completo)')
      .gte('fecha', desde)
      .lte('fecha', hasta)
      .order('fecha', { ascending: false })

    if (error) setError(error.message)
    else setGastos(data ?? [])
    setCargando(false)
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha])

  async function handleAgregar(e) {
    e.preventDefault()
    const desc = descripcion.trim()
    const montoNum = Number(monto)
    if (!desc) return setError('Escribe qué fue el gasto.')
    if (!montoNum || montoNum <= 0) return setError('El monto debe ser mayor a 0.')

    setError('')
    setGuardando(true)
    const { data: userData } = await supabase.auth.getUser()
    const { error } = await supabase.from('gastos').insert({
      descripcion: desc,
      monto: montoNum,
      reparto,
      registrado_por: userData.user.id,
    })
    setGuardando(false)

    if (error) {
      setError(error.message)
      return
    }
    setDescripcion('')
    setMonto('')
    setReparto('ambos')
    cargar()
  }

  async function handleEliminar(id) {
    const { error } = await supabase.from('gastos').delete().eq('id', id)
    if (error) setError(error.message)
    else cargar()
  }

  function etiquetaReparto(r) {
    if (r === 'socio1') return `Solo ${nombreSocio1}`
    if (r === 'socio2') return `Solo ${nombreSocio2}`
    return 'Ambos socios'
  }

  const total = gastos.reduce((s, g) => s + Number(g.monto), 0)

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="font-display text-2xl text-white">Gastos del día</h1>
      <p className="text-sm text-muted">
        Gasolina, insumos, imprevistos — se descuentan del cierre del día. El mecánico nunca se ve afectado.
      </p>

      <form onSubmit={handleAgregar} className="card space-y-3 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto]">
          <input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej. Gasolina, papelería…"
            className="input"
          />
          <MoneyInput value={monto} onChange={setMonto} placeholder="Monto" className="sm:w-36" />
          <button type="submit" disabled={guardando} className="btn-primary">
            <Plus size={16} />
            {guardando ? 'Guardando…' : 'Agregar'}
          </button>
        </div>
        <label className="block sm:w-64">
          <span className="mb-1 block text-xs uppercase tracking-wide text-muted">¿A quién se le descuenta?</span>
          <select value={reparto} onChange={(e) => setReparto(e.target.value)} className="input">
            <option value="ambos">Ambos socios (50/50)</option>
            <option value="socio1">Solo {nombreSocio1}</option>
            <option value="socio2">Solo {nombreSocio2}</option>
          </select>
        </label>
      </form>

      <label className="block w-fit">
        <span className="mb-1 block text-xs uppercase tracking-wide text-muted">Fecha</span>
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="input" />
      </label>

      {error && (
        <p className="flex items-center gap-2 rounded-lg bg-brand-700/15 px-3 py-2 text-sm text-brand-400 ring-1 ring-brand-700/30">
          <TriangleAlert size={16} className="shrink-0" />
          {error}
        </p>
      )}

      {cargando ? (
        <p className="text-sm text-muted">Cargando…</p>
      ) : (
        <>
          <p className="text-sm text-muted">
            {gastos.length} gasto{gastos.length !== 1 && 's'} · Total ${total.toLocaleString('es-CO')}
          </p>
          <ul className="card divide-y divide-white/8 overflow-hidden">
            {gastos.map((g) => (
              <li key={g.id} className="flex items-center justify-between gap-2 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {g.descripcion}
                    {g.venta_id && <Link2 size={12} className="ml-1.5 inline text-muted" />}
                  </p>
                  <p className="text-xs text-muted">
                    {new Date(g.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} ·{' '}
                    {g.registrador?.nombre_completo ?? '—'} · {etiquetaReparto(g.reparto)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <p className="text-sm font-semibold text-white">${Number(g.monto).toLocaleString('es-CO')}</p>
                  <button
                    onClick={() => handleEliminar(g.id)}
                    className="rounded-lg p-1.5 text-muted hover:bg-white/8 hover:text-brand-400"
                    aria-label="Eliminar gasto"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </li>
            ))}
            {gastos.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted">Sin gastos este día</li>}
          </ul>
        </>
      )}
    </div>
  )
}
