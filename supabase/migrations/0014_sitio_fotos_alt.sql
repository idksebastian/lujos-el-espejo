-- Texto alternativo (alt) por foto del sitio público.
-- Aditivo y no destructivo: columna nullable, las filas existentes quedan
-- con alt = null y el sitio usa el alt por defecto de su categoría
-- (ver src/lib/sitioFotos.js).
--
-- Las políticas RLS de sitio_fotos ya cubren la columna nueva, porque son
-- por fila y no por columna.

alter table public.sitio_fotos add column if not exists alt text;
