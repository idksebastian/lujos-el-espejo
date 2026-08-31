import { useEffect, useRef, useState } from 'react'
import { BarcodeDetector } from 'barcode-detector/ponyfill'
import { X, TriangleAlert, RotateCw, Flashlight, FlashlightOff, Keyboard } from 'lucide-react'

// Formatos de código de barras reales de producto + QR. Se usa la
// implementación en WebAssembly (ZXing-C++) en vez del BarcodeDetector
// nativo del navegador: funciona igual en todos los navegadores (incluido
// iOS Safari, que no tiene BarcodeDetector nativo) y lee de forma continua
// sobre el video en vivo -muchos intentos por segundo, como escanean apps
// como Fitia- en vez de depender de una sola foto bien encuadrada.
const FORMATOS_SOPORTADOS = ['qr_code', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf']
// A 720p, decodificar un cuadro ya toma su tiempo de por sí; esta espera es
// aparte de eso (se suma después de cada intento), así que se deja mínima
// para no sumarle lentitud extra encima del trabajo real de decodificar.
const INTERVALO_MS = 50

// Un QR de prueba confirmó que el detector funciona perfecto incluso a la
// resolución por defecto (640x480) — el problema real es que 640x480 no
// alcanza para distinguir las barras finas de un código de barras 1D
// pequeño en un producto real. La pantalla negra que salió antes al pedir
// resolución (1920x1080+focusMode, y luego 1280x720 solo) coincidió con
// sesiones ya muy fatigadas de abrir/cerrar el escáner muchas veces
// seguidas en el mismo iPhone — no se repitió con la cámara recién sana.
// Se reintenta 1280x720 sin "advanced" (el constraint más simple posible).
const CONSTRAINTS_VIDEO = {
  facingMode: { ideal: 'environment' },
  width: { ideal: 1280 },
  height: { ideal: 720 },
}

// Pitido corto sintetizado con Web Audio — no requiere cargar ningún
// archivo de audio. Se dispara solo al detectar con la cámara (no en la
// entrada manual), como retroalimentación de "código leído".
function reproducirBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 1046.5
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.15)
    osc.onended = () => ctx.close()
  } catch {
    // Audio no disponible (autoplay bloqueado, navegador sin soporte, etc.) — no es crítico.
  }
}

