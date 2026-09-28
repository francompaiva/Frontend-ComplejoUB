# UNIDAD 3: Frontend, Arquitectura React 19, Vite, Estado Global y UI
## Documento Técnico de Referencia y Contexto para NotebookLM
**Proyecto:** Plataforma de Gestión de Turnos y Torneos — Complejo Deportivo UB  
**Institución:** Universidad de Belgrano (UB)  
**Entorno Tecnológico:** React 19.2, TypeScript 6.0, Vite 8.2, Tailwind CSS, REST API Client nativo.

---

## 1. Resumen Ejecutivo y Objetivos de Aprendizaje

El objetivo central de esta unidad es dominar la arquitectura de una **Single Page Application (SPA)** en la capa de presentación web, garantizando:
1. **Desacoplamiento Cliente-Servidor:** Separación estricta entre la lógica de negocio/persistencia (Backend Node.js + MySQL) y la interfaz de usuario (React 19).
2. **Sincronización Reactiva sin Mock Data:** Supresión absoluta de arreglos estáticos locales, hidratando el estado de la aplicación en vivo desde endpoints REST.
3. **Gestión Centralizada del Estado:** Utilización de la **Context API** de React como único cerebro reactivo de la UI, complementado con funciones memorizadas (`useCallback`).
4. **Capa de Red Segura y Tipada:** Implementación de un cliente HTTP bajo el patrón **Singleton** que inyecta tokens criptográficos **JWT Bearer** y valida contratos **DTO** (`ApiResponse<T>`).
5. **Capa de Transformación de Datos (Data Mappers):** Conversión sistemática del esquema relacional de la base de datos (`snake_case`) a las entidades de dominio de la vista (`camelCase`).
6. **Navegación Adaptativa Basada en Roles (RBAC UI):** Restricción de pantallas, modales y acciones operativas según el perfil autenticado (`cliente`, `arbitro`, `admin`).

---

## 2. Mapa Arquitectónico y Estructura Física (`src/`)

```
src/
├── main.tsx                  # Punto de entrada de la aplicación; montaje del Virtual DOM con createRoot.
├── App.tsx                   # Orquestador del enrutamiento condicional por rol (RBAC) y modales globales.
├── index.css / App.css       # Configuración global y directivas atómicas de Tailwind CSS.
├── api/                      # Capa de infraestructura de red y contratos HTTP
│   ├── client.ts             # Instancia Singleton ApiClient (Fetch API + inyección de JWT Bearer).
│   └── endpoints.ts          # Repositorio modular de endpoints agrupados por dominios de negocio.
├── context/                  # Capa de estado global reactivo
│   └── ComplejoContext.tsx   # Provider, Data Mappers, hidratación concurrente y acciones asíncronas.
├── screens/                  # Vistas completas de la aplicación según rol de usuario
│   ├── LoginScreen.tsx       # Autenticación de usuarios contra el backend.
│   ├── LandingPage.tsx       # Portal del cliente; grilla de disponibilidad calculada en tiempo real.
│   ├── MisReservas.tsx       # Gestión de reservas activas, historial y política de cancelación/señas.
│   ├── MisTorneos.tsx        # Consulta pública de tablas de posiciones y fixtures de ligas.
│   ├── ArbitroPanel.tsx      # Planilla digital arbitral oficial, actas disciplinarias y tarjetas.
│   └── Admin*.tsx            # Suite de administración: Agenda, Canchas, Torneos, Métricas y Auditoría.
└── components/               # Componentes atómicos reutilizables y modales de diálogo globales
    ├── ConfirmacionPagoModal.tsx  # Confirmación de reserva y cobro del 30% de seña.
    ├── InscripcionTorneoModal.tsx # Formulario de inscripción de equipos y validación de nómina.
    └── ListaEsperaModal.tsx       # Registro automático en turnos con concurrencia saturada.
```

---

## 3. Fundamentos Tecnológicos y Decisiones de Diseño

