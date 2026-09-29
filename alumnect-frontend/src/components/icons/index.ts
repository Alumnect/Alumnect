/**
 * Centralized Icon Design System — AlumNect (Threads & Instagram Style)
 *
 * Sử dụng bộ thư viện `@phosphor-icons/react` với đặc trưng:
 *  - Đường nét mềm mại (1.5 - 2px stroke), bo góc tự nhiên.
 *  - Hỗ trợ đầy đủ cơ chế Dual-State đặc trưng của Threads/Instagram:
 *      + Trạng thái bình thường: `weight="regular"` (Outline nét mảnh thanh lịch).
 *      + Trạng thái kích hoạt (Active/Selected/Hover): `weight="fill"` (Đục đặc nguyên khối).
 */
import type { ComponentType } from 'react'
import type { IconProps } from '@phosphor-icons/react'

export type { IconProps, IconWeight } from '@phosphor-icons/react'
export type AppIcon = ComponentType<IconProps>

// Re-export trực tiếp các biểu tượng Phosphor chuẩn
export {
  // Navigation & Shell chính (Đổi Outline ➔ Fill khi Active)
  House,
  House as HomeIcon,
  Users,
  Users as MembersIcon,
  Briefcase,
  Briefcase as JobsIcon,
  CalendarBlank,
  CalendarBlank as CalendarIcon,
  ChatCircleDots,
  ChatCircleDots as ForumIcon,
  UsersThree,
  UsersThree as GroupsIcon,
  ChartLineUp,
  ChartLineUp as SalaryIcon,
  Compass,
  Compass as MapIcon,
  GitFork,
  GitFork as CareerIcon,
  Chats,
  Chats as MessagesIcon,
  Bell,
  Bell as NotificationIcon,
  CreditCard,
  CreditCard as SubscriptionIcon,
  User,
  User as ProfileIcon,
  SquaresFour,
  SquaresFour as AppsMenuIcon,
  MagnifyingGlass,
  MagnifyingGlass as SearchIcon,

  // Tương tác Bảng tin (Feed - Like, Comment, Repost, Bookmark)
  Heart,
  Heart as LikeIcon,
  ChatCircle,
  ChatCircle as CommentIcon,
  ShareFat,
  ShareFat as ShareIcon,
  BookmarkSimple,
  BookmarkSimple as BookmarkIcon,
  Repeat,
  Repeat as RepostIcon,
  DotsThreeVertical,
  DotsThreeVertical as MoreVerticalIcon,
  DotsThree,
  DotsThree as MoreHorizontalIcon,

  // Hội nhóm & Quản trị (Community & Security)
  LockKey,
  LockKey as PrivateIcon,
  GlobeSimple,
  GlobeSimple as PublicIcon,
  Crown,
  Crown as OwnerIcon,
  ShieldCheck,
  ShieldCheck as AdminIcon,
  SignOut,
  SignOut as LogoutIcon,
  Trash,
  Trash as DeleteIcon,
  PencilSimple,
  PencilSimple as EditIcon,
  Plus,
  Plus as PlusIcon,
  X,
  X as CloseIcon,
  ArrowLeft,
  ArrowLeft as BackIcon,
  CaretDown,
  CaretDown as ChevronDownIcon,
  Sun,
  Sun as LightModeIcon,
  Moon,
  Moon as DarkModeIcon,
  Sparkle,
  Sparkle as SparklesIcon,
  SealCheck,
  SealCheck as VerifiedIcon,
  UserGear,
  Megaphone,
  FileText,
  Flag,
  ArrowUp,
  Image,
  Image as ImageIcon,
  PaperPlaneTilt,
  PaperPlaneTilt as SendIcon,
} from '@phosphor-icons/react'
