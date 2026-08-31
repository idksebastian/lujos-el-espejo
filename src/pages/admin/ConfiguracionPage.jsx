import { useEffect, useState } from 'react'
import { CircleCheck, TriangleAlert } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useConfiguracion } from '../../contexts/ConfiguracionContext'

export default function ConfiguracionPage() {
  const config = useConfiguracion()
  const [form, setForm] = useState({ nombre_socio_1: '', nombre_socio_2: '', nit_socio_1: '', nit_socio_2: '' })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  useEffect(() => {
    setForm({
      nombre_socio_1: config.nombre_socio_1 ?? '',
      nombre_socio_2: config.nombre_socio_2 ?? '',
      nit_socio_1: config.nit_socio_1 ?? '',
      nit_socio_2: config.nit_socio_2 ?? '',
    })
  }, [config.nombre_socio_1, config.nombre_socio_2, config.nit_socio_1, config.nit_socio_2])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setOk('')

    if (!form.nombre_socio_1.trim() || !form.nombre_socio_2.trim()) {
      return setError('Los dos nombres son obligatorios')
    }

    setGuardando(true)
    const { error } = await supabase
      .from('configuracion')
      .update({
        nombre_socio_1: form.nombre_socio_1.trim(),
        nombre_socio_2: form.nombre_socio_2.trim(),
        nit_socio_1: form.nit_socio_1.trim() || null,
        nit_socio_2: form.nit_socio_2.trim() || null,
      })
      .eq('id', true)
    setGuardando(false)

    if (error) return setError(error.message)
    setOk('Configuración guardada')
    config.recargarConfiguracion()
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="font-display text-2xl text-white">Configuración</h1>

      <form onSubmit={handleSubmit} className="card space-y-4 p-4">
        <div>
          <p className="text-sm font-medium text-white/80">Nombres para el reparto</p>
          <p className="text-xs text-muted">
            Estos nombres son los que aparecen en las ventas, el reparto y el cierre del día — cada quien con su
            propio nombre.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">Nombre — socio 1</span>
            <input
              value={form.nombre_socio_1}
              onChange={(e) => setForm((f) => ({ ...f, nombre_socio_1: e.target.value }))}
              className="input"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">Nombre — socio 2</span>
            <input
              value={form.nombre_socio_2}
              onChange={(e) => setForm((f) => ({ ...f, nombre_socio_2: e.target.value }))}
              className="input"
            />
          </label>
        </div>

        <div className="border-t border-white/8 pt-4">
          <p className="text-sm font-medium text-white/80">NIT para la factura (opcional)</p>
          <p className="text-xs text-muted">
            El negocio no tiene NIT propio. Si un cliente lo pide, puedes ofrecer el de uno de los socios — al generar
            la factura podrás elegir cuál incluir, o ninguno.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">
              NIT — {form.nombre_socio_1 || 'socio 1'}
            </span>
            <input
              value={form.nit_socio_1}
              onChange={(e) => setForm((f) => ({ ...f, nit_socio_1: e.target.value }))}
              placeholder="Sin NIT"
              className="input"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">
              NIT — {form.nombre_socio_2 || 'socio 2'}
            </span>
            <input
              value={form.nit_socio_2}
              onChange={(e) => setForm((f) => ({ ...f, nit_socio_2: e.target.value }))}
              placeholder="Sin NIT"
              className="input"
            />
          </label>
        </div>

        {error && (
          <p className="flex items-center gap-2 rounded-lg bg-brand-700/15 px-3 py-2 text-sm text-brand-400 ring-1 ring-brand-700/30">
            <TriangleAlert size={16} className="shrink-0" />
            {error}
          </p>
        )}
        {ok && (
          <p className="flex items-center gap-2 rounded-lg bg-emerald-950/60 px-3 py-2 text-sm text-emerald-300 ring-1 ring-emerald-900">
            <CircleCheck size={16} className="shrink-0" />
            {ok}
          </p>
        )}

        <button type="submit" disabled={guardando} className="btn-primary w-full">
          {guardando ? 'Guardando…' : 'Guardar configuración'}
        </button>
      </form>
    </div>
  )
}
