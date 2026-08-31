# Lujos El Espejo

Inventario y ventas con reparto automático de ganancias. React + Vite + Tailwind, backend en Supabase, hosting en Vercel.

## 1. Crear el proyecto de Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, ejecuta en orden los archivos de `supabase/migrations/` (`0001_init.sql`, luego `0002_reportes.sql`). Si prefieres la CLI: `supabase link --project-ref <ref>` y `supabase db push`.
3. En **Authentication > Providers > Email**, desactiva **Confirm email** (los correos son ficticios, no existen).
4. En **Project Settings > API**, copia `Project URL`, `anon public key` y `service_role key`.

## 2. Variables de entorno

Copia `.env.example` a `.env` y completa:

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`: para el frontend.
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`: **solo** para el script local de creación del primer admin. Nunca se usan en el frontend ni se despliegan a Vercel.

## 3. Desplegar la Edge Function

La creación/gestión de usuarios (admin y mecánicos) pasa por una Edge Function que usa la `service_role key` del lado del servidor:

```bash
supabase functions deploy admin-users
```

No necesita secretos adicionales: `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` los inyecta Supabase automáticamente en el runtime de la función. Si quieres un dominio interno distinto a `lujosdeauto.local`, configúralo con:

```bash
supabase secrets set AUTH_FAKE_DOMAIN=tudominio.local
```

## 4. Crear el primer usuario admin

La pantalla "Usuarios" dentro de la app solo puede usarla un admin ya autenticado — por eso el primer admin se crea una única vez con un script local (usa la `service_role key`, nunca la expongas):

```bash
node --env-file=.env scripts/crear-primer-admin.mjs dueña.apellido "Nombre Completo" "contraseña-segura"
```

Desde ahí, ese admin puede crear a los demás (socio, mecánicos con acceso) desde la pantalla **Usuarios**.

## 5. Desarrollo local

```bash
npm install
npm run dev
```

## 6. Desplegar en Vercel

Sube el repo a Vercel y configura solo estas variables de entorno (las mismas `VITE_*` del `.env`, nunca la `service_role key`):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_AUTH_FAKE_DOMAIN` (opcional, por defecto `lujosdeauto.local`)

`vercel.json` ya incluye el rewrite necesario para que las rutas de React Router funcionen al recargar o compartir un link directo.

## Notas de diseño

- El reparto (`registrar_venta` en `0001_init.sql`) se calcula **en la base de datos**, dentro de una función `security definer` que valida stock, descuenta inventario y calcula `costo_total` / `monto_mecanico` / `monto_duena` / `monto_socio` de forma atómica. El frontend nunca inserta directamente en `ventas` — solo llama a esa función vía RPC.
- Los mecánicos ven el inventario a través de la vista `inventario_publico` (sin costos ni precios); los admins consultan la tabla `productos` completa. Esto separa la visibilidad por columnas, algo que RLS por sí sola no resuelve porque ambos roles comparten el rol de Postgres `authenticated`.
