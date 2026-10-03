// Inserta datos estructurados (schema.org) en la página como <script type="application/ld+json">.
export default function JsonLd({ data }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
}
