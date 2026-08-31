// Edge Function: admin-users
// Unico lugar donde se usa la service_role key. Crea cuentas de Supabase
// Auth con un correo ficticio (nombre.apellido@dominio-interno) y su fila
// espejo en public.usuarios, o resetea la contrasena de un usuario
// existente. Solo puede invocarla un usuario ya autenticado con rol admin.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const FAKE_DOMAIN = Deno.env.get('AUTH_FAKE_DOMAIN') ?? 'lujosdeauto.local'

const USERNAME_RE = /^[a-z0-9]+(\.[a-z0-9]+)+$/

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function jsonError(message: string, status = 400) {
  return json({ error: message }, status)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonError('Metodo no permitido', 405)
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonError('Falta encabezado de autorizacion', 401)

    const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: userData, error: userError } = await callerClient.auth.getUser()
    if (userError || !userData?.user) return jsonError('Sesion invalida', 401)

    const { data: isAdmin, error: adminCheckError } = await callerClient.rpc('is_admin')
    if (adminCheckError || !isAdmin) return jsonError('No autorizado: se requiere rol admin', 403)

    const body = await req.json().catch(() => ({}))
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    switch (body.action) {
      case 'create':
        return await handleCreate(admin, body)
      case 'reset_password':
        return await handleResetPassword(admin, body)
      default:
        return jsonError('Accion desconocida', 400)
    }
  } catch (err) {
    console.error(err)
    return jsonError('Error interno', 500)
  }
})

async function handleCreate(admin: ReturnType<typeof createClient>, body: any) {
  const nombreUsuario = String(body.nombre_usuario ?? '').trim().toLowerCase()
  const nombreCompleto = String(body.nombre_completo ?? '').trim()
  const password = String(body.password ?? '')
  const rol = body.rol === 'admin' ? 'admin' : 'mecanico'

  if (!USERNAME_RE.test(nombreUsuario)) {
    return jsonError('El usuario debe tener el formato nombre.apellido (minusculas, sin espacios ni tildes)', 400)
  }
  if (!nombreCompleto) return jsonError('El nombre completo es obligatorio', 400)
  if (password.length < 6) return jsonError('La contrasena debe tener al menos 6 caracteres', 400)

  const email = `${nombreUsuario}@${FAKE_DOMAIN}`

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createError || !created?.user) {
    const msg = createError?.message ?? ''
    if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('registered')) {
      return jsonError('Ese nombre de usuario ya existe', 409)
    }
    return jsonError(msg || 'No se pudo crear el usuario', 400)
  }

  const { error: insertError } = await admin.from('usuarios').insert({
    id: created.user.id,
    nombre_usuario: nombreUsuario,
    nombre_completo: nombreCompleto,
    rol,
  })

  if (insertError) {
    await admin.auth.admin.deleteUser(created.user.id)
    if (insertError.message.toLowerCase().includes('duplicate')) {
      return jsonError('Ese nombre de usuario ya existe', 409)
    }
    return jsonError(insertError.message, 400)
  }

  return json({ id: created.user.id, nombre_usuario: nombreUsuario, rol })
}

async function handleResetPassword(admin: ReturnType<typeof createClient>, body: any) {
  const usuarioId = String(body.usuario_id ?? '')
  const password = String(body.password ?? '')

  if (!usuarioId) return jsonError('usuario_id es obligatorio', 400)
  if (password.length < 6) return jsonError('La contrasena debe tener al menos 6 caracteres', 400)

  const { error } = await admin.auth.admin.updateUserById(usuarioId, { password })
  if (error) return jsonError(error.message, 400)

  return json({ ok: true })
}
