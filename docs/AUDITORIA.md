# Auditoría del código · Portal Operativo Velyth

Fecha: 13-ago-2026 · Commit auditado: `86267899` · Auditoría y redacción: DOT
Alcance: todo el repositorio `Velyth-Visions-Group/test_repository`, más la base
TEST_DATABASE de Supabase y sus políticas.

## 1. Qué es este sistema

El Portal Operativo es la capa operativa de Velyth: tareas, proyectos, semanales,
intake comercial y panel de división, con acceso por roles. La doctrina sigue en
Notion (capa de verdad); esta app es la capa de ejecución. Tres decisiones lo
definen: la autorización vive en la base de datos (RLS), no en la interfaz; no hay
contraseñas (magic links); y ningún archivo pesado se guarda aquí (Nextcloud, 4.5).

## 2. Mapa del stack y flujo de datos

1. El navegador carga la app desde Netlify (build de `main`, en GitHub).
2. La app habla con Supabase con la anon key pública: Auth para entrar, PostgREST
   para datos.
3. Cada consulta la filtra Postgres según el rol del usuario (políticas RLS).
4. Cambios en el repo → push a `main` → Netlify compila y publica solo.

## 3. Base de datos: qué guarda cada tabla y por qué

| Tabla | Qué guarda | Por qué existe |
|---|---|---|
| `profiles` | Uno por usuario: nombre, roles (arreglo), división, cliente vinculado | Los roles son arreglo porque hay sombreros múltiples (caso Villegas) |
| `clients` | Clientes con división y estado | Toda factura y proyecto cuelga de aquí |
| `projects` | Proyectos con cliente, división, responsable y fecha objetivo | Unidad de trabajo de la operación (3.6) |
| `tasks` | Tareas con proyecto, responsable, estado y fecha límite | La unidad diaria; alimenta Mi semana y el Panel |
| `weeklies` | Kickoff (lunes) y digest (viernes) por división y semana | El ritual de 2.7 hecho dato |
| `intake_requests` | Solicitudes del formulario público | Entrada comercial única; escribe cualquiera, leen owner y lead |

## 4. Seguridad: el modelo y su porqué

La autorización se impone en Postgres porque la interfaz se puede inspeccionar y
la base no: aunque alguien abra la consola del navegador, sin sesión válida la
anon key no devuelve nada. Reglas vigentes (esquema canónico de TEST_DATABASE):

- `intake_requests`: INSERT público (es un formulario abierto), lectura y cambio
  de estado solo owner/lead.
- `profiles`: cada quien lee su fila; owner/lead leen todas; solo el owner escribe.
- `projects`/`tasks`/`clients`: owner ve todo; lead ve su división; executor ve
  sus tareas asignadas; cliente ve su proyecto.
- `weeklies`: lectura para el equipo interno; cada autor edita lo suyo.

Funciones auxiliares `security definer` (`my_roles`, `my_division`,
`client_id_of`): leen el perfil sin exponer la tabla completa ni crear recursión
de políticas.

## 5. Recorrido del código, archivo por archivo

### Configuración

| Archivo | Qué hace | Por qué está así |
|---|---|---|
| `package.json` | Dependencias y scripts (`dev`, `build`, `lint`) | Build sin type-check para no frenar despliegues; `npm run typecheck` aparte |
| `vite.config.ts` | Plugin React y alias `@/` → `src/` | El alias vuelve los imports legibles y movibles |
| `tailwind.config.js` | Alcance de Tailwind y `darkMode: 'class'` | El modo oscuro se controla por clase en `<html>` |
| `postcss.config.js` | Tailwind + autoprefixer | Cadena de CSS estándar |
| `tsconfig*.json` | TS estricto, sin emitir | Vite compila; TS valida |
| `eslint.config.js` | Reglas base de React/TS | Higiene de código |
| `index.html` | Shell HTML + script de tema inicial | El script lee el tema guardado antes del primer render para evitar destello |
| `public/_redirects` | `/* → /index.html 200` | Sin esto, las rutas internas darían 404 en Netlify al refrescar |
| `.gitignore` | Excluye `.env` | Las llaves jamás se versionan |

### Entrada, contexto y utilidades

| Archivo | Qué hace | Por qué |
|---|---|---|
| `main.tsx` | Monta React en el DOM | Punto de entrada estándar |
| `App.tsx` | Rutas públicas y protegidas, ruta por defecto según rol, monta ToastProvider | La ruta inicial cambia por rol: executor a Mi semana, lead/owner a Proyectos, cliente a Mi proyecto |
| `context/AuthContext.tsx` | Sesión, perfil y carga inicial | La inicialización depende solo de `onAuthStateChange`: así el token del magic link nunca se pierde por una lectura prematura (la corrección del rebote a login) |
| `lib/supabase.ts` | Cliente con `persistSession` y `detectSessionInUrl` | La sesión sobrevive al refresh y el enlace del correo se procesa al cargar |
| `lib/helpers.ts` | Roles (`hasAnyRole`, `isInternal`), fechas (`formatDate`, `dueInfo`), `getWeekStart` | `dueInfo` convierte la fecha límite en señal: vencida en rojo, hoy en acento |
| `types/database.ts` | Tipos de las tablas | Contrato compartido entre vistas y base |

### Componentes compartidos

