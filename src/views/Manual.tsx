import { useMemo, useState } from 'react';
import { BookOpen, Search, Info } from 'lucide-react';

interface ManualChapter {
  id: string;
  title: string;
  body: string[];
}

interface ManualPart {
  part: string;
  chapters: ManualChapter[];
}

// Vista simulada para validar el diseño del lector. En la fase 2 este
// contenido se lee desde Notion (Operations One) en solo lectura, y cada
// capítulo se muestra según el nivel de acceso del usuario (N1 a N5).
const manual: ManualPart[] = [
  {
    part: 'Parte 1 · Bienvenida',
    chapters: [
      {
        id: '1.0',
        title: 'Bienvenida a Velyth',
        body: [
          'Velyth es un ecosistema de divisiones que comparten una matriz legal, una forma de trabajar y un mismo estándar de calidad. Esta página es la primera lectura al entrar: explica qué es Velyth, cómo se navega el workspace y cuáles son los primeros movimientos.',
          'El manual explica el procedimiento; los datos concretos viven en el Portal Operativo. Si algo aquí contradice al portal, el portal manda en el dato y el manual manda en el procedimiento.',
        ],
      },
      {
        id: '1.1',
        title: 'Primera semana en Velyth',
        body: [
          'La primera semana tiene una ruta fija: accesos el primer día, lectura del manual el segundo y tercero, y una primera entrega antes del viernes. Ningún acceso se habilita antes de la firma.',
          'Al terminar la semana, la persona nueva tiene su correo corporativo, su rol en el portal y su primera tarea completada con revisión de su lead.',
        ],
      },
      {
        id: '1.2',
        title: 'Glosario Velyth',
        body: [
          'El glosario fija el vocabulario oficial: anillos de decisión, niveles de acceso N1 a N5, divisiones por sigla, figuras de vinculación y los términos propios del ecosistema.',
          'Cuando una palabra tiene definición aquí, se usa así en todos lados. Los sinónimos improvisados se corrigen.',
        ],
      },
    ],
  },
  {
    part: 'Parte 2 · La organización',
    chapters: [
      {
        id: '2.1',
        title: 'Identidad de Velyth: qué es y por qué existe',
        body: [
          'Velyth existe para crear con intención y crecer con propósito. La marca se escribe siempre Velyth, con V mayúscula y sin variantes, y hacia el cliente habla como una sola casa.',
          'Cada división tiene cara pública propia, pero el contrato, la factura y la respuesta final salen de la matriz.',
        ],
      },
      {
        id: '2.2',
        title: 'Organización del grupo',
        body: [
          'La estructura es plana: el Managing Member en el centro, los leads de división con autonomía operativa y los ejecutores con autonomía de tarea. No hay capas intermedias.',
          'Los anillos de decisión regulan qué puede decidir cada rol: verde es autonomía total, amarillo es autonomía con aviso, rojo requiere visto bueno previo del owner.',
        ],
      },
      {
        id: '2.5',
        title: 'Las divisiones por dentro y cómo se expanden',
        body: [
          'Tres divisiones reconocidas: VNS, VTS y DSS. Todas comparten el mismo Portal Operativo, el mismo trato al cliente y la misma doctrina de decisión.',
          'Una división nueva nace con espacio propio en el portal, vistas filtradas de las bases maestras y un lead responsable. La autonomía es de oficio, no de estructura.',
        ],
      },
      {
        id: '2.6',
        title: 'Cooperación entre divisiones y servicios cruzados',
        body: [
          'Un proyecto puede empezar en una división, pasar por otra y facturarse desde la matriz sin que el cliente note la costura. Hacia afuera hay una sola marca, un solo contrato y una sola factura.',
          'En un servicio cruzado, la apertura de información es por proyecto y se cierra con el proyecto.',
        ],
      },
      {
        id: '2.7',
        title: 'Ritmos y rituales de la semana',
        body: [
          'El kickoff abre la semana el lunes y el digest la cierra el viernes; ambos viven en la base de Semanales con su división y su semana. La revisión diaria es personal: cada quien revisa sus tareas al empezar.',
          'Velyth es remoto y asíncrono primero. Si un ritual se puede resolver sin reunión, se resuelve sin reunión.',
        ],
      },
    ],
  },
  {
    part: 'Parte 3 · Clientes y proyectos',
    chapters: [
      {
        id: '3.6',
        title: 'Ejecución de proyectos',
        body: [
          'Entre el sí del cliente y la factura hay un proceso igual para toda división: crear el proyecto con su cliente y división, cargar las tareas con responsable y fecha, ejecutar con estados al día, y cerrar disparando la factura y el feedback.',
          'Nada vive solo en la cabeza de alguien. Si una tarea no está en el portal, no existe.',
        ],
      },
    ],
  },
  {
    part: 'Parte 4 · Herramientas',
    chapters: [
      {
        id: '4.1',
        title: 'Herramientas y sistemas',
        body: [
          'El stack sostiene la operación con una regla de oro: un dato vive una sola vez. Las herramientas externas alimentan o ejecutan; ninguna guarda la verdad por duplicado.',
          'Los manuales y SOPs describen el cómo; el portal guarda el qué. Cada herramienta nueva entra a este capítulo antes de adoptarse.',
        ],
      },
      {
        id: '4.3',
        title: 'Comunicación interna: qué canal para qué',
        body: [
          'La conversación vive en Discord; la decisión vive en el portal. Si algo se acordó en un chat y no quedó registrado, no pasó.',
          'Se enlaza al registro en vez de repetir el contenido: así no hay dos versiones del mismo dato.',
        ],
      },
      {
        id: '4.4',
        title: 'Manual de UI: estándar visual del workspace',
        body: [
          'Todo lo que se cree nuevo debe verse como lo que ya existe: misma iconografía, mismo color, mismos patrones de página. Si una página no sigue el estándar, se corrige la página.',
          'Si el estándar queda corto, se cambia primero el estándar y luego las páginas.',
        ],
      },
      {
        id: '4.5',
        title: 'Nextcloud: estructura de carpetas y manejo de archivos',
        body: [
          'El archivo vive en Nextcloud y el contexto vive en el portal. La carpeta del proyecto se crea al abrir el proyecto, no cuando aparece el primer archivo.',
          'El registro del proyecto enlaza a la carpeta oficial, para que contexto y archivo siempre se encuentren mutuamente.',
        ],
      },
    ],
  },
  {
    part: 'Parte 5 · Personas',
    chapters: [
      {
        id: '5.3',
        title: 'Roles y niveles: quién es quién',
        body: [
          'Tres ejes que no se mezclan: la figura de vinculación dice cómo se contrata y se paga, el rol dice qué función cumple y qué decide, y el nivel dice cuánto oficio se reconoce.',
          'Cada rol existe porque hay una responsabilidad que sostener. Los roles no son títulos decorativos.',
        ],
      },
      {
        id: '5.9',
        title: 'Offboarding: cómo se sale de Velyth',
        body: [
          'Salir bien es parte del sistema: se reasignan las tareas abiertas para que ninguna quede huérfana, se cierran los accesos el día acordado y la cesión de propiedad intelectual se mantiene.',
          'La relación termina en buenos términos y por escrito, como empezó.',
        ],
      },
    ],
  },
  {
    part: 'Parte 6 · Economía interna',
    chapters: [
      {
        id: '6.2',
        title: 'Cotización interna y reparto del valor',
        body: [
          'Todo proyecto tiene dos cotizaciones: la externa, que ve el cliente, y la interna, que descompone el valor entre quienes lo ejecutan. La interna es confidencial y no se comenta fuera del proyecto.',
          'El detalle de porcentajes y montos de este capítulo queda restringido por nivel de acceso en la versión conectada a Notion.',
        ],
      },
    ],
  },
  {
    part: 'Parte 7 · Información',
    chapters: [
      {
        id: '7.2',
        title: 'Propiedad intelectual',
        body: [
          'Lo que se hace para Velyth y se paga, es de Velyth. Lo que una persona trajo hecho sigue siendo suyo, y lo del cliente es del cliente cuando termina de pagarlo.',
          'La IP propia es el activo de largo plazo: lo que sigue valiendo aunque no haya clientes ese mes.',
        ],
      },
      {
        id: '7.3',
        title: 'Seguridad de la información y accesos',
        body: [
          'Cuentas corporativas siempre: ningún material de Velyth se comparte a correos personales ni a unidades de nube propias. Los accesos se crean el día de la firma y se revisan por trimestre.',
          'Ante la duda, se comparte la pieza y nunca el contenedor.',
        ],
      },
      {
        id: '7.4',
        title: 'Quién ve qué: niveles de acceso a la información',
        body: [
          'Cinco niveles: N1 público, N2 interno general, N3 operativo del proyecto, N4 sensible de división y N5 reservado al owner. N4 es siempre de una división; no existe un N4 global.',
          'Cuando algo del perímetro N5 debe salir, no se abre el acceso: se extrae la pieza y queda anotado quién la recibió y para qué.',
        ],
      },
    ],
  },
];

