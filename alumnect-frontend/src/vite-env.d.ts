/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  /** 'true' to enforce auth/RBAC route guards and call the real auth API. */
  readonly VITE_REQUIRE_AUTH?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