| Archivo | Qué hace | Por qué |
|---|---|---|
| `Layout.tsx` | Estructura con sidebar + contenido y el banner del ritual | El ritual (2.7) aparece sobre cualquier vista interna |
| `Sidebar.tsx` | Navegación por rol, insignia de solicitudes nuevas, tema claro/oscuro | El menú se filtra por roles (arreglo); el contador de Intake evita que la bandeja dependa de la memoria |
| `ProtectedRoute.tsx` | Exige sesión, perfil y rol; estados de carga y sin acceso | Segunda línea de defensa en UI; la real es la RLS |
| `Modal.tsx` | Diálogo con Escape, bloqueo de scroll y cierre al fondo | Conserva su animación de entrada a propósito: es un overlay, no un cambio de vista |
| `EmptyState.tsx` | Vacíos con título, mensaje y acción | Los vacíos enseñan qué hacer después |
| `StatusBadge.tsx` | Insignias de estado por variante | Color solo donde hay señal |
| `Toast.tsx` | Avisos breves de éxito/error | Toda escritura confirma o explica |
| `RitualBanner.tsx` | Lunes sin kickoff o viernes sin digest → aviso con enlace | La regla deja de vivir solo en el manual; descartable por día |

### Vistas

| Archivo | Qué hace | Notas |
|---|---|---|
| `Login.tsx` | Magic link; si hay sesión y perfil entra; si hay sesión sin perfil, "Cuenta sin acceso asignado" | El estado explícito sustituyó al rebote silencioso |
| `RequestService.tsx` | Formulario público → `intake_requests` | La lista de servicios está fija en el código; mover al catálogo cuando exista |
| `DivisionPanel.tsx` | Vitrina de la división: conteos, kickoff/digest de la semana, avance por proyecto | N2: sin montos; el owner cambia de división, los demás ven la suya |
| `MyWeek.tsx` | Tareas asignadas agrupadas por proyecto, cambio de estado optimista, urgencia | Optimista = la UI cambia antes de confirmar la base y revierte si falla |
| `Projects.tsx` | Tabla de proyectos con crear/editar | Subtítulo recuerda la regla: cliente, división y responsable |
| `ProjectDetail.tsx` | Detalle, tareas, borrado en dos pasos | La confirmación nombra la tarea que se va a eliminar |
| `Weeklies.tsx` | Lista filtrable + formulario con plantillas por ritual | El reporte nace con estructura, nunca en blanco |
| `Manual.tsx` | Lector simulado de Operations One en dos paneles | Marcado como muestra; la fase 2 lee Notion |
| `Intake.tsx` | Bandeja de solicitudes con estados | Falta el puente "convertir a proyecto" (siguiente lote) |
| `Admin.tsx` | Roles, división y vínculo de cliente por perfil | Depende de dos RPC (ver hallazgo H1) |
| `MyProject.tsx` | Vista de solo lectura para el cliente | El cliente ve su proyecto y nada más |

## 6. Decisiones de diseño y su razón

- **Sin contraseñas**: el magic link elimina la base de contraseñas, que es lo que
  se filtra en los incidentes típicos.
- **Roles como arreglo**: una persona acumula sombreros sin cuentas paralelas.
- **RLS en la base**: la regla se cumple aunque la UI falle o se manipule.
- **Sin archivos en la base**: pesan y no consultan; viven en Nextcloud (4.5).
- **Animación solo donde informa**: se retiró de los cambios de vista; queda en
  toasts y modal, donde marca que algo nuevo apareció.

## 7. Hallazgos, por severidad

- **H1 (alto, corregido en este commit)**: `Admin.tsx` llama las funciones RPC
  `assign_profile_roles` y `link_profile_client`, que Bolt escribió en la
  migración 0002 del repo pero que nunca existieron en TEST_DATABASE. Sin ellas,
  Administración fallaba al guardar. La migración `0003` las agrega con los tipos
  canónicos. **Acción: ejecutar `supabase/migrations/20260813_0003_admin_rpc_y_alta_perfil.sql` en el SQL Editor de TEST_DATABASE.**
- **H2 (alto)**: existen dos esquemas divergentes. El canónico (el que corre en
  TEST_DATABASE) usa enums y políticas por rol; las migraciones 0001/0002 del repo
  (escritas por Bolt para su propio proyecto) usan texto libre y políticas más
  laxas. Riesgo: que alguien aplique las de Bolt encima. Recomendación:
  normalizar 0001/0002 al esquema canónico y declarar el repo como fuente única
  del esquema.
- **H3 (medio)**: las políticas de Bolt permiten a cualquier usuario autenticado
  leer todas las tablas. Si el proyecto que Bolt administró sigue vivo, pausarlo
  o borrarlo: una app, una base.
- **H4 (medio)**: el ejecutor puede actualizar cualquier campo de su tarea, no
  solo el estado. Endurecer después con un trigger que rechace cambios fuera de
  `status` cuando el autor del cambio es el asignado.
- **H5 (bajo)**: el formulario público no tiene captcha. Cuando el portal salga
  al dominio propio, agregar Cloudflare Turnstile o similar contra spam.
- **H6 (bajo, corregido en 0003)**: los perfiles se creaban a mano. El trigger
  `handle_new_user` crea el perfil con rol `cliente` (no ve nada) al primer
  acceso; el owner asigna rol en Administración.
- **H7 (bajo, corregido en este commit)**: `package.json` seguía llamándose
  `vite-react-typescript-starter`. Queda `portal-operativo-velyth`.
- **H8 (nota)**: el favicon sigue siendo el de Vite. Cuando el isotipo esté
  exportado, se reemplaza en `public/`.

## 8. Acciones recomendadas, en orden

1. Ejecutar la migración 0003 en TEST_DATABASE (desbloquea Administración).
2. Normalizar las migraciones 0001/0002 del repo al esquema canónico.
3. Pausar o eliminar el proyecto que Bolt creó en la organización de Supabase.
4. Verificar con un segundo usuario que el rol por defecto no ve nada.
5. Seguir la cola funcional: conversión de Intake, avisos a Discord, facturación
   capa 1, manual desde Notion.
