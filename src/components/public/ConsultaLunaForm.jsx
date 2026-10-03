import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import WhatsAppIcon from './WhatsAppIcon'
import { trackEvent } from '../../lib/analytics'
import {
  LADOS,
  PROBLEMAS,
  buildUrlConsultaLuna,
  parametrosAnalyticsConsultaLuna,
  validarConsultaLuna,
} from '../../lib/consultaLuna'

const VACIO = { marca: '', modelo: '', anio: '', lado: '', problema: '' }

function Campo({ id, label, error, className = '', children }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-xs font-medium text-white/80">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-xs text-brand-400">
          {error}
        </p>
      )}
    </div>
  )
}

// Formulario para armar una consulta de luna y abrir WhatsApp con el mensaje
// ya escrito. No guarda nada en Supabase: solo construye el enlace de WhatsApp.
export default function ConsultaLunaForm() {
  const location = useLocation()
  const [valores, setValores] = useState(VACIO)
  const [errores, setErrores] = useState({})

  function cambiar(campo, valor) {
    setValores((actuales) => ({ ...actuales, [campo]: valor }))
    if (errores[campo]) {
      setErrores((actuales) => {
        const siguientes = { ...actuales }
        delete siguientes[campo]
        return siguientes
      })
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    const nuevosErrores = validarConsultaLuna(valores)
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) {
      document.getElementById(Object.keys(nuevosErrores)[0])?.focus()
      return
    }

    // Se abre en pestaña nueva: en móvil wa.me abre la app de WhatsApp y en
    // escritorio abre WhatsApp Web.
    window.open(buildUrlConsultaLuna(valores), '_blank', 'noopener,noreferrer')
    trackEvent('luna_consulta_whatsapp', {
      page: location.pathname,
      service: 'lunas',
      ...parametrosAnalyticsConsultaLuna(valores),
    })
  }

  const hayErrores = Object.keys(errores).length > 0

  return (
    <form onSubmit={handleSubmit} noValidate className="card p-5 sm:p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo id="marca" label="Marca" error={errores.marca}>
          <input
            id="marca"
            type="text"
            value={valores.marca}
            onChange={(e) => cambiar('marca', e.target.value)}
            maxLength={40}
            autoComplete="off"
            placeholder="Ej. Chevrolet"
            aria-invalid={Boolean(errores.marca)}
            aria-describedby={errores.marca ? 'marca-error' : undefined}
            className="input text-base sm:text-sm"
          />
        </Campo>

        <Campo id="modelo" label="Modelo o línea" error={errores.modelo}>
          <input
            id="modelo"
            type="text"
            value={valores.modelo}
            onChange={(e) => cambiar('modelo', e.target.value)}
            maxLength={40}
            autoComplete="off"
            placeholder="Ej. Tracker"
            aria-invalid={Boolean(errores.modelo)}
            aria-describedby={errores.modelo ? 'modelo-error' : undefined}
            className="input text-base sm:text-sm"
          />
        </Campo>

        <Campo id="anio" label="Año" error={errores.anio}>
          <input
            id="anio"
            type="text"
            inputMode="numeric"
            value={valores.anio}
            onChange={(e) => cambiar('anio', e.target.value.replace(/\D/g, '').slice(0, 4))}
            autoComplete="off"
            placeholder="Ej. 2026"
            aria-invalid={Boolean(errores.anio)}
            aria-describedby={errores.anio ? 'anio-error' : undefined}
            className="input text-base sm:text-sm"
          />
        </Campo>

        <Campo id="lado" label="Lado del vehículo" error={errores.lado}>
          <select
            id="lado"
            value={valores.lado}
            onChange={(e) => cambiar('lado', e.target.value)}
            aria-invalid={Boolean(errores.lado)}
            aria-describedby={errores.lado ? 'lado-error' : undefined}
            className="input text-base sm:text-sm"
          >
            <option value="">Selecciona un lado</option>
            {LADOS.map((lado) => (
              <option key={lado} value={lado}>
                {lado}
              </option>
            ))}
          </select>
        </Campo>

        <Campo id="problema" label="¿Qué le pasó a la luna?" error={errores.problema} className="sm:col-span-2">
          <select
            id="problema"
            value={valores.problema}
            onChange={(e) => cambiar('problema', e.target.value)}
            aria-invalid={Boolean(errores.problema)}
            aria-describedby={errores.problema ? 'problema-error' : undefined}
            className="input text-base sm:text-sm"
          >
            <option value="">Selecciona una opción</option>
            {PROBLEMAS.map((problema) => (
              <option key={problema} value={problema}>
                {problema}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      {hayErrores && (
        <p role="alert" className="mt-4 text-sm text-brand-400">
          Completa los campos marcados para poder enviar la consulta.
        </p>
      )}

      <button type="submit" data-cta="formulario-lunas" className="btn-primary mt-5 w-full sm:w-auto">
        <WhatsAppIcon size={16} />
        Consultar disponibilidad por WhatsApp
      </button>
    </form>
  )
}