### 3.1. React 19 (Librería de Construcción de UI)
* **Single Page Application (SPA):** La plataforma carga un único archivo HTML base. Las transiciones entre pantallas se realizan en la memoria del navegador manipulando el Virtual DOM, lo que elimina el ciclo tradicional de recarga de página (*full page reload*) y ofrece una experiencia de usuario fluida y de baja latencia.
* **Componentes Funcionales:** La UI está construida en base a funciones puras o cuasi-puras que reciben propiedades (`props`) y retornan sintaxis JSX/TSX.
* **Hooks Clave:**
  * `useState`: Almacena el estado local (ej. deporte filtrado, pestaña activa, visibilidad de modales).
  * `useEffect`: Ejecuta efectos colaterales. Se utiliza para hidratar el estado global al montar la aplicación y para verificar la guardia de rutas por rol.
  * `useCallback`: Memoriza referencias de funciones asíncronas (`fetchTorneoData`, `refreshAllData`) evitando recreaciones innecesarias en cada renderizado, lo que previene bucles infinitos en dependencias de `useEffect`.
  * `useContext`: Provee acceso desacoplado al estado global. El custom hook `useComplejo` incluye validación estricta de jerarquía: lanza una excepción si se utiliza fuera del `ComplejoProvider`.

### 3.2. TypeScript (Tipado Estático y Seguridad en Tiempo de Compilación)
* **Prevención de Errores en Runtime:** Define interfaces explícitas para cada modelo (`Court`, `BookingItem`, `Tournament`, `FixtureMatch`, `ApiResponse<T>`).
* **Verificación Estricta en el Pipeline de Build (`tsc -b && vite build`):** El compilador valida exhaustivamente la compatibilidad de tipos antes de empaquetar, garantizando que no existan lecturas de campos indefinidos ni llamadas HTTP con parámetros inválidos.

### 3.3. Vite 8 (Herramienta de Empaquetado y Servidor de Desarrollo)
* **Native ES Modules (ESM):** Vite no empaqueta toda la aplicación en desarrollo; aprovecha los módulos ES nativos del navegador, delegando la transpilación a `esbuild` (escrito en Go) bajo demanda.
* **Hot Module Replacement (HMR):** Actualizaciones en milisegundos en el navegador sin perder el estado en memoria de los formularios y componentes.
* **Optimización de Producción:** Utiliza Rollup para generar paquetes finales altamente comprimidos con *Tree Shaking* (depuración de código no utilizado) y división de fragmentos (*Code Splitting*).

### 3.4. Tailwind CSS (Enfoque Utility-First)
* Estilos aplicados mediante clases atómicas utilitarias directamente sobre el JSX.
* Garantiza consistencia con la identidad visual corporativa:
  * Color de Fondo Principal: `#293827` (verde bosque profundo).
  * Color Primario Institucional: `#65C556` (verde brillante de acento y acciones interactivas).

---

## 4. Arquitectura de Red y Estado Global

### 4.1. Cliente HTTP Desacoplado (`src/api/client.ts`)
Implementa el patrón de diseño **Singleton** a través de la clase `ApiClient`:
```typescript
class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('complejo_ub_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) localStorage.setItem('complejo_ub_token', token);
    else localStorage.removeItem('complejo_ub_token');
  }

  async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Inyección de credenciales JWT Bearer
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, { ...options, headers });
    const json: ApiResponse<T> = await response.json();

    if (!response.ok || !json.success) {
      throw new Error(json.error?.message || `Error HTTP (${response.status})`);
    }

    return json.data as T;
  }
}
export const apiClient = new ApiClient();
```
* **Ventajas:**
  * Centraliza la URL base de la API (`http://localhost:4000/api/v1`).
  * Inyección automática del encabezado `Authorization: Bearer <token>` sin intervención de las pantallas.
  * Normalización unificada de respuestas y captura centralizada de errores (códigos 4xx y 5xx).

### 4.2. Repositorio de Endpoints (`src/api/endpoints.ts`)
Organiza los llamados HTTP por dominio funcional:
* `authApi`: Login, registro y verificación de token (`/auth/me`).
* `canchasApi`: Listado general, disponibilidad por fecha y ABM de canchas.
* `reservasApi`: Creación de turnos, consulta de historial y cancelaciones con auditoría.
* `torneosApi`: Listado de ligas, generación de fixture Round-Robin y tablas de posiciones.
* `equiposApi`: Inscripciones de planteles e invitaciones a jugadores.
* `partidosApi`: Consulta de fixture general, partidos de árbitro y carga de resultados.
* `listaEsperaApi`: Inscripción y gestión de cupos en espera ante turnos agotados.
* `notificacionesApi`: Centro de avisos reactivos de turnos y sanciones.
* `reportesApi`: Métricas ejecutivas y logs de auditoría para el administrador.

