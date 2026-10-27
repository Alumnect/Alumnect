import React from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import type { Icon as PhosphorIcon, IconWeight } from 'phosphor-react-native'
import { ArrowCounterClockwiseIcon as PhArrowCounterClockwise } from 'phosphor-react-native/src/icons/ArrowCounterClockwise'
import { ArrowDownLeftIcon as PhArrowDownLeft } from 'phosphor-react-native/src/icons/ArrowDownLeft'
import { ArrowElbowDownRightIcon as PhArrowElbowDownRight } from 'phosphor-react-native/src/icons/ArrowElbowDownRight'
import { ArrowFatUpIcon as PhArrowFatUp } from 'phosphor-react-native/src/icons/ArrowFatUp'
import { BankIcon as PhBank } from 'phosphor-react-native/src/icons/Bank'
import { BellIcon as PhBell } from 'phosphor-react-native/src/icons/Bell'
import { BookmarkSimpleIcon as PhBookmarkSimple } from 'phosphor-react-native/src/icons/BookmarkSimple'
import { BriefcaseIcon as PhBriefcase } from 'phosphor-react-native/src/icons/Briefcase'
import { BuildingsIcon as PhBuildings } from 'phosphor-react-native/src/icons/Buildings'
import { CalendarIcon as PhCalendar } from 'phosphor-react-native/src/icons/Calendar'
import { CalendarCheckIcon as PhCalendarCheck } from 'phosphor-react-native/src/icons/CalendarCheck'
import { CalendarDotsIcon as PhCalendarDots } from 'phosphor-react-native/src/icons/CalendarDots'
import { CalendarPlusIcon as PhCalendarPlus } from 'phosphor-react-native/src/icons/CalendarPlus'
import { CalendarXIcon as PhCalendarX } from 'phosphor-react-native/src/icons/CalendarX'
import { CameraIcon as PhCamera } from 'phosphor-react-native/src/icons/Camera'
import { CaretDownIcon as PhCaretDown } from 'phosphor-react-native/src/icons/CaretDown'
import { CaretLeftIcon as PhCaretLeft } from 'phosphor-react-native/src/icons/CaretLeft'
import { CaretRightIcon as PhCaretRight } from 'phosphor-react-native/src/icons/CaretRight'
import { ChartBarIcon as PhChartBar } from 'phosphor-react-native/src/icons/ChartBar'
import { ChatCircleIcon as PhChatCircle } from 'phosphor-react-native/src/icons/ChatCircle'
import { ChatsCircleIcon as PhChatsCircle } from 'phosphor-react-native/src/icons/ChatsCircle'
import { CheckIcon as PhCheck } from 'phosphor-react-native/src/icons/Check'
import { CheckCircleIcon as PhCheckCircle } from 'phosphor-react-native/src/icons/CheckCircle'
import { ChecksIcon as PhChecks } from 'phosphor-react-native/src/icons/Checks'
import { CircleIcon as PhCircle } from 'phosphor-react-native/src/icons/Circle'
import { ClipboardTextIcon as PhClipboardText } from 'phosphor-react-native/src/icons/ClipboardText'
import { ClockIcon as PhClock } from 'phosphor-react-native/src/icons/Clock'
import { ClockCounterClockwiseIcon as PhClockCounterClockwise } from 'phosphor-react-native/src/icons/ClockCounterClockwise'
import { CoinsIcon as PhCoins } from 'phosphor-react-native/src/icons/Coins'
import { CreditCardIcon as PhCreditCard } from 'phosphor-react-native/src/icons/CreditCard'
import { DotsThreeIcon as PhDotsThree } from 'phosphor-react-native/src/icons/DotsThree'
import { FileArrowUpIcon as PhFileArrowUp } from 'phosphor-react-native/src/icons/FileArrowUp'
import { FilePlusIcon as PhFilePlus } from 'phosphor-react-native/src/icons/FilePlus'
import { FileTextIcon as PhFileText } from 'phosphor-react-native/src/icons/FileText'
import { FireIcon as PhFire } from 'phosphor-react-native/src/icons/Fire'
import { GearSixIcon as PhGearSix } from 'phosphor-react-native/src/icons/GearSix'
import { GlobeIcon as PhGlobe } from 'phosphor-react-native/src/icons/Globe'
import { GraduationCapIcon as PhGraduationCap } from 'phosphor-react-native/src/icons/GraduationCap'
import { HandshakeIcon as PhHandshake } from 'phosphor-react-native/src/icons/Handshake'
import { HeartIcon as PhHeart } from 'phosphor-react-native/src/icons/Heart'
import { HourglassIcon as PhHourglass } from 'phosphor-react-native/src/icons/Hourglass'
import { HouseIcon as PhHouse } from 'phosphor-react-native/src/icons/House'
import { ImageIcon as PhImage } from 'phosphor-react-native/src/icons/Image'
import { ImageSquareIcon as PhImageSquare } from 'phosphor-react-native/src/icons/ImageSquare'
import { InfoIcon as PhInfo } from 'phosphor-react-native/src/icons/Info'
import { KeyIcon as PhKey } from 'phosphor-react-native/src/icons/Key'
import { LaptopIcon as PhLaptop } from 'phosphor-react-native/src/icons/Laptop'
import { LightningIcon as PhLightning } from 'phosphor-react-native/src/icons/Lightning'
import { LinkSimpleIcon as PhLinkSimple } from 'phosphor-react-native/src/icons/LinkSimple'
import { ListChecksIcon as PhListChecks } from 'phosphor-react-native/src/icons/ListChecks'
import { LockIcon as PhLock } from 'phosphor-react-native/src/icons/Lock'
import { MagnifyingGlassIcon as PhMagnifyingGlass } from 'phosphor-react-native/src/icons/MagnifyingGlass'
import { MapPinIcon as PhMapPin } from 'phosphor-react-native/src/icons/MapPin'
import { MapTrifoldIcon as PhMapTrifold } from 'phosphor-react-native/src/icons/MapTrifold'
import { MedalIcon as PhMedal } from 'phosphor-react-native/src/icons/Medal'
import { NotePencilIcon as PhNotePencil } from 'phosphor-react-native/src/icons/NotePencil'
import { NotebookIcon as PhNotebook } from 'phosphor-react-native/src/icons/Notebook'
import { PackageIcon as PhPackage } from 'phosphor-react-native/src/icons/Package'
import { PaperPlaneTiltIcon as PhPaperPlaneTilt } from 'phosphor-react-native/src/icons/PaperPlaneTilt'
import { PaperclipIcon as PhPaperclip } from 'phosphor-react-native/src/icons/Paperclip'
import { PathIcon as PhPath } from 'phosphor-react-native/src/icons/Path'
import { PencilSimpleIcon as PhPencilSimple } from 'phosphor-react-native/src/icons/PencilSimple'
import { PencilSimpleLineIcon as PhPencilSimpleLine } from 'phosphor-react-native/src/icons/PencilSimpleLine'
import { PhoneIcon as PhPhone } from 'phosphor-react-native/src/icons/Phone'
import { PlusIcon as PhPlus } from 'phosphor-react-native/src/icons/Plus'
import { PushPinIcon as PhPushPin } from 'phosphor-react-native/src/icons/PushPin'
import { QuestionIcon as PhQuestion } from 'phosphor-react-native/src/icons/Question'
import { ReceiptIcon as PhReceipt } from 'phosphor-react-native/src/icons/Receipt'
import { ScalesIcon as PhScales } from 'phosphor-react-native/src/icons/Scales'
import { SealCheckIcon as PhSealCheck } from 'phosphor-react-native/src/icons/SealCheck'
import { ShareNetworkIcon as PhShareNetwork } from 'phosphor-react-native/src/icons/ShareNetwork'
import { ShieldWarningIcon as PhShieldWarning } from 'phosphor-react-native/src/icons/ShieldWarning'
import { SignOutIcon as PhSignOut } from 'phosphor-react-native/src/icons/SignOut'
import { SlidersHorizontalIcon as PhSlidersHorizontal } from 'phosphor-react-native/src/icons/SlidersHorizontal'
import { SparkleIcon as PhSparkle } from 'phosphor-react-native/src/icons/Sparkle'
import { StackIcon as PhStack } from 'phosphor-react-native/src/icons/Stack'
import { StarIcon as PhStar } from 'phosphor-react-native/src/icons/Star'
import { TargetIcon as PhTarget } from 'phosphor-react-native/src/icons/Target'
import { TrayIcon as PhTray } from 'phosphor-react-native/src/icons/Tray'
import { TrendUpIcon as PhTrendUp } from 'phosphor-react-native/src/icons/TrendUp'
import { TrophyIcon as PhTrophy } from 'phosphor-react-native/src/icons/Trophy'
import { UserIcon as PhUser } from 'phosphor-react-native/src/icons/User'
import { UserCheckIcon as PhUserCheck } from 'phosphor-react-native/src/icons/UserCheck'
import { UserFocusIcon as PhUserFocus } from 'phosphor-react-native/src/icons/UserFocus'
import { UserPlusIcon as PhUserPlus } from 'phosphor-react-native/src/icons/UserPlus'
import { UsersThreeIcon as PhUsersThree } from 'phosphor-react-native/src/icons/UsersThree'
import { WalletIcon as PhWallet } from 'phosphor-react-native/src/icons/Wallet'
import { WarningIcon as PhWarning } from 'phosphor-react-native/src/icons/Warning'
import { XIcon as PhX } from 'phosphor-react-native/src/icons/X'
import { XCircleIcon as PhXCircle } from 'phosphor-react-native/src/icons/XCircle'
import { EyeIcon as PhEye } from 'phosphor-react-native/src/icons/Eye'
import { EyeSlashIcon as PhEyeSlash } from 'phosphor-react-native/src/icons/EyeSlash'

