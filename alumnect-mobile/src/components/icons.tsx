import React from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import Svg, { Path } from 'react-native-svg'
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
import { FingerprintIcon as PhFingerprint } from 'phosphor-react-native/src/icons/Fingerprint'
import { StudentIcon as PhStudent } from 'phosphor-react-native/src/icons/Student'
import { EnvelopeSimpleIcon as PhEnvelopeSimple } from 'phosphor-react-native/src/icons/EnvelopeSimple'
import { IdentificationCardIcon as PhIdentificationCard } from 'phosphor-react-native/src/icons/IdentificationCard'
import { XCircleIcon as PhXCircle } from 'phosphor-react-native/src/icons/XCircle'
import { CompassIcon as PhCompass } from 'phosphor-react-native/src/icons/Compass'
import { SquaresFourIcon as PhSquaresFour } from 'phosphor-react-native/src/icons/SquaresFour'
import { PlusSquareIcon as PhPlusSquare } from 'phosphor-react-native/src/icons/PlusSquare'
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
export const Compass = make(PhCompass, 'Compass')
export const LayoutGrid = make(PhSquaresFour, 'LayoutGrid')
export const PlusSquare = make(PhPlusSquare, 'PlusSquare')
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
export const Fingerprint = make(PhFingerprint, 'Fingerprint')
export const Student = make(PhStudent, 'Student')
export const MailIcon = make(PhEnvelopeSimple, 'MailIcon')
export const IdCard = make(PhIdentificationCard, 'IdCard')
export const XCircle = make(PhXCircle, 'XCircle')
export const Zap = make(PhLightning, 'Zap')

/**
 * Bộ icon SVG trích xuất từ Instagram/Threads Cotton (E:\Clone UIUX\instagram-clone & ig)
 * với nét 2px bo tròn mượt (continuous-curvature squircle) dành cho thanh header Bảng tin.
 */
export function IgCreatePost({ size = 24, color = '#000', style }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path
        fill={color}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15.6,1C16.7,1 17.6,1 18.3,1.1C19,1.1 19.7,1.2 20.3,1.5C21.2,2 22,2.8 22.4,3.7C22.8,4.3 22.9,5 22.9,5.7C23,6.4 23,7.3 23,8.4V15.6C23,16.7 23,17.6 22.9,18.3C22.9,19 22.8,19.7 22.4,20.3C22,21.2 21.2,22 20.3,22.4C19.7,22.8 19,22.9 18.3,22.9C17.6,23 16.7,23 15.6,23H8.4C7.3,23 6.4,23 5.7,22.9C5,22.9 4.3,22.8 3.7,22.4C2.8,22 2,21.2 1.5,20.3C1.2,19.7 1.1,19 1.1,18.3C1,17.6 1,16.7 1,15.6V8.4C1,7.3 1,6.4 1.1,5.7C1.1,5 1.2,4.3 1.5,3.7C2,2.8 2.8,2 3.7,1.5C4.3,1.2 5,1.1 5.7,1.1C6.4,1 7.3,1 8.4,1H15.6ZM8.4,3C7.3,3 6.5,3 5.8,3C5.2,3.1 4.9,3.2 4.6,3.3C4.1,3.6 3.6,4.1 3.3,4.6C3.2,4.9 3.1,5.2 3,5.8C3,6.5 3,7.3 3,8.4V15.6C3,16.7 3,17.5 3,18.1C3.1,18.7 3.2,19.1 3.3,19.4C3.6,19.9 4.1,20.4 4.6,20.7C4.9,20.8 5.2,20.9 5.8,20.9C6.5,21 7.3,21 8.4,21H15.6C16.7,21 17.5,21 18.1,20.9C18.7,20.9 19.1,20.8 19.4,20.7C19.9,20.4 20.4,19.9 20.7,19.4C20.8,19.1 20.9,18.7 20.9,18.1C21,17.5 21,16.7 21,15.6V8.4C21,7.3 21,6.5 20.9,5.8C20.9,5.2 20.8,4.9 20.7,4.6C20.4,4.1 19.9,3.6 19.4,3.3C19.1,3.2 18.7,3.1 18.1,3C17.5,3 16.7,3 15.6,3H8.4Z"
      />
      <Path
        fill={color}
        d="M12,6.5C12.552,6.5 13,6.948 13,7.5V11H16.5C17.052,11 17.5,11.448 17.5,12C17.5,12.552 17.052,13 16.5,13H13V16.5C13,17.052 12.552,17.5 12,17.5C11.448,17.5 11,17.052 11,16.5V13H7.5C6.948,13 6.5,12.552 6.5,12C6.5,11.448 6.948,11 7.5,11H11V7.5C11,6.948 11.448,6.5 12,6.5Z"
      />
    </Svg>
  )
}

