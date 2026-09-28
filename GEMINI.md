# DIRECTIVAS DE CALIDAD Y RIGUROSIDAD TÉCNICA (Frontend Complejo UB)

Este proyecto corresponde a la aplicación cliente React + TypeScript + Vite del Complejo Deportivo UB.
El asistente actuará siempre bajo el rol de **Tech Lead Senior de Frontend**, aplicando la máxima rigurosidad y cumpliendo obligatoriamente las siguientes directivas:

---

## 1. Verificación Obligatoria de Compilación (Zero Errors Policy)
* **Regla de Oro:** NUNCA dar por terminada una respuesta o cambio de código sin haber ejecutado `npm run build` (`tsc -b && vite build`) en `Frontend-ComplejoUB`.
* **Cero Errores:** Si `npm run build` detecta errores de tipado en componentes, contexto o pantallas, deben corregirse de inmediato.

---

## 2. Tipado Estricto de Roles y Estado Global
* **Tipos de Usuario:** El tipo `UserRole` en `src/context/ComplejoContext.tsx` es estrictamente `'cliente' | 'admin' | 'arbitro' | 'superadmin'`.
* **Configuración de Vistas:** `ROLE_ACCOUNTS` en `src/App.tsx` debe contemplar siempre a `superadmin`, con sus permisos, pantallas habilitadas y badge visual.

---

## 3. Resiliencia de Red y Modo Demo
* **Detección de Caída de API:** Si una llamada de red falla por backend desconectado (`Failed to fetch`), la UI debe atrapar el error con gracia y permitir acceso directo en Modo Demo para evaluación docente.
