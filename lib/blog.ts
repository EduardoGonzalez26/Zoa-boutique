// ── Blog articles — static content for SEO ──────────────────────────────────

export interface BlogArticle {
  slug: string;
  title: string;
  excerpt: string;
  content: string; // HTML string
  coverImage: string;  // local /public path
  ogImage?: string;    // absolute URL for OG tags
  date: string;
  readTime: string;
  category: string;
  author: string;
}

export const BLOG_ARTICLES: BlogArticle[] = [
  {
    slug: "tendencias-moda-femenina-primavera-verano-2026",
    title: "Tendencias de Moda Femenina para Primavera / Verano 2026",
    excerpt: "Descubre los colores, siluetas y estilos que dominarán esta temporada. Desde el beige sophisticated hasta el verde olivo terroso, te contamos qué ponerte.",
    date: "2026-03-20",
    readTime: "4 min",
    category: "Tendencias",
    author: "Carmen López Iñiguez",
    coverImage: "/blog-tendencias.png",
    ogImage: "https://zoa.mx/blog-tendencias.png",
    content: `
<p>La temporada primavera/verano 2026 llega cargada de frescura, pero con una sofisticación que pocas temporadas habíamos visto. Si quieres actualizar tu guardarropa sin gastar de más, estas son las tendencias que necesitas conocer.</p>

<h2>1. La paleta de neutros elevados</h2>
<p>El beige, el arena y el hueso siguen siendo protagonistas, pero esta temporada se cruzan con el nude rosado y el blanco óptico para crear una familia de colores que funcionan impecable entre sí. La clave es la textura: punto fino, satén y telas técnicas con caída.</p>
<p>En nuestra colección de <strong>primavera/verano 2026</strong> encontrarás blusas, pantalones y vestidos en estos tonos que puedes combinar sin esfuerzo y usar de día o de noche.</p>

<h2>2. Siluetas cómoda pero estructuradas</h2>
<p>El corte recto y el flare regresan con todo. Ya no se trata de escoger entre comodidad o estilo — esta temporada tienes las dos. Los pantalones de vestir fluidos con pierna amplia son la pieza definitiva: combinan con tacón para la oficina y con tenis para el fin de semana.</p>
<p>La clave está en los detalles: bolsillos laterales funcionales, cierres ocultos y telas que no se arrugan. Piezas que trabajan para ti.</p>

<h2>3. El verde olivo como acento</h2>
<p>Si los neutros son tu base, el verde olivo es tu color acento de temporada. Ya sea en una blusa, un saco ligero o un accesorio, este tono completa cualquier look sin competir con el resto de tu atuendo. Funciona mejor con beige, café y negro.</p>

<h2>4. Blusas con volumen en manga</h2>
<p>Las mangas globo, las mangas angosta con vuelo y el diseño asimétrico están de regreso. Las blusas de esta temporada tienen personalidad propia — ya no son solo básicos. Úsalas con un pantalón recto negro y tienes un look de evento en menos de 5 minutos.</p>

<h2>Cómo construir un look de temporada</h2>
<p>La regla más sencilla: una pieza con tendencia + dos piezas atemporales. Por ejemplo:</p>
<ul>
  <li>Blusa con manga especial (tendencia)</li>
  <li>Pantalón negro recto (atemporal)</li>
  <li>Zapato nude o sandalia (atemporal)</li>
</ul>
<p>Este tipo de combinación funciona para el trabajo, para una comida o para una tarde de compras. Versatilidad sobre todo.</p>

<p>Explora nuestra <a href="/colecciones/primavera-verano">colección Primavera / Verano 2026</a> y encuentra las piezas perfectas para esta temporada.</p>
    `.trim(),
  },
  {
    slug: "como-armar-un-guardarropa-basico-inteligente",
    title: "Cómo Armar un Guardarropa Básico sin Gastar una Fortuna",
    excerpt: "Las prendas clave que toda mujer debería tener en su clóset. Menos es más cuando sabes qué comprar. Te damos la lista definitiva de básicos que van con todo.",
    date: "2026-03-08",
    readTime: "5 min",
    category: "Estilo",
    author: "Carmen López Iñiguez",
    coverImage: "/blog-guardarropa.png",
    ogImage: "https://zoa.mx/blog-guardarropa.png",
    content: `
<p>Abrir el clóset y sentir que no tienes nada que ponerte es una experiencia que tarde o temprano vivimos todas. Pero el problema casi nunca es falta de ropa — es falta de <em>los piezas correctas</em>. Un guardarropa básico bien construido te da más outfits que uno lleno de tendencias que no combinan entre sí.</p>

<h2>¿Qué es un básico de guardarropa?</h2>
<p>Un básico es cualquier prenda que puedas combinar con al menos 3 cosas distintas de tu clóset. Si algo solo funciona con un outfit, no es un básico — es una prenda de ocasión especial. Los básicos son los que trabajan todos los días.</p>

<h2>Las 8 piezas esenciales</h2>

<h3>1. Pantalón negro de vestir</h3>
<p>La pieza más versátil que existe. Con una blusa blanca y tacón es formal. Con tenis y playera es casual chic. Invierte en uno de buena calidad — un pantalón negro bien hecho no pasa de moda nunca.</p>

<h3>2. Blusa blanca estructurada</h3>
<p>Diferente a una camiseta blanca, una blusa blanca con buen corte eleva cualquier look. Úsala por dentro del pantalón, por fuera con un cinturón, o medio abierta sobre un top.</p>

<h3>3. Blusa de punto fino</h3>
<p>El punto fino tiene una caída elegante que no se ve ni muy formal ni muy casual. En colores neutros (negro, beige, crema) funciona con pantalón de vestir, jeans y faldas.</p>

<h3>4. Cardigan o saco ligero</h3>
<p>Indispensable para las oficinas con aire acondicionado al máximo. Un saco de punto o un cardigan largo en color neutro es el complemento perfecto para cualquier blusa.</p>

<h3>5. Pantalón en color neutro claro</h3>
<p>Beige, arena o hueso. Es el complemento perfecto del armario negro. Crea un look monocromático con una blusa en el mismo tono o contrástalo con colores vibrantes.</p>

<h3>6. Vestido recto midi</h3>
<p>Un vestido recto a media pierna en color sólido (negro, navy, vino) funciona para prácticamente cualquier ocasión. Solo cambia el zapato y el accesorio.</p>

<h3>7. Blusa con detalle o estampado favorito</h3>
<p>Una pieza con personalidad — puede ser un estampado, un bordado, un detalle de manga. Esta es tu pieza de expresión personal dentro del guardarropa neutro.</p>

<h3>8. Conjunto básico (top + pantalón coordinados)</h3>
<p>Un conjunto en el mismo tono o material da la impresión de que siempre estás impecable, incluso cuando no lo planeaste. Úsalos juntos o separados.</p>

<h2>Cómo comprar mejor</h2>
<p>Antes de cualquier compra hazte estas tres preguntas:</p>
<ol>
  <li>¿Con cuántas cosas de mi clóset lo puedo combinar?</li>
  <li>¿Lo usaría en más de una ocasión?</li>
  <li>¿La tela y el corte son de buena calidad?</li>
</ol>
<p>Si las tres respuestas son sí, es una buena compra. Si alguna es no, sigue buscando.</p>

<p>Revisa nuestra sección de <a href="/colecciones/esenciales">Esenciales</a> — está curada exactamente con este criterio: piezas que duran, que combinan y que funcionan para mujeres reales.</p>
    `.trim(),
  },
  {
    slug: "guia-de-tallas-ropa-mujer-como-elegir",
    title: "Guía de Tallas: Cómo Elegir la Talla Correcta al Comprar en Línea",
    excerpt: "Comprar ropa en línea sin saber tu talla exacta puede ser frustrante. Te explicamos cómo medirte, interpretar las guías de tallas y qué hacer si quedas entre dos.",
    date: "2026-02-25",
    readTime: "4 min",
    category: "Guías",
    author: "Carmen López Iñiguez",
    coverImage: "/blog-tallas.png",
    ogImage: "https://zoa.mx/blog-tallas.png",
    content: `
<p>Uno de los mayores miedos al comprar ropa en línea es equivocarse con la talla. Pero con la información correcta, es mucho más sencillo de lo que parece. Aquí te explicamos todo lo que necesitas saber.</p>

<h2>Cómo medirte correctamente</h2>
<p>Necesitas una cinta métrica flexible (de las que se usan en costura) y alguien que te ayude. Mídete siempre sobre ropa interior o ropa muy ligera, no sobre ropa gruesa.</p>

<h3>Busto</h3>
<p>Rodea la parte más ancha de tu pecho con la cinta, paralela al suelo. No jales demasiado — debe quedar cómoda pero sin holgura.</p>

<h3>Cintura</h3>
<p>Encuentra el punto más delgado de tu torso, generalmente unos centímetros arriba del ombligo. Mide ahí con la cinta paralela al suelo.</p>

<h3>Cadera</h3>
<p>Mide la parte más ancha de tus caderas, generalmente unos 20 cm debajo de la cintura.</p>

<h2>Nuestra tabla de tallas</h2>
<table style="width:100%;border-collapse:collapse;margin:16px 0;">
  <thead>
    <tr style="background:#f5f0eb;">
      <th style="padding:8px 12px;text-align:left;border:1px solid #e0d8d0;">Talla</th>
      <th style="padding:8px 12px;text-align:left;border:1px solid #e0d8d0;">Busto (cm)</th>
      <th style="padding:8px 12px;text-align:left;border:1px solid #e0d8d0;">Cintura (cm)</th>
      <th style="padding:8px 12px;text-align:left;border:1px solid #e0d8d0;">Cadera (cm)</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style="padding:8px 12px;border:1px solid #e0d8d0;">XS</td><td style="padding:8px 12px;border:1px solid #e0d8d0;">80–84</td><td style="padding:8px 12px;border:1px solid #e0d8d0;">60–64</td><td style="padding:8px 12px;border:1px solid #e0d8d0;">86–90</td></tr>
    <tr style="background:#faf8f5;"><td style="padding:8px 12px;border:1px solid #e0d8d0;">S</td><td style="padding:8px 12px;border:1px solid #e0d8d0;">84–88</td><td style="padding:8px 12px;border:1px solid #e0d8d0;">64–68</td><td style="padding:8px 12px;border:1px solid #e0d8d0;">90–94</td></tr>
    <tr><td style="padding:8px 12px;border:1px solid #e0d8d0;">M</td><td style="padding:8px 12px;border:1px solid #e0d8d0;">88–92</td><td style="padding:8px 12px;border:1px solid #e0d8d0;">68–72</td><td style="padding:8px 12px;border:1px solid #e0d8d0;">94–98</td></tr>
    <tr style="background:#faf8f5;"><td style="padding:8px 12px;border:1px solid #e0d8d0;">L</td><td style="padding:8px 12px;border:1px solid #e0d8d0;">92–96</td><td style="padding:8px 12px;border:1px solid #e0d8d0;">72–76</td><td style="padding:8px 12px;border:1px solid #e0d8d0;">98–102</td></tr>
    <tr><td style="padding:8px 12px;border:1px solid #e0d8d0;">LOV</td><td style="padding:8px 12px;border:1px solid #e0d8d0;">96–102</td><td style="padding:8px 12px;border:1px solid #e0d8d0;">76–84</td><td style="padding:8px 12px;border:1px solid #e0d8d0;">102–108</td></tr>
    <tr style="background:#faf8f5;"><td style="padding:8px 12px;border:1px solid #e0d8d0;">XL</td><td style="padding:8px 12px;border:1px solid #e0d8d0;">102–108</td><td style="padding:8px 12px;border:1px solid #e0d8d0;">84–90</td><td style="padding:8px 12px;border:1px solid #e0d8d0;">108–114</td></tr>
  </tbody>
</table>

<h2>¿Qué pasa si quedo entre dos tallas?</h2>
<p>Depende del tipo de prenda:</p>
<ul>
  <li><strong>Blusas y tops:</strong> elige la talla más grande para más comodidad de movimiento</li>
  <li><strong>Pantalones de vestir:</strong> elige por la medida de cadera — es más difícil ajustar una prenda pequeña que una un poco más holgada</li>
  <li><strong>Vestidos:</strong> depende del corte. Si es entallado, sube una talla. Si tiene elasticidad, puedes quedarte en la menor</li>
</ul>

<h2>Telas que se adaptan vs. telas que no</h2>
<p>Las telas con elastán (lycra) tienen más tolerancia — una talla M puede caber cómodamente en alguien entre M y L. Las telas completamente rígidas (algodón grueso, lino, tejido técnico sin elasticidad) no tienen esa flexibilidad: mídete bien antes de comprar.</p>

<h2>¿Qué hacemos en Zoa si la talla no es correcta?</h2>
<p>Si tu prenda llegó y la talla no es la ideal, visita nuestra sección de <a href="/devoluciones">devoluciones y cambios</a>. Atendemos cada caso con mucho gusto — queremos que tu compra sea perfecta.</p>

<p>¿Tienes dudas sobre una prenda específica? Escríbenos por <a href="https://wa.me/525521068191">WhatsApp</a> y con gusto te orientamos antes de que compres.</p>
    `.trim(),
  },
];

export function getArticleBySlug(slug: string): BlogArticle | undefined {
  return BLOG_ARTICLES.find((a) => a.slug === slug);
}