export function IgSearch({ size = 24, color = '#000', style }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path
        fill={color}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11,1C16.523,1 21,5.477 21,11C21,13.401 20.153,15.604 18.742,17.328L22.707,21.293C23.098,21.684 23.098,22.316 22.707,22.707C22.316,23.098 21.684,23.098 21.293,22.707L17.328,18.742C15.604,20.153 13.401,21 11,21C5.477,21 1,16.523 1,11C1,5.477 5.477,1 11,1ZM11,3C6.582,3 3,6.582 3,11C3,15.418 6.582,19 11,19C15.418,19 19,15.418 19,11C19,6.582 15.418,3 11,3Z"
      />
    </Svg>
  )
}

export function IgClose({ size = 24, color = '#000', style }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path
        fill={color}
        d="M18.293,4.293C18.684,3.902 19.317,3.902 19.707,4.293C20.098,4.684 20.098,5.317 19.707,5.707L13.414,12L19.707,18.293C20.098,18.684 20.098,19.317 19.707,19.707C19.317,20.098 18.684,20.097 18.293,19.707L12,13.414L5.707,19.707C5.317,20.098 4.684,20.097 4.293,19.707C3.903,19.317 3.903,18.684 4.293,18.293L10.586,12L4.293,5.707C3.903,5.317 3.903,4.684 4.293,4.293C4.684,3.902 5.317,3.902 5.707,4.293L12,10.586L18.293,4.293Z"
      />
    </Svg>
  )
}

export function IgBell({ size = 24, color = '#000', style }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path
        fill={color}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12,1C13.4,1 14.7,1.7 15.5,2.8C17.1,3.6 18.5,4.9 19.2,6.9L19.3,7.3L19.3,7.4L20,10.5L20.1,10.9C20.4,11.9 20.7,12.8 21.2,13.7L21.3,13.9C22.4,16.5 20.5,19.5 17.6,19.5H16C15.7,21.5 14,23 12,23C10,23 8.3,21.5 8,19.5H6.4C3.4,19.5 1.5,16.3 2.8,13.7L3,13.3C3.5,12.4 3.8,11.5 4,10.5L4.7,7.4L4.7,7.3C5.3,5.1 6.8,3.6 8.5,2.8C9.3,1.7 10.6,1 12,1ZM10.1,19.5C10.3,20.4 11.1,21 12,21C12.9,21 13.7,20.4 13.9,19.5H10.1ZM12,3C11.2,3 10.4,3.4 10.1,4.1C10,4.3 9.8,4.4 9.6,4.5C8.2,5.1 7.1,6.2 6.6,7.8L5.9,10.9C5.7,12 5.3,13.1 4.8,14.2L4.6,14.6C3.9,15.9 4.9,17.5 6.4,17.5H17.6C19,17.5 20,16 19.4,14.7L19.4,14.6C18.9,13.6 18.4,12.5 18.2,11.4L18.1,10.9L17.4,7.8C16.9,6.2 15.8,5.1 14.4,4.5C14.2,4.4 14,4.3 13.9,4.1C13.6,3.4 12.8,3 12,3Z"
      />
    </Svg>
  )
}

