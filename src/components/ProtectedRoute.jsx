import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ roles }) {
  const { usuario, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink text-muted">Cargando…</div>
    )
  }

  if (!usuario) {
    return <Navigate to="/admin/login" replace />
  }

  if (roles && !roles.includes(usuario.rol)) {
    return <Navigate to="/admin" replace />
  }

  return <Outlet />
}
