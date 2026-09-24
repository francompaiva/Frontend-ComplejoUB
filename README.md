# ⚽ Complejo Deportivo UB — Frontend

Aplicación web interactiva para la gestión integral de canchas, reservas, torneos y actas arbitrales del **Complejo Deportivo UB** (Trabajo Práctico N° 1 - Universidad de Belgrano).

---

## 🚀 Tecnologías

* **Framework:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
* **Bundler & Dev Server:** [Vite 8](https://vitejs.dev/)
* **Estilos:** Tailwind CSS v4 con diseño atlético de alto contraste
* **Iconos y UI:** Componentes táctiles interactivos, modales accesibles y navegación por roles

---

## 👥 Perfiles y Accesos de Usuario

El sistema cuenta con un selector de cuentas interactivo (`Cambiar Cuenta`) con permisos diferenciados:

1. **Cliente / Capitán (Juan Pérez):**
   * Visualización de disponibilidad de canchas y turnos (Fútbol 5, Fútbol 8, Fútbol 11, Pádel, Tenis).
   * Reserva inmediata con pago de seña del 30%.
   * Política de cancelación con reintegro automático con más de 24 horas de antelación.
   * Lista de espera automática ante turnos ocupados.
   * Inscripción de equipos a torneos y consulta de posiciones.

2. **Árbitro Oficial (Carlos Castrilli):**
   * Panel exclusivo colegiado AFA/UB.
   * Planilla digital de partidos asignados en vivo.
   * Carga de marcadores finales, tarjetas amarillas y rojas con minuto y motivo.
   * Redacción y cierre de actas arbitrales de incidencias.

3. **Administrador General (Admin UB):**
   * Agenda diaria y operativa de canchas.
   * Control de inasistencias y sanciones automáticas.
   * ABM de canchas, superficies, iluminación y tarifas por hora.
   * Administración de torneos y generación de fixtures Round-Robin.
   * Reportes de facturación, uso y log completo de auditoría.

---

## 🛠️ Instalación y Ejecución Local

### Prerrequisitos
* **Node.js** (versión 20 LTS o superior recomendada)
* **npm**

### Pasos
```bash
# 1. Clonar el repositorio (si no lo hiciste aún)
git clone https://github.com/francompaiva/Frontend-ComplejoUB.git
cd Frontend-ComplejoUB

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:5173/`.

---

## 📦 Scripts Disponibles

* `npm run dev`: Inicia el servidor de desarrollo Vite con Hot Module Replacement (HMR).
* `npm run build`: Compila TypeScript (`tsc -b`) y genera el bundle optimizado de producción en `/dist`.
* `npm run preview`: Previsualiza localmente el build de producción.
* `npm run lint`: Ejecuta el linter ultrarrápido Oxlint.