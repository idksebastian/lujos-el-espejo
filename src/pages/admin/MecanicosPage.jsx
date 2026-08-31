import { useEffect, useState } from 'react'
import { Power, TriangleAlert } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

export default function MecanicosPage() {
  const [mecanicos, setMecanicos] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [nombre, setNombre] = useState('')
  const [usuarioId, setUsuarioId] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  async function cargar() {
    const [{ data: m }, { data: u }] = await Promise.all([
      supabase.from('mecanicos').select('id, nombre, activo, usuario_id, usuarios(nombre_completo)').order('nombre'),
      supabase.from('usuarios').select('id, nombre_completo').order('nombre_completo'),
    ])
    setMecanicos(m ?? [])
    setUsuarios(u ?? [])
  }

  useEffect(() => {
    cargar()
  }, [])

  async function handleCrear(e) {
    e.preventDefault()
    setError('')
    if (!nombre.trim()) return setError('El nombre es obligatorio')

    setGuardando(true)
    const { error } = await supabase.from('mecanicos').insert({
      nombre: nombre.trim(),
      usuario_id: usuarioId || null,
    })
    setGuardando(false)

    if (error) return setError(error.message)
    setNombre('')
    setUsuarioId('')
    cargar()
  }

  async function toggleActivo(m) {
    const { error } = await supabase.from('mecanicos').update({ activo: !m.activo }).eq('id', m.id)
    if (error) setError(error.message)
    else cargar()
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="font-display text-2xl text-white">Mecánicos</h1>

      <form onSubmit={handleCrear} className="card space-y-3 p-4">
        <p className="text-sm font-medium text-white/80">Nuevo mecánico</p>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" className="input" />
        <select value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)} className="input">
          <option value="">Sin cuenta de acceso vinculada</option>
          {usuarios.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nombre_completo}
            </option>
          ))}
        </select>
        {error && (
          <p className="flex items-center gap-2 rounded-lg bg-brand-700/15 px-3 py-2 text-sm text-brand-400 ring-1 ring-brand-700/30">
            <TriangleAlert size={16} className="shrink-0" />
            {error}
          </p>
        )}
        <button type="submit" disabled={guardando} className="btn-primary w-full">
          {guardando ? 'Guardando…' : 'Agregar mecánico'}
        </button>
      </form>

      <ul className="card divide-y divide-white/8 overflow-hidden">
        {mecanicos.map((m) => (
          <li key={m.id} className={`flex items-center justify-between px-4 py-3 ${!m.activo ? 'opacity-50' : ''}`}>
            <div>
              <p className="text-sm font-medium text-white">{m.nombre}</p>
              {m.usuarios && <p className="text-xs text-muted">Cuenta: {m.usuarios.nombre_completo}</p>}
            </div>
            <button
              onClick={() => toggleActivo(m)}
              className="rounded-lg border border-white/10 p-2 text-white/70 hover:bg-white/8 hover:text-white"
              aria-label={m.activo ? 'Desactivar' : 'Activar'}
            >
              <Power size={14} />
            </button>
          </li>
        ))}
        {mecanicos.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-muted">Sin mecánicos registrados</li>
        )}
      </ul>
    </div>
  )
}
