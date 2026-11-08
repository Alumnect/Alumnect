/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  /** 'true' to enforce auth/RBAC route guards and call the real auth API. */
  readonly VITE_REQUIRE_AUTH?: string
  readonly VITE_GOOGLE_CLIENT_ID?: string
  /** Google Analytics 4 Measurement ID (e.g. G-XXXXXXXXXX) */
  readonly VITE_GA_MEASUREMENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  google?: any
  dataLayer?: any[]
  gtag?: (...args: any[]) => void
}
