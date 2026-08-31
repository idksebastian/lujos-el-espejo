-- Quita el lenguaje "dueña"/"socio" (asume genero y roles especificos) de
-- la configuracion. Los valores existentes (los nombres reales que ya
-- cargaron) se preservan intactos; solo cambian los nombres de columna.

alter table public.configuracion rename column nombre_duena to nombre_socio_1;
alter table public.configuracion rename column nombre_socio to nombre_socio_2;
alter table public.configuracion rename column nit_duena to nit_socio_1;
alter table public.configuracion rename column nit_socio to nit_socio_2;

alter table public.configuracion alter column nombre_socio_1 set default 'Socio 1';
alter table public.configuracion alter column nombre_socio_2 set default 'Socio 2';