/**
 * Bộ icon của app: Phosphor (nét bo tròn, có nhiều độ đậm).
 * Giữ nguyên tên và props kiểu cũ (`size`, `color`, `strokeWidth`, `fill`) để các màn hình không phải sửa:
 * - `fill` có màu (trạng thái đã thích/đã lưu) => icon đặc (`fill`).
 * - `strokeWidth` >= 2.5 => nét đậm (`bold`).
 * - Muốn kiểm soát trực tiếp: truyền `weight` ('regular' | 'bold' | 'fill' | 'duotone'...).
 */
export type IconProps = {
  size?: number
  color?: string
  strokeWidth?: number
  fill?: string
  weight?: IconWeight
  mirrored?: boolean
  style?: StyleProp<ViewStyle>
  testID?: string
}

export type { IconWeight }

function make(Glyph: PhosphorIcon, name: string) {
  const C = ({ size = 24, color, strokeWidth, fill, weight, ...rest }: IconProps) => {
    const filled = !!fill && fill !== 'transparent' && fill !== 'none'
    const w: IconWeight = weight ?? (filled ? 'fill' : strokeWidth && strokeWidth >= 2.5 ? 'bold' : 'regular')
    return <Glyph size={size} color={color} weight={w} {...rest} />
  }
  C.displayName = name
  return C
}
export const AlertTriangle = make(PhWarning, 'AlertTriangle')
export const Eye = make(PhEye, 'Eye')
export const EyeOff = make(PhEyeSlash, 'EyeOff')
export const ArrowBigUp = make(PhArrowFatUp, 'ArrowBigUp')
export const ArrowDownLeft = make(PhArrowDownLeft, 'ArrowDownLeft')
export const Award = make(PhMedal, 'Award')
export const BadgeCheck = make(PhSealCheck, 'BadgeCheck')
export const BarChart3 = make(PhChartBar, 'BarChart3')
export const Bell = make(PhBell, 'Bell')
export const Bookmark = make(PhBookmarkSimple, 'Bookmark')
export const Briefcase = make(PhBriefcase, 'Briefcase')
export const BriefcaseBusiness = make(PhBriefcase, 'BriefcaseBusiness')
export const Building2 = make(PhBuildings, 'Building2')
export const Calendar = make(PhCalendar, 'Calendar')
export const CalendarCheck = make(PhCalendarCheck, 'CalendarCheck')
export const CalendarClock = make(PhCalendarDots, 'CalendarClock')
export const CalendarDays = make(PhCalendarDots, 'CalendarDays')
export const CalendarPlus = make(PhCalendarPlus, 'CalendarPlus')
export const CalendarX2 = make(PhCalendarX, 'CalendarX2')
export const Camera = make(PhCamera, 'Camera')
export const Check = make(PhCheck, 'Check')
export const CheckCheck = make(PhChecks, 'CheckCheck')
export const CheckCircle2 = make(PhCheckCircle, 'CheckCircle2')
export const ChevronDown = make(PhCaretDown, 'ChevronDown')
export const ChevronLeft = make(PhCaretLeft, 'ChevronLeft')
export const ChevronRight = make(PhCaretRight, 'ChevronRight')
export const Circle = make(PhCircle, 'Circle')
export const ClipboardList = make(PhClipboardText, 'ClipboardList')
export const Clock = make(PhClock, 'Clock')
export const Coins = make(PhCoins, 'Coins')
export const CornerDownRight = make(PhArrowElbowDownRight, 'CornerDownRight')
export const CreditCard = make(PhCreditCard, 'CreditCard')
export const FileCheck2 = make(PhFileArrowUp, 'FileCheck2')
export const FilePen = make(PhNotePencil, 'FilePen')
export const FilePlus2 = make(PhFilePlus, 'FilePlus2')
export const FileText = make(PhFileText, 'FileText')
export const Flame = make(PhFire, 'Flame')
export const Globe = make(PhGlobe, 'Globe')
export const GraduationCap = make(PhGraduationCap, 'GraduationCap')
export const Handshake = make(PhHandshake, 'Handshake')
export const Heart = make(PhHeart, 'Heart')
export const HelpCircle = make(PhQuestion, 'HelpCircle')
export const History = make(PhClockCounterClockwise, 'History')
export const Home = make(PhHouse, 'Home')
export const Hourglass = make(PhHourglass, 'Hourglass')
export const Image = make(PhImage, 'Image')
export const ImageIcon = make(PhImage, 'ImageIcon')
export const ImagePlus = make(PhImageSquare, 'ImagePlus')
export const Inbox = make(PhTray, 'Inbox')
export const Info = make(PhInfo, 'Info')
export const KeyRound = make(PhKey, 'KeyRound')
export const Landmark = make(PhBank, 'Landmark')
export const Laptop = make(PhLaptop, 'Laptop')
export const Layers = make(PhStack, 'Layers')
export const Link2 = make(PhLinkSimple, 'Link2')
export const ListChecks = make(PhListChecks, 'ListChecks')
export const Lock = make(PhLock, 'Lock')
export const LogOut = make(PhSignOut, 'LogOut')
export const Map = make(PhMapTrifold, 'Map')
export const MapPin = make(PhMapPin, 'MapPin')
export const MessageCircle = make(PhChatCircle, 'MessageCircle')
export const MessageSquare = make(PhChatsCircle, 'MessageSquare')
export const MoreHorizontal = make(PhDotsThree, 'MoreHorizontal')
export const NotebookPen = make(PhNotebook, 'NotebookPen')
export const PackageCheck = make(PhPackage, 'PackageCheck')
export const Paperclip = make(PhPaperclip, 'Paperclip')
export const PenSquare = make(PhPencilSimpleLine, 'PenSquare')
export const Pencil = make(PhPencilSimple, 'Pencil')
export const Phone = make(PhPhone, 'Phone')
export const Pin = make(PhPushPin, 'Pin')
export const Plus = make(PhPlus, 'Plus')
export const Receipt = make(PhReceipt, 'Receipt')
export const RotateCcw = make(PhArrowCounterClockwise, 'RotateCcw')
export const Route = make(PhPath, 'Route')
export const Scale = make(PhScales, 'Scale')
export const Search = make(PhMagnifyingGlass, 'Search')
export const Send = make(PhPaperPlaneTilt, 'Send')
export const Settings = make(PhGearSix, 'Settings')
export const Share2 = make(PhShareNetwork, 'Share2')
export const ShieldAlert = make(PhShieldWarning, 'ShieldAlert')
export const SlidersHorizontal = make(PhSlidersHorizontal, 'SlidersHorizontal')
export const Sparkles = make(PhSparkle, 'Sparkles')
export const SquarePen = make(PhPencilSimpleLine, 'SquarePen')
export const Star = make(PhStar, 'Star')
export const Target = make(PhTarget, 'Target')
export const TrendingUp = make(PhTrendUp, 'TrendingUp')
export const Trophy = make(PhTrophy, 'Trophy')
export const UserCheck = make(PhUserCheck, 'UserCheck')
export const UserPlus = make(PhUserPlus, 'UserPlus')
export const UserRound = make(PhUser, 'UserRound')
export const UserSearch = make(PhUserFocus, 'UserSearch')
export const Users = make(PhUsersThree, 'Users')
export const Wallet = make(PhWallet, 'Wallet')
export const X = make(PhX, 'X')
export const XCircle = make(PhXCircle, 'XCircle')
export const Zap = make(PhLightning, 'Zap')
