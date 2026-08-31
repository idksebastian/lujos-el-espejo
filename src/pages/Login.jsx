import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LogIn, TriangleAlert } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [nombreUsuario, setNombreUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const from = location.state?.from?.pathname || '/'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!nombreUsuario.trim() || !password) {
      setError('Ingresa tu usuario y contraseña')
      return
    }

    setEnviando(true)
    try {
      await login(nombreUsuario.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink px-4">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-xl -translate-x-1/2 rounded-full bg-brand-600/20 blur-3xl" />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-display text-3xl font-semibold tracking-wide text-white">
            LUJOS <span className="text-brand-500">EL ESPEJO</span>
          </p>
          <p className="mt-1 text-sm text-muted">Inventario y ventas</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4 p-8">
          <div>
            <label htmlFor="usuario" className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">
              Usuario
            </label>
            <input
              id="usuario"
              type="text"
              autoCapitalize="none"
              autoCorrect="off"
              placeholder="nombre.apellido"
              value={nombreUsuario}
              onChange={(e) => setNombreUsuario(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
          </div>

          {error && (
            <p className="flex items-center gap-2 rounded-lg bg-brand-700/20 px-3 py-2 text-sm text-brand-400 ring-1 ring-brand-700/40">
              <TriangleAlert size={16} className="shrink-0" />
              {error}
            </p>
          )}

          <button type="submit" disabled={enviando} className="btn-primary w-full">
            <LogIn size={16} />
            {enviando ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