export function IgMessenger({ size = 24, color = '#000', style }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path
        fill={color}
        d="M17.832,7.985C18.408,7.588 19.112,8.272 18.732,8.859L14.948,14.708C14.756,15.005 14.36,15.089 14.064,14.898L10.558,12.629C10.422,12.541 10.246,12.544 10.113,12.636L6.162,15.36C5.586,15.758 4.881,15.074 5.261,14.486L9.046,8.638C9.238,8.341 9.634,8.256 9.931,8.448L13.436,10.717C13.572,10.805 13.748,10.802 13.881,10.71L17.832,7.985Z"
      />
      <Path
        fill={color}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12,1C18.15,1 23,5.539 23,11.7C23,17.862 18.15,22.4 12,22.4C10.927,22.4 9.891,22.262 8.912,21.999L6.991,22.847L6.988,22.848L6.592,21.941L6.587,21.932L6.988,22.848C5.895,23.326 4.67,22.63 4.487,21.489L4.465,21.256V21.254L4.413,19.563C2.359,17.696 1.082,15.043 1.004,11.999L1,11.7C1,5.539 5.85,1 12,1ZM12,3C7.042,3 3.244,6.486 3.012,11.236L3,11.7C3,14.167 3.944,16.297 5.49,17.831L5.808,18.13L5.811,18.133C6.166,18.453 6.392,18.908 6.41,19.408V19.414L6.454,20.896L8.168,20.142L8.312,20.085C8.602,19.985 8.914,19.962 9.217,20.018L9.368,20.052L9.371,20.053C10.194,20.28 11.076,20.4 12,20.4C17.118,20.4 21,16.686 21,11.7C21,6.715 17.118,3 12,3Z"
      />
    </Svg>
  )
}

export function IgDirect({ size = 24, color = '#000', style }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path
        fill={color}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M19.535,2C22.239,2 23.947,4.853 22.754,7.213L22.63,7.439L14.833,20.557C13.236,23.245 9.257,22.737 8.32,19.851L8.239,19.565L6.583,12.721L1.945,8.17C-0.355,5.912 1.243,2 4.467,2H19.535ZM4.467,4C3.034,4 2.323,5.739 3.346,6.742L7.649,10.965L15.021,6.771L15.113,6.726C15.576,6.521 16.129,6.697 16.385,7.146C16.658,7.626 16.489,8.237 16.01,8.51L8.637,12.703L10.184,19.094C10.521,20.488 12.38,20.768 13.113,19.535L20.91,6.417L20.966,6.316C21.496,5.268 20.737,4 19.535,4H4.467Z"
      />
    </Svg>
  )
}

export function IgPlus({ size = 24, color = '#000', style }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path
        fill={color}
        d="M12,2C12.552,2 13,2.448 13,3V11H21C21.552,11 22,11.448 22,12C22,12.552 21.552,13 21,13H13V21C13,21.552 12.552,22 12,22C11.448,22 11,21.552 11,21V13H3C2.448,13 2,12.552 2,12C2,11.448 2.448,11 3,11H11V3C11,2.448 11.448,2 12,2Z"
      />
    </Svg>
  )
}

export function IgBellCheck({ size = 24, color = '#000', style }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path
        fill={color}
        d="M14,9C14.4,8.7 15.1,8.7 15.5,9C15.8,9.4 15.8,10.1 15.5,10.5L11.7,14.2C11.3,14.6 10.7,14.6 10.3,14.2L8.3,12.2C7.9,11.8 7.9,11.2 8.3,10.8C8.7,10.4 9.2,10.4 9.6,10.7L9.7,10.8L11,12.1L14,9Z"
      />
      <Path
        fill={color}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12,1C13.4,1 14.7,1.7 15.5,2.8C17.1,3.6 18.5,4.9 19.2,6.9L19.3,7.3L19.3,7.4L20,10.5C20.3,11.6 20.6,12.7 21.2,13.7C22.5,16.3 20.6,19.5 17.6,19.5H16C15.7,21.5 14,23 12,23C10,23 8.3,21.5 8,19.5H6.4C3.4,19.5 1.5,16.3 2.8,13.7C3.4,12.7 3.7,11.6 4,10.5L4.7,7.4C4.7,7.4 4.7,7.3 4.7,7.3C5.3,5.1 6.8,3.6 8.5,2.8C9.3,1.7 10.6,1 12,1ZM10.1,19.5C10.3,20.4 11.1,21 12,21C12.9,21 13.7,20.4 13.9,19.5H10.1ZM12,3C11.2,3 10.4,3.4 10.1,4.1C10,4.3 9.8,4.4 9.6,4.5C8.2,5.1 7.1,6.2 6.6,7.8L5.9,10.9C5.7,12.2 5.2,13.4 4.6,14.6C3.9,15.9 4.9,17.5 6.4,17.5H17.6C19.1,17.5 20.1,15.9 19.4,14.6C18.8,13.4 18.3,12.2 18.1,10.9L17.4,7.8C16.9,6.2 15.8,5.1 14.4,4.5C14.2,4.4 14,4.3 13.9,4.1C13.6,3.4 12.8,3 12,3Z"
      />
    </Svg>
  )
}

