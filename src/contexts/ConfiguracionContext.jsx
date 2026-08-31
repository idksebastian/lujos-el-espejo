import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './AuthContext'

const DEFAULTS = { nombre_socio_1: 'Socio 1', nombre_socio_2: 'Socio 2', nit_socio_1: null, nit_socio_2: null }

const ConfiguracionContext = createContext(undefined)

export function ConfiguracionProvider({ children }) {
  const { isAdmin } = useAuth()
  const [configuracion, setConfiguracion] = useState(DEFAULTS)

  const recargar = useCallback(async () => {
    if (!isAdmin) return
    const { data } = await supabase.from('configuracion').select('*').maybeSingle()
    if (data) setConfiguracion(data)
  }, [isAdmin])

  useEffect(() => {
    recargar()
  }, [recargar])

  return (
    <ConfiguracionContext.Provider value={{ ...configuracion, recargarConfiguracion: recargar }}>
      {children}
    </ConfiguracionContext.Provider>
  )
}

export function useConfiguracion() {
  const ctx = useContext(ConfiguracionContext)
  if (!ctx) throw new Error('useConfiguracion debe usarse dentro de <ConfiguracionProvider>')
  return ctx
}
