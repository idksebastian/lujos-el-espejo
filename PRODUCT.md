# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are the two business partners (dueña y socio) of Lujos El Espejo, an accessories/"lujos para auto" shop, who use the app as `admin`: registering sales at the counter (often from a phone, negotiating price live with the customer), managing inventory, and reviewing financial/profit-split reports from a PC. A secondary role, `mecanico` (mechanics who work different days, some without their own login), has read-only access to stock levels only — no prices, costs, or sales data.

## Product Purpose

Replace hand-written inventory and sales tracking with a web app that: tracks stock per product, records each sale (with the products sold, negotiated total, mechanic, payment method), and automatically computes how that sale's profit is split between the mechanic and the two partners — so nobody has to do that math by hand at the counter.

## Positioning

Internal operations tool, not a customer-facing product. Its differentiator versus a generic POS/inventory app is the built-in, non-editable profit-split calculation (see Capabilities) tailored exactly to this shop's compensation agreement, plus barcode scanning that degrades gracefully to name search for hand-made/no-barcode products.

## Operating Context

Used at a physical counter (phone, scanning barcodes or negotiating price with a customer present) and from a PC (partners doing inventory upkeep and reviewing reports). The business is not formally registered (no DIAN tax ID), so the generated "factura" is a professional-looking receipt image for the customer, not a fiscal document. Mechanics rotate by day and may or may not have a login.

## Capabilities and Constraints

- Backend/auth: Supabase (Postgres + Auth + RLS + Edge Functions), hosted on Vercel.
- Login is username-based (`nombre.apellido`), not email — a fictitious internal email domain is built client-side before calling Supabase Auth.
- Role separation is enforced at the database level (RLS + a Postgres view for the mechanic's column-restricted inventory read), not just hidden in the UI.
- Profit split is computed and persisted server-side in a single Postgres function (`registrar_venta`), never client-side, using remainder-based rounding so the three shares always sum exactly to the shop's cut: `costo_total` = sum of unit costs × quantity; `base_reparto` = `monto_total` − `costo_total`; mecánico 50%, dueña 25%, socio 25% of `base_reparto`.
- Barcode scanning uses the device camera (`html5-qrcode`); products without a factory barcode get an internally generated `PROD-000N` code, or are found by name search only.
- Factura and daily-close ("cierre del día") outputs are PNG images rendered from an off-screen React component via `html2canvas-pro` (the oklch-color-safe fork, required because Tailwind v4's default palette uses oklch and the original html2canvas hangs on it).
- Must work well on both a phone (counter use, scanning) and a desktop browser (management/reports).

## Brand Commitments

- Name: "Lujos El Espejo".
- Owner-specified brand colors, explicitly given as a binding constraint: red, black, and white, with red and black as the dominant pair and white secondary.
- No logo exists yet; the factura template reserves space for one (currently a placeholder mark).

## Evidence on Hand

No real product photos, logo, or customer testimonials exist yet. Demo/seed data (a `demo.admin` account, a sample mechanic and product, one test sale) exists in the connected Supabase project for development/preview purposes only and is not real business data.

## Product Principles

1. The profit-split math is the product's core trust guarantee — it must be exact, server-computed, and never editable from the client.
2. Role boundaries (admin vs mecanico) are security boundaries, not UI conveniences — enforce them in Postgres RLS, not just by hiding buttons.
3. Counter usage on a phone is the primary real-world scenario; every sales/scanning flow must work one-handed on a small screen before it's considered done.
4. This is an internal tool for two owners and a small rotating crew, not a multi-tenant SaaS product — favor directness and low friction over configurability.

## Accessibility & Inclusion

No formal accessibility standard was specified. Camera permission failures must show a plain-language, non-technical error (already a stated requirement), since the counter operator may not be technical.