export function IgHeart({ size = 24, color = '#000', fill, style }: IconProps) {
  const isFilled = !!fill && fill !== 'transparent' && fill !== 'none'
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path
        fill={isFilled ? fill : color}
        d={isFilled
          ? 'M16.5,2C14.833,2 13.222,2.707 12,3.937C10.778,2.707 9.167,2 7.5,2C3.378,2 0.5,5.084 0.5,9.5C0.5,14.128 4.845,19.462 11.311,22.772C11.527,22.883 11.763,22.938 12,22.938C12.237,22.938 12.473,22.883 12.689,22.772C19.155,19.462 23.5,14.128 23.5,9.5C23.5,5.084 20.622,2 16.5,2Z'
          : 'M16.5,2C14.833,2 13.222,2.707 12,3.937C10.778,2.707 9.167,2 7.5,2C3.378,2 0.5,5.084 0.5,9.5C0.5,14.128 4.845,19.462 11.311,22.772C11.527,22.883 11.763,22.938 12,22.938C12.237,22.938 12.473,22.883 12.689,22.772C19.155,19.462 23.5,14.128 23.5,9.5C23.5,5.084 20.622,2 16.5,2ZM12,20.876C6.308,17.896 2.5,13.347 2.5,9.5C2.5,6.159 4.463,4 7.5,4C9.5,4 11.25,5.75 12,7.5C12.75,5.75 14.5,4 16.5,4C19.538,4 21.5,6.159 21.5,9.5C21.5,13.347 17.692,17.896 12,20.876Z'}
      />
    </Svg>
  )
}

export function IgComment({ size = 24, color = '#000', style }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path
        fill={color}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12,3C7.029,3 3,7.029 3,12C3,16.971 7.029,21 12,21C13.414,21 14.749,20.675 15.937,20.096C16.128,20.003 16.343,19.973 16.551,20.01L20.757,20.762L19.993,16.593C19.954,16.382 19.984,16.163 20.079,15.971C20.669,14.774 21,13.427 21,12C21,7.029 16.971,3 12,3ZM1,12C1,5.925 5.925,1 12,1C18.075,1 23,5.925 23,12C23,13.62 22.649,15.161 22.018,16.549L22.984,21.82C23.043,22.142 22.94,22.473 22.709,22.706C22.477,22.938 22.147,23.042 21.824,22.984L16.512,22.035C15.134,22.655 13.606,23 12,23C5.925,23 1,18.075 1,12Z"
      />
    </Svg>
  )
}

export function IgBookmark({ size = 24, color = '#000', fill, style }: IconProps) {
  const isFilled = !!fill && fill !== 'transparent' && fill !== 'none'
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      {isFilled ? (
        <Path
          fill={fill}
          fillRule="evenodd"
          clipRule="evenodd"
          d="M3,5C3,2.791 4.791,1 7,1H17C19.209,1 21,2.791 21,5V20C21,22.472 18.178,23.883 16.2,22.4L12,19.25L7.8,22.4C5.822,23.883 3,22.472 3,20V5Z"
        />
      ) : (
        <Path
          fill={color}
          d="M11.539,17.112C11.876,16.937 12.288,16.967 12.6,17.2L17.4,20.8C18.06,21.294 19,20.824 19,20V5C19,3.895 18.105,3 17,3H7C5.895,3 5,3.895 5,5V20C5,20.824 5.94,21.294 6.6,20.8L11.4,17.2L11.539,17.112ZM21,20C21,22.472 18.178,23.883 16.2,22.4L12,19.249L7.8,22.4C5.822,23.883 3,22.472 3,20V5C3,2.791 4.791,1 7,1H17C19.209,1 21,2.791 21,5V20Z"
        />
      )}
    </Svg>
  )
}



