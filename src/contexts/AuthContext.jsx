import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase, usuarioToEmail } from '../lib/supabaseClient'

const AuthContext = createContext(undefined)

const PERFIL_SELECT = 'id, nombre_usuario, nombre_completo, rol, activo'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [usuario, setUsuario] = useState(null)
  const [loading, setLoading] = useState(true)

  const cargarPerfil = useCallback(async (userId) => {
    if (!userId) {
      setUsuario(null)
      return null
    }
    const { data, error } = await supabase
      .from('usuarios')
      .select(PERFIL_SELECT)
      .eq('id', userId)
      .maybeSingle()

    if (error || !data) {
      setUsuario(null)
      return null
    }
    setUsuario(data)
    return data
  }, [])

  useEffect(() => {
    let activo = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!activo) return
      setSession(data.session)
      await cargarPerfil(data.session?.user?.id)
      setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession)
      await cargarPerfil(newSession?.user?.id)
    })

    return () => {
      activo = false
      subscription.subscription.unsubscribe()
    }
  }, [cargarPerfil])

  const login = useCallback(async (nombreUsuario, password) => {
    const email = usuarioToEmail(nombreUsuario)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data?.user) {
      throw new Error('Usuario o contraseña incorrectos')
    }

    const perfil = await cargarPerfil(data.user.id)

    if (!perfil) {
      await supabase.auth.signOut()
      throw new Error('No se encontró un perfil para este usuario. Contacta al administrador.')
    }

    if (!perfil.activo) {
      await supabase.auth.signOut()
      setUsuario(null)
      throw new Error('Tu usuario está desactivado. Contacta al administrador.')
    }

    return perfil
  }, [cargarPerfil])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setUsuario(null)
  }, [])

  const value = {
    session,
    usuario,
    loading,
    isAdmin: usuario?.rol === 'admin',
    isMecanico: usuario?.rol === 'mecanico',
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
