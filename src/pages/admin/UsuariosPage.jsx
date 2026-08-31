import { useEffect, useState } from 'react'
import { KeyRound, Power, TriangleAlert, CircleCheck } from 'lucide-react'
import { supabase, AUTH_FAKE_DOMAIN } from '../../lib/supabaseClient'

const VACIO = { nombre_usuario: '', nombre_completo: '', password: '', rol: 'mecanico' }

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([])
  const [form, setForm] = useState(VACIO)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [resetId, setResetId] = useState(null)
  const [resetPassword, setResetPassword] = useState('')

  async function cargar() {
    const { data } = await supabase
      .from('usuarios')
      .select('id, nombre_usuario, nombre_completo, rol, activo')
      .order('nombre_completo')
    setUsuarios(data ?? [])
  }

  useEffect(() => {
    cargar()
  }, [])

  async function handleCrear(e) {
    e.preventDefault()
    setError('')
    setOk('')
    setGuardando(true)

    const { data, error } = await supabase.functions.invoke('admin-users', {
      body: { action: 'create', ...form },
    })

    setGuardando(false)

    if (error || data?.error) {
      setError(data?.error || error.message)
      return
    }

    setOk(`Usuario "${form.nombre_usuario}" creado correctamente`)
    setForm(VACIO)
    cargar()
  }

  async function toggleActivo(u) {
    const { error } = await supabase.from('usuarios').update({ activo: !u.activo }).eq('id', u.id)
    if (error) setError(error.message)
    else cargar()
  }

  async function handleReset(e) {
    e.preventDefault()
    setError('')
    setOk('')

    const { data, error } = await supabase.functions.invoke('admin-users', {
      body: { action: 'reset_password', usuario_id: resetId, password: resetPassword },
    })

    if (error || data?.error) {
      setError(data?.error || error.message)
      return
    }

    setOk('Contraseña actualizada')
    setResetId(null)
    setResetPassword('')
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="font-display text-2xl text-white">Usuarios</h1>

      <form onSubmit={handleCrear} className="card space-y-3 p-4">
        <p className="text-sm font-medium text-white/80">Nuevo usuario</p>

        <input
          value={form.nombre_usuario}
          onChange={(e) => setForm((f) => ({ ...f, nombre_usuario: e.target.value }))}
          placeholder="nombre.apellido"
          className="input"
        />
        <p className="-mt-2 text-xs text-muted">
          Correo interno: {form.nombre_usuario || 'nombre.apellido'}@{AUTH_FAKE_DOMAIN}
        </p>

        <input
          value={form.nombre_completo}
          onChange={(e) => setForm((f) => ({ ...f, nombre_completo: e.target.value }))}
          placeholder="Nombre completo"
          className="input"
        />
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          placeholder="Contraseña (mín. 6 caracteres)"
          className="input"
        />
        <select value={form.rol} onChange={(e) => setForm((f) => ({ ...f, rol: e.target.value }))} className="input">
          <option value="mecanico">Mecánico (solo inventario)</option>
          <option value="admin">Admin (acceso completo)</option>
        </select>

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
          {guardando ? 'Creando…' : 'Crear usuario'}
        </button>
      </form>

      <ul className="card divide-y divide-white/8 overflow-hidden">
        {usuarios.map((u) => (
          <li key={u.id} className={`px-4 py-3 ${!u.activo ? 'opacity-50' : ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">{u.nombre_completo}</p>
                <p className="text-xs text-muted">
                  {u.nombre_usuario} · {u.rol}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setResetId(resetId === u.id ? null : u.id)}
                  className="rounded-lg border border-white/10 p-2 text-white/70 hover:bg-white/8 hover:text-white"
                  aria-label="Cambiar contraseña"
                >
                  <KeyRound size={14} />
                </button>
                <button
                  onClick={() => toggleActivo(u)}
                  className="rounded-lg border border-white/10 p-2 text-white/70 hover:bg-white/8 hover:text-white"
                  aria-label={u.activo ? 'Desactivar' : 'Activar'}
                >
                  <Power size={14} />
                </button>
              </div>
            </div>

            {resetId === u.id && (
              <form onSubmit={handleReset} className="mt-3 flex gap-2">
                <input
                  type="password"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="Nueva contraseña"
                  className="input"
                />
                <button type="submit" className="btn-primary shrink-0 px-3 py-2 text-xs">
                  Guardar
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