### 4.3. Hidratación Concurrente y Tolerancia a Fallos (`ComplejoContext.tsx`)
Al iniciar la aplicación, el contexto convoca en paralelo las entidades maestras mediante `Promise.all`:
```typescript
const [canchas, torneos, resReservas, notifs, logs] = await Promise.all([
  canchasApi.getAll().catch(() => []),
  torneosApi.getAll().catch(() => []),
  reservasApi.getAll().catch(() => []),
  notificacionesApi.getMisNotificaciones().catch(() => []),
  reportesApi.getAuditoria().catch(() => []),
]);
```
* **Concurrencia de Red:** El tiempo total de carga equivale al del request más lento ($\max(t_i)$), en lugar de la suma secuencial ($\sum t_i$).
* **Resiliencia:** Los bloques `.catch(() => [])` individuales impiden que un error en un servicio auxiliar interrumpa la carga de servicios críticos como canchas o reservas.

### 4.4. Carga Bajo Demanda (*On-Demand Fetching*)
Para optimizar el uso de red y memoria, el fixture y la tabla de posiciones de los torneos no se cargan todos juntos al inicio. La función `fetchTorneoData(torneoId)` se invoca únicamente cuando el usuario selecciona un torneo específico en [`MisTorneos.tsx`](file:///c:/Users/seba/Frontend-ComplejoUB/src/screens/MisTorneos.tsx) o [`AdminTorneo.tsx`](file:///c:/Users/seba/Frontend-ComplejoUB/src/screens/AdminTorneo.tsx).

### 4.5. Capa de Transformación de Datos (Data Mappers)
Aísla la estructura de la base de datos de los componentes visuales:
* **Problema:** MySQL utiliza la convención `snake_case` (`monto_total`, `goles_local`, `fk_cancha_id`), mientras que React y TypeScript emplean `camelCase` (`totalPrice`, `homeScore`, `courtId`).
* **Solución:** Funciones puras de mapeo (`mapCanchaFromApi`, `mapTorneoFromApi`, `mapPartidoFromApi`, `mapReservaFromApi`) que sanean valores nulos, formatean fechas y realizan cálculos derivados (ej. cálculo de seña del 30% y saldo restante).

---

## 5. Control de Acceso Basado en Roles en la Interfaz (RBAC UI)

En [`src/App.tsx`](file:///c:/Users/seba/Frontend-ComplejoUB/src/App.tsx), el acceso a las pantallas está gobernado por una matriz de roles:

| Rol | Pantalla Inicial | Pantallas Habilitadas | Funcionalidades Clave |
| :--- | :--- | :--- | :--- |
| **`cliente`** | `landing` | `landing`, `mis-reservas`, `mis-torneos` | Consulta de disponibilidad en tiempo real, reserva con pago de seña (30%), cancelación con política de reembolso >24h, inscripción de equipos en torneos. |
| **`arbitro`** | `arbitro` | `arbitro`, `mis-torneos` | Planilla digital oficial, visualización de partidos asignados, carga de goles, registro de amonestados/expulsados y actas de disciplina. |
| **`admin`** | `admin-agenda` | Todas las pantallas (`admin-*`, `landing`, `mis-torneos`, `arbitro`) | Agenda operativa diaria, control de inasistencias, ABM de canchas y tarifas, generación de fixtures de torneos, métricas de recaudación y auditoría de acciones. |

### Guardia de Navegación Reactiva:
```typescript
useEffect(() => {
  if (currentScreen === 'login') return;
  const allowed = ACCOUNTS[userRole].allowedScreens;
  if (!allowed.includes(currentScreen)) {
    setCurrentScreen(ACCOUNTS[userRole].primaryScreen);
  }
}, [userRole, currentScreen]);
```
Si un usuario con rol `cliente` intenta forzar el acceso a una vista administrativa (`admin-agenda` o `admin-auditoria`), el efecto colateral intercepta la navegación y redirige de forma automática a la vista permitida (`landing`).

---

## 6. Lógica de Negocio en la Capa de Presentación

### 6.1. Grilla de Disponibilidad en Tiempo Real ([`LandingPage.tsx`](file:///c:/Users/seba/Frontend-ComplejoUB/src/screens/LandingPage.tsx))
La función `getSlotStatus(courtName, hour)` determina el estado de cada franja horaria cruzando dos fuentes de verdad:
1. **Partidos de Torneo:** Verifica si existe un partido oficial programado (`fixtures`) en esa cancha y hora.
2. **Reservas Confirmadas:** Verifica si existe una reserva activa (`bookings`) en MySQL.
3. Si no hay colisiones, la franja se declara `Libre` y permite la reserva. Si está ocupada, se ofrece sumarse a la `Lista de Espera`.

### 6.2. Política de Cancelación y Reembolso ([`ComplejoContext.tsx`](file:///c:/Users/seba/Frontend-ComplejoUB/src/context/ComplejoContext.tsx))
Al solicitar la cancelación de un turno en [`MisReservas.tsx`](file:///c:/Users/seba/Frontend-ComplejoUB/src/screens/MisReservas.tsx):
* **Anticipación > 24 horas:** El sistema autoriza la cancelación y genera una notificación de reintegro del 100% del monto de la seña abonada.
* **Anticipación < 24 horas:** El sistema confirma la cancelación pero retiene la seña de acuerdo con el reglamento del complejo, notificando al usuario e impactando la auditoría interna.

---

## 7. Glosario de Conceptos de Ingeniería de Software para Examen

* **Single Page Application (SPA):** Aplicación web que no realiza peticiones de recarga completa de página al navegar; las vistas se renderizan dinámicamente mediante manipulación del árbol DOM en memoria.
* **Virtual DOM:** Representación liviana del DOM real en memoria utilizada por React para comparar versiones anteriores y nuevas mediante un algoritmo de diferenciación (*diffing*) y reconciliar únicamente los nodos que cambiaron.
* **Context API:** Mecanismo nativo de React para compartir estado global a lo largo de un árbol de componentes sin necesidad de pasar propiedades manualmente por cada nivel intermedio (*Prop Drilling*).
* **Data Transfer Object (DTO):** Objeto simple sin lógica de negocio que transporta datos estructurados a través de la red entre el cliente y el servidor.
* **Data Mapper Pattern:** Capa de transformación que aísla los modelos de la base de datos de los modelos de vista de la aplicación, previniendo el acoplamiento directo entre capas.
* **Role-Based Access Control (RBAC):** Modelo de seguridad que restringe las operaciones y el acceso a recursos del sistema según el rol o perfil asignado a cada cuenta de usuario.
* **Hot Module Replacement (HMR):** Capacidad del entorno de desarrollo de actualizar módulos de código en el navegador en tiempo de ejecución sin reiniciar la aplicación ni perder el estado.
* **JWT Bearer Token:** Estándar abierto (RFC 7519) para la transmisión segura de afirmaciones de identidad entre partes en formato JSON firmado criptográficamente.

---

## 8. Banco de Preguntas y Respuestas Clave para la Defensa Oral

### ¿Por qué se utilizó la Context API en lugar de Redux o Zustand?
> **Respuesta Técnica:** Porque la complejidad del estado de la plataforma está acotada y bien definida (canchas, reservas, fixtures y notificaciones). La Context API combinada con `useCallback` satisface todos los requerimientos sin añadir librerías externas ni la sobrecarga de código de Redux (actions, reducers, dispatchers), manteniendo el bundle liviano y el flujo de datos predecible.

### ¿Cómo evita la aplicación los bucles infinitos en llamadas a la API dentro de `useEffect`?
> **Respuesta Técnica:** Mediante el hook `useCallback`. Las funciones asíncronas de carga de datos (`fetchTorneoData` y `refreshAllData`) se encuentran memorizadas con dependencias estables. De este modo, la referencia de la función no muta en cada renderizado, asegurando que el arreglo de dependencias de `useEffect` permanezca inmutable y evitando re-ejecuciones no deseadas.

### ¿Por qué es necesario convertir de `snake_case` a `camelCase`?
> **Respuesta Técnica:** Representa una separación formal de responsabilidades. La base de datos MySQL y la API REST siguen convenciones relacionales (`snake_case`), mientras que TypeScript y React operan con estándares idiomáticos (`camelCase`). Los Data Mappers desacoplan ambas capas: si el esquema relacional sufre modificaciones de nomenclatura, solo se ajusta el mapper sin alterar los componentes visuales.

### ¿Qué rol cumple el archivo `client.ts` frente al resto del código?
> **Respuesta Técnica:** Materializa el patrón Singleton, desacoplando a los componentes visuales de los detalles de la infraestructura de red. Encapsula la Fetch API nativa, inyecta dinámicamente el token JWT en las cabeceras, serializa las peticiones y centraliza el manejo de excepciones ante respuestas de error HTTP (códigos 4xx y 5xx).
