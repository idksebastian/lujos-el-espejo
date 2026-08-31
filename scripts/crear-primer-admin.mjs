// Script de un solo uso para crear la PRIMERA cuenta admin.
// Necesario porque la Edge Function admin-users exige que quien la llame
// ya sea un admin autenticado (para poder crear al resto de usuarios) -
// pero al inicio no existe ningun admin todavia.
//
// Se ejecuta UNA vez, de forma local, con la service_role key (nunca debe
// usarse en el frontend). Requiere las variables de entorno:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, AUTH_FAKE_DOMAIN (opcional)
//
// Uso:
//   node --env-file=.env scripts/crear-primer-admin.mjs nombre.apellido "Nombre Completo" "contraseña"

import { createClient } from '@supabase/supabase-js'

const [nombreUsuarioRaw, nombreCompleto, password] = process.argv.slice(2)

if (!nombreUsuarioRaw || !nombreCompleto || !password) {
  console.error('Uso: node --env-file=.env scripts/crear-primer-admin.mjs nombre.apellido "Nombre Completo" "contraseña"')
  process.exit(1)
}

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const FAKE_DOMAIN = process.env.AUTH_FAKE_DOMAIN || 'lujosdeauto.local'

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en las variables de entorno.')
  process.exit(1)
}

const nombreUsuario = nombreUsuarioRaw.trim().toLowerCase()

if (!/^[a-z0-9]+(\.[a-z0-9]+)+$/.test(nombreUsuario)) {
  console.error('El usuario debe tener formato nombre.apellido (minusculas, sin espacios ni tildes).')
  process.exit(1)
}

if (password.length < 6) {
  console.error('La contraseña debe tener al menos 6 caracteres.')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const { count, error: countError } = await admin.from('usuarios').select('*', { count: 'exact', head: true })

if (countError) {
  console.error('No se pudo consultar la tabla usuarios:', countError.message)
  process.exit(1)
}

if (count > 0) {
  console.error(
    `Ya existen ${count} usuario(s) en el sistema. Este script es solo para el primer admin; usa la pantalla "Usuarios" dentro de la app para crear el resto.`
  )
  process.exit(1)
}

const email = `${nombreUsuario}@${FAKE_DOMAIN}`

const { data: created, error: createError } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
})

if (createError || !created?.user) {
  console.error('No se pudo crear el usuario de autenticacion:', createError?.message)
  process.exit(1)
}

const { error: insertError } = await admin.from('usuarios').insert({
  id: created.user.id,
  nombre_usuario: nombreUsuario,
  nombre_completo: nombreCompleto,
  rol: 'admin',
})

if (insertError) {
  await admin.auth.admin.deleteUser(created.user.id)
  console.error('No se pudo crear el perfil en public.usuarios:', insertError.message)
  process.exit(1)
}

console.log(`Admin creado: ${nombreUsuario} (correo interno: ${email})`)