export default function BarcodeScannerModal({ open, title = 'Escanear código', onClose, onDetected }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const detectorRef = useRef(null)
  const onDetectedRef = useRef(onDetected)
  const [camaras, setCamaras] = useState([])
  const [camaraIndex, setCamaraIndex] = useState(0)
  const [error, setError] = useState('')
  const [torchDisponible, setTorchDisponible] = useState(false)
  const [torchOn, setTorchOn] = useState(false)
  const [manualAbierto, setManualAbierto] = useState(false)
  const [manualValor, setManualValor] = useState('')
  const [diag, setDiag] = useState({ resolucion: '', intentos: 0, ultimoError: '' })

  onDetectedRef.current = onDetected

  useEffect(() => {
    if (!open) return

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Este navegador no soporta acceso a la cámara. Intenta con Chrome o Safari actualizado.')
      return
    }

    let cancelled = false
    let detectando = false
    let detectado = false
    let timer = null
    setError('')
    setTorchDisponible(false)
    setTorchOn(false)
    setManualAbierto(false)
    setManualValor('')
    setDiag({ resolucion: '', intentos: 0, ultimoError: '' })
    detectorRef.current = new BarcodeDetector({ formats: FORMATOS_SOPORTADOS })

    function actualizarTorch(stream) {
      const caps = stream.getVideoTracks()[0]?.getCapabilities?.() ?? {}
      setTorchDisponible(!!caps.torch)
    }

    async function iniciar() {
      try {
        // Pide la cámara trasera de entrada. Los labels de los dispositivos
        // solo quedan disponibles despues de conceder permiso, por eso se
        // pide primero y se enumera despues.
        const streamInicial = await navigator.mediaDevices.getUserMedia({ video: CONSTRAINTS_VIDEO })

        if (cancelled) {
          streamInicial.getTracks().forEach((t) => t.stop())
          return
        }

        const dispositivos = await navigator.mediaDevices.enumerateDevices()
        const videos = dispositivos.filter((d) => d.kind === 'videoinput')
        setCamaras(videos)

        const labelActual = streamInicial.getVideoTracks()[0]?.label
        const indexInicial = Math.max(0, videos.findIndex((v) => v.label === labelActual))
        setCamaraIndex(indexInicial)

        streamRef.current = streamInicial
        if (videoRef.current) videoRef.current.srcObject = streamInicial
        actualizarTorch(streamInicial)

        const settings = streamInicial.getVideoTracks()[0]?.getSettings?.() ?? {}
        setDiag((d) => ({ ...d, resolucion: `${settings.width ?? '?'}×${settings.height ?? '?'}` }))

        loopDeteccion()
      } catch (err) {
        if (cancelled) return
        console.error(err)
        const denegado = err?.name === 'NotAllowedError' || String(err).toLowerCase().includes('permission')
        setError(
          denegado
            ? 'Permiso de cámara denegado. Actívalo en la configuración del navegador para poder escanear.'
            : 'No se pudo iniciar la cámara. Verifica que el dispositivo tenga una cámara disponible.'
        )
      }
    }

    function loopDeteccion() {
      timer = setTimeout(async () => {
        if (cancelled || detectado) return
        const video = videoRef.current
        if (detectando || !video || video.readyState < 2) {
          loopDeteccion()
          return
        }
        detectando = true
        try {
          const resultados = await detectorRef.current.detect(video)
          setDiag((d) => ({ ...d, intentos: d.intentos + 1 }))
          if (!cancelled && !detectado && resultados.length > 0) {
            detectado = true
            reproducirBeep()
            onDetectedRef.current(resultados[0].rawValue)
            return
          }
        } catch (err) {
          console.error('[scanner]', err)
          setDiag((d) => ({ ...d, intentos: d.intentos + 1, ultimoError: err?.message || String(err) }))
        } finally {
          detectando = false
        }
        loopDeteccion()
      }, INTERVALO_MS)
    }

    iniciar()

    return () => {
      cancelled = true
      clearTimeout(timer)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [open])

  async function handleCambiarCamara() {
    if (camaras.length < 2) return
    const siguiente = (camaraIndex + 1) % camaras.length
    setError('')
    try {
      const nuevoStream = await navigator.mediaDevices.getUserMedia({
        video: { ...CONSTRAINTS_VIDEO, facingMode: undefined, deviceId: { exact: camaras[siguiente].deviceId } },
      })
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = nuevoStream
      if (videoRef.current) videoRef.current.srcObject = nuevoStream
      setCamaraIndex(siguiente)
      setTorchOn(false)
      const track = nuevoStream.getVideoTracks()[0]
      const caps = track?.getCapabilities?.() ?? {}
      setTorchDisponible(!!caps.torch)
      const settings = track?.getSettings?.() ?? {}
      setDiag((d) => ({ ...d, resolucion: `${settings.width ?? '?'}×${settings.height ?? '?'}` }))
    } catch (err) {
      setError('No se pudo cambiar de cámara: ' + err.message)
    }
  }

  async function handleToggleTorch() {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn }] })
      setTorchOn((v) => !v)
    } catch (err) {
      console.error('[scanner] torch', err)
    }
  }

  function handleManualSubmit(e) {
    e.preventDefault()
    const valor = manualValor.trim()
    if (!valor) return
    onDetectedRef.current(valor)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/8 bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base text-white">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-muted hover:bg-white/8 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {error ? (
          <p className="flex items-start gap-2 rounded-lg bg-brand-700/15 px-3 py-3 text-sm text-brand-400 ring-1 ring-brand-700/30">
            <TriangleAlert size={16} className="mt-0.5 shrink-0" />
            {error}
          </p>
        ) : (
          <div className="relative overflow-hidden rounded-lg bg-black">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video ref={videoRef} autoPlay playsInline muted className="w-full" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 animate-[scan-line_1.6s_ease-in-out_infinite] bg-brand-500 shadow-[0_0_8px_2px_rgba(224,26,43,0.7)]" />
            <div className="absolute right-2 top-2 flex gap-2">
              {torchDisponible && (
                <button
                  type="button"
                  onClick={handleToggleTorch}
                  className={`rounded-full p-2 text-white hover:bg-black/80 ${torchOn ? 'bg-brand-600' : 'bg-black/60'}`}
                  aria-label="Linterna"
                >
                  {torchOn ? <FlashlightOff size={18} /> : <Flashlight size={18} />}
                </button>
              )}
              {camaras.length > 1 && (
                <button
                  type="button"
                  onClick={handleCambiarCamara}
                  className="rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
                  aria-label="Cambiar cámara"
                >
                  <RotateCw size={18} />
                </button>
              )}
            </div>
            <p className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white/80">
              Apunta al código…
            </p>
          </div>
        )}

        {!error && (
          <p className="mt-2 text-center font-mono text-[10px] text-white/40">
            res: {diag.resolucion || '…'} · intentos: {diag.intentos}
            {diag.ultimoError && <span className="text-brand-400"> · error: {diag.ultimoError}</span>}
          </p>
        )}

        {manualAbierto ? (
          <form onSubmit={handleManualSubmit} className="mt-3 flex gap-2">
            <input
              autoFocus
              value={manualValor}
              onChange={(e) => setManualValor(e.target.value)}
              placeholder="Escribe el código…"
              className="input flex-1"
            />
            <button type="submit" className="btn-primary shrink-0">
              Buscar
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setManualAbierto(true)}
            className="mt-3 flex w-full items-center justify-center gap-1.5 text-sm text-white/60 hover:text-white"
          >
            <Keyboard size={14} />
            ¿No escanea? Escribe el código a mano
          </button>
        )}

        <button type="button" onClick={onClose} className="btn-secondary mt-3 w-full">
          Cancelar
        </button>
      </div>
    </div>
  )
}
