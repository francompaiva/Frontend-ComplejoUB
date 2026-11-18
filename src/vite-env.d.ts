/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_DEV_PROXY_TARGET?: string;
  readonly VITE_DEMO_EMAIL_CLIENTE_1?: string;
  readonly VITE_DEMO_EMAIL_CLIENTE_2?: string;
  readonly VITE_DEMO_EMAIL_SUPERADMIN?: string;
  readonly VITE_DEMO_EMAIL_ADMIN?: string;
  readonly VITE_DEMO_EMAIL_ARBITRO?: string;
  readonly VITE_DEMO_EMAIL_SANCIONADO?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
