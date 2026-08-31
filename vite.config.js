import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // basicSsl genera un certificado autofirmado para el servidor de
  // desarrollo. Es necesario para probar la cámara (escáner de código de
  // barras) desde el celular en la red local: los navegadores solo permiten
  // getUserMedia en contextos seguros (HTTPS o localhost), y el celular
  // entra por la IP local, no por localhost.
  // Se desactiva bajo `vercel dev`: ese comando hace su propio proxy HTTPS
  // hacia el servidor interno de Vite por HTTP plano, y si Vite también
  // sirve HTTPS el proxy nunca logra conectarse.
  plugins: [react(), tailwindcss(), ...(process.env.VERCEL ? [] : [basicSsl()])],
})