export default function Manual() {
  const first = manual[0].chapters[0];
  const [selectedId, setSelectedId] = useState(first.id);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return manual;
    return manual
      .map((p) => ({
        ...p,
        chapters: p.chapters.filter((c) => c.title.toLowerCase().includes(q)),
      }))
      .filter((p) => p.chapters.length > 0);
  }, [query]);

  const selected =
    manual.flatMap((p) => p.chapters).find((c) => c.id === selectedId) ?? first;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-[var(--color-text)]">Manual</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Operations One · Fuente de verdad de procedimiento
        </p>
      </div>

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--accent-soft)] px-4 py-3">
        <Info size={18} className="mt-0.5 shrink-0 text-[var(--accent)]" />
        <p className="text-sm text-[var(--color-text-muted)]">
          Vista simulada para validar el diseño del lector. En la fase 2 el contenido se lee
          directamente desde Notion, en solo lectura, y cada capítulo se muestra según el nivel
          de acceso de quien entra.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* Índice */}
        <div className="card h-fit overflow-hidden">
          <div className="border-b border-[var(--color-border)] p-3">
            <div className="relative">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="input-field pl-9"
                placeholder="Buscar capítulo"
              />
            </div>
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-2 lg:max-h-[70vh]">
            {filtered.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-[var(--color-text-faint)]">
                Sin capítulos que coincidan.
              </p>
            ) : (
              filtered.map((p) => (
                <div key={p.part} className="mb-2 last:mb-0">
                  <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-faint)]">
                    {p.part}
                  </p>
                  {p.chapters.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedId(c.id)}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        selectedId === c.id
                          ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                          : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]'
                      }`}
                    >
                      <span
                        className={`font-mono text-[11px] ${
                          selectedId === c.id ? 'text-[var(--accent-ink)]' : 'text-[var(--color-text-faint)]'
                        }`}
                      >
                        {c.id}
                      </span>
                      <span className="flex-1 leading-snug">{c.title}</span>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Contenido */}
        <div className="card p-6 md:p-8">
          <div className="mb-1 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
              <BookOpen size={15} />
            </div>
            <span className="font-mono text-xs text-[var(--color-text-faint)]">{selected.id}</span>
          </div>
          <h2 className="mt-2 text-xl font-medium text-[var(--color-text)]">{selected.title}</h2>
          <div className="mt-4 space-y-3">
            {selected.body.map((paragraph, i) => (
              <p key={i} className="text-sm leading-relaxed text-[var(--color-text-muted)]">
                {paragraph}
              </p>
            ))}
          </div>
          <p className="mt-6 border-t border-[var(--color-border)] pt-4 text-xs text-[var(--color-text-faint)]">
            Contenido de muestra. El texto vigente vive en Operations One, en Notion.
          </p>
        </div>
      </div>
    </div>
  );
}
