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

declare module '@phosphor-icons/react' {
  import type { ComponentType, SVGProps } from 'react'
  export type IconWeight = 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone'
  export interface IconProps extends SVGProps<SVGSVGElement> {
    alt?: string
    color?: string
    size?: string | number
    weight?: IconWeight
    mirrored?: boolean
  }
  export type Icon = ComponentType<IconProps>
  export const House: Icon
  export const Users: Icon
  export const Briefcase: Icon
  export const CalendarBlank: Icon
  export const ChatCircleDots: Icon
  export const Question: Icon
  export const UsersThree: Icon
  export const ChartLineUp: Icon
  export const GraduationCap: Icon
  export const Handshake: Icon
  export const Compass: Icon
  export const GitFork: Icon
  export const Chats: Icon
  export const Bell: Icon
  export const CreditCard: Icon
  export const Coins: Icon
  export const User: Icon
  export const SquaresFour: Icon
  export const MagnifyingGlass: Icon
  export const Heart: Icon
  export const ChatCircle: Icon
  export const ShareFat: Icon
  export const BookmarkSimple: Icon
  export const Repeat: Icon
  export const DotsThreeVertical: Icon
  export const DotsThree: Icon
  export const LockKey: Icon
  export const GlobeSimple: Icon
  export const Crown: Icon
  export const ShieldCheck: Icon
  export const SignOut: Icon
  export const Trash: Icon
  export const PencilSimple: Icon
  export const Plus: Icon
  export const X: Icon
  export const ArrowLeft: Icon
  export const CaretDown: Icon
  export const Sun: Icon
  export const Moon: Icon
  export const Sparkle: Icon
  export const SealCheck: Icon
  export const UserGear: Icon
  export const Megaphone: Icon
  export const FileText: Icon
  export const Flag: Icon
  export const ArrowUp: Icon
  export const Image: Icon
  export const PaperPlaneTilt: Icon
}
