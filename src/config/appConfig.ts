/**
 * Configuración centralizada de la aplicación.
 *
 * Todos los valores dependientes del entorno (URL del backend, cuentas de demostración)
 * se leen exclusivamente desde variables de entorno de Vite (`VITE_*`).
 * No se almacenan contraseñas ni URLs de infraestructura en el código fuente.
 */
import type { UserRole } from '../context/ComplejoContext';

const env = import.meta.env;

const clean = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

/**
 * URL base de la API REST.
 * - Producción (Vercel): definir `VITE_API_URL` con la URL pública del backend (Railway / Render).
 * - Desarrollo: si no se define, se usa la ruta relativa `/api/v1`, que el proxy de Vite
 *   redirige al destino configurado en `VITE_DEV_PROXY_TARGET`.
 */
export const API_BASE_URL: string = clean(env.VITE_API_URL).replace(/\/+$/, '') || '/api/v1';

export type DemoAccountKey = 'cliente1' | 'cliente2' | 'superadmin' | 'admin' | 'arbitro' | 'sancionado';

export interface DemoAccount {
  key: DemoAccountKey;
  label: string;
  description: string;
  role: UserRole;
  email: string;
}

const DEMO_ACCOUNT_DEFINITIONS: Omit<DemoAccount, 'email'>[] = [
  { key: 'cliente1', label: 'Cliente 1', description: 'Cliente / Capitán de equipo', role: 'cliente' },
  { key: 'cliente2', label: 'Cliente 2', description: 'Segundo cliente para verificar reservas cruzadas', role: 'cliente' },
  { key: 'superadmin', label: 'Superadmin', description: 'Superadministrador general', role: 'superadmin' },
  { key: 'admin', label: 'Administrador', description: 'Administrador de sede', role: 'admin' },
  { key: 'arbitro', label: 'Árbitro', description: 'Árbitro oficial', role: 'arbitro' },
  { key: 'sancionado', label: 'Sancionado', description: 'Cliente con cuenta suspendida por inasistencias', role: 'cliente' },
];

const DEMO_ENV_VALUES: Record<DemoAccountKey, string> = {
  cliente1: clean(env.VITE_DEMO_EMAIL_CLIENTE_1),
  cliente2: clean(env.VITE_DEMO_EMAIL_CLIENTE_2),
  superadmin: clean(env.VITE_DEMO_EMAIL_SUPERADMIN),
  admin: clean(env.VITE_DEMO_EMAIL_ADMIN),
  arbitro: clean(env.VITE_DEMO_EMAIL_ARBITRO),
  sancionado: clean(env.VITE_DEMO_EMAIL_SANCIONADO),
};

/**
 * Perfiles de acceso rápido. Solo se exponen los que tengan un email configurado
 * en el entorno. El acceso rápido completa únicamente el correo: la contraseña
 * siempre debe ingresarla el usuario.
 */
export const DEMO_ACCOUNTS: DemoAccount[] = DEMO_ACCOUNT_DEFINITIONS
  .map((def) => ({ ...def, email: DEMO_ENV_VALUES[def.key].toLowerCase() }))
  .filter((acc) => acc.email.length > 0);

export const findDemoAccountByEmail = (email: string): DemoAccount | undefined => {
  const target = email.trim().toLowerCase();
  return DEMO_ACCOUNTS.find((acc) => acc.email === target);
};

export const getDemoEmailForRole = (role: UserRole): string =>
  DEMO_ACCOUNTS.find((acc) => acc.role === role && acc.key !== 'sancionado')?.email || '';
