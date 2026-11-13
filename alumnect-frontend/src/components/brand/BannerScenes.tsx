import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { CampusIllustration } from './CampusIllustration'

/**
 * Bộ minh hoạ cho dải đầu trang: mỗi nhóm trang một cảnh riêng theo nội dung,
 * cùng nét vẽ phẳng, bảng màu và dải đồi của minh hoạ campus FPT để nhìn thành một bộ.
 */
export type BannerSceneKey =
  | 'campus'
  | 'users'
  | 'verify'
  | 'posts'
  | 'reports'
  | 'packages'
  | 'disputes'
  | 'ledger'
  | 'revenue'
  | 'broadcast'
  | 'ranking'
  | 'request'
  | 'sent'
  | 'inbox'
  | 'tasks'
  | 'deal'
  | 'wallet'
  | 'refund'
  | 'groups'
  | 'chat'
  | 'profile'
  | 'status'

const K = {
  orange: '#F27024',
  orangeDeep: '#E3561A',
  navy: '#1F2A44',
  blue: '#1F6BB8',
  sky: '#5B8FD1',
  green: '#3E9B4F',
  mint: '#8BD3A0',
  gold: '#F5B83D',
  red: '#E5484D',
  purple: '#6B4BC2',
  paper: '#FFFFFF',
  paperShade: '#F4F1E8',
  line: '#D9CFC6',
  skin: '#F2C7A5',
  hair: '#2B2B2B',
  wood: '#C98B5A',
  woodDark: '#9C6A42',
}

/* ---------------------------- Thành phần vẽ dùng chung ---------------------------- */

/** Người đứng, gốc toạ độ ở chân. cap = mũ cử nhân, bag = ba lô, wave = giơ tay */
function Person({
  x,
  y,
  s = 1,
  shirt,
  cap,
  bag,
  wave,
  flip,
}: {
  x: number
  y: number
  s?: number
  shirt: string
  cap?: boolean
  bag?: boolean
  wave?: boolean
  flip?: boolean
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <rect x={-8} y={-15} width={6} height={15} rx={2.5} fill={K.navy} />
      <rect x={2} y={-15} width={6} height={15} rx={2.5} fill={K.navy} />
      {bag && <rect x={7} y={-36} width={9} height={17} rx={3.5} fill={K.orange} />}
      <rect x={-10} y={-38} width={20} height={26} rx={7} fill={shirt} />
      {wave ? (
        <path d="M8 -33 L17 -48" stroke={K.skin} strokeWidth={4.5} strokeLinecap="round" />
      ) : (
        <path d="M-9 -31 L-12 -18" stroke={K.skin} strokeWidth={4.5} strokeLinecap="round" />
      )}
      <circle cx={0} cy={-46} r={8.5} fill={K.skin} />
      <path d="M-8.5 -47 A8.5 8.5 0 0 1 8.5 -47 L8.5 -49 Q0 -58 -8.5 -49 Z" fill={K.hair} />
      {cap && (
        <g>
          <path d="M-12 -53 L0 -58 L12 -53 L0 -48 Z" fill={K.navy} />
          <path d="M11 -53 L11 -44" stroke={K.orange} strokeWidth={1.6} strokeLinecap="round" />
        </g>
      )}
    </g>
  )
}

function Coin({ x, y, r = 9 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={K.gold} />
      <circle cx={x} cy={y} r={r * 0.66} fill="none" stroke="#E09A1F" strokeWidth={1.6} />
      <path d={`M${x} ${y - r * 0.38} L${x} ${y + r * 0.38}`} stroke="#E09A1F" strokeWidth={1.8} strokeLinecap="round" />
    </g>
  )
}

/** Tờ giấy có các dòng chữ giả */
function Paper({ x, y, w, h, rot = 0, lines = 3, accent }: { x: number; y: number; w: number; h: number; rot?: number; lines?: number; accent?: string }) {
  return (
    <g transform={`rotate(${rot} ${x + w / 2} ${y + h / 2})`}>
      <rect x={x} y={y} width={w} height={h} rx={4} fill={K.paper} stroke={K.line} />
      {accent && <rect x={x + 6} y={y + 6} width={w * 0.4} height={5} rx={2.5} fill={accent} />}
      {Array.from({ length: lines }).map((_, i) => (
        <rect key={i} x={x + 6} y={y + (accent ? 16 : 8) + i * 8} width={w - 12 - (i % 2) * 10} height={3.5} rx={1.75} fill={K.line} />
      ))}
    </g>
  )
}

function Plant({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <path d={`M${x - 7} ${y - 12} H${x + 7} L${x + 5} ${y} H${x - 5} Z`} fill={K.wood} />
      <path d={`M${x} ${y - 12} Q${x - 10} ${y - 24} ${x - 12} ${y - 30}`} stroke={K.green} strokeWidth={3} fill="none" strokeLinecap="round" />
      <path d={`M${x} ${y - 12} Q${x + 8} ${y - 26} ${x + 12} ${y - 32}`} stroke={K.green} strokeWidth={3} fill="none" strokeLinecap="round" />
      <path d={`M${x} ${y - 12} V${y - 34}`} stroke={K.green} strokeWidth={3} strokeLinecap="round" />
    </g>
  )
}

function Sparkle({ x, y, c = K.gold, s = 1 }: { x: number; y: number; c?: string; s?: number }) {
  return <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 -7 L1.8 -1.8 L7 0 L1.8 1.8 L0 7 L-1.8 1.8 L-7 0 L-1.8 -1.8 Z" fill={c} />
}

/* ---------------------------------- Các cảnh ---------------------------------- */

const SCENES: Record<Exclude<BannerSceneKey, 'campus'>, () => ReactNode> = {
  // Quản lý tài khoản: ba thành viên + thẻ hồ sơ
  users: () => (
    <>
      <g transform="rotate(-6 100 62)">
        <rect x={70} y={40} width={64} height={42} rx={7} fill={K.paper} stroke={K.line} />
        <circle cx={86} cy={58} r={9} fill={K.sky} />
        <circle cx={86} cy={55} r={3.5} fill={K.paper} />
        <rect x={100} y={52} width={26} height={4} rx={2} fill={K.navy} />
        <rect x={100} y={60} width={18} height={3.5} rx={1.75} fill={K.line} />
        <rect x={76} y={72} width={52} height={3.5} rx={1.75} fill={K.line} />
      </g>
      <Person x={176} y={150} shirt={K.blue} bag />
      <Person x={212} y={152} s={1.12} shirt={K.navy} cap />
      <Person x={248} y={150} shirt={K.orange} wave />
      <Sparkle x={148} y={36} />
    </>
  ),
  // Xác minh cựu sinh viên: bằng tốt nghiệp + khiên tích xanh
  verify: () => (
    <>
      <rect x={88} y={56} width={92} height={62} rx={6} fill={K.paper} stroke={K.line} />
      <rect x={96} y={64} width={76} height={46} rx={3} fill="none" stroke={K.gold} strokeWidth={2} />
      <rect x={110} y={74} width={48} height={5} rx={2.5} fill={K.navy} />
      <rect x={104} y={86} width={60} height={3.5} rx={1.75} fill={K.line} />
      <rect x={110} y={94} width={48} height={3.5} rx={1.75} fill={K.line} />
      <circle cx={162} cy={108} r={9} fill={K.red} />
      <path d="M158 115 L156 126 L162 122 L168 126 L166 115" fill={K.red} />
      <path d="M210 52 L232 60 V80 Q232 98 210 108 Q188 98 188 80 V60 Z" fill={K.green} />
      <path d="M200 80 L208 88 L222 72" stroke={K.paper} strokeWidth={4.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Person x={262} y={152} s={1.1} shirt={K.navy} cap wave />
      <Sparkle x={240} y={46} />
    </>
  ),
  // Bài viết cộng đồng: bảng tin có ghim
  posts: () => (
    <>
      <path d="M108 150 L114 112 M196 150 L190 112" stroke={K.woodDark} strokeWidth={5} strokeLinecap="round" />
      <rect x={90} y={46} width={124} height={72} rx={6} fill={K.woodDark} />
      <rect x={96} y={52} width={112} height={60} rx={4} fill="#E8B98A" />
      <Paper x={102} y={58} w={32} h={38} rot={-5} lines={3} accent={K.orange} />
      <Paper x={138} y={62} w={30} h={30} rot={4} lines={2} accent={K.blue} />
      <rect x={172} y={58} width={30} height={26} rx={3} fill="#FFE07A" transform="rotate(-3 187 71)" />
      <circle cx={118} cy={60} r={2.6} fill={K.red} />
      <circle cx={153} cy={64} r={2.6} fill={K.green} />
      <circle cx={187} cy={60} r={2.6} fill={K.blue} />
      <Person x={248} y={152} shirt={K.sky} wave flip />
    </>
  ),
  // Báo cáo vi phạm: bài đăng gắn cờ + kính lúp
  reports: () => (
    <>
      <rect x={86} y={44} width={96} height={84} rx={8} fill={K.paper} stroke={K.line} />
      <circle cx={100} cy={58} r={7} fill={K.sky} />
      <rect x={112} y={54} width={36} height={4} rx={2} fill={K.navy} />
      <rect x={112} y={61} width={22} height={3} rx={1.5} fill={K.line} />
      <rect x={94} y={72} width={80} height={36} rx={4} fill={K.paperShade} />
      <path d="M116 98 L128 84 L138 94 L146 88 L160 100 Z" fill="#C9D6EA" />
      <rect x={94} y={114} width={56} height={3.5} rx={1.75} fill={K.line} />
      <path d="M176 36 V70" stroke={K.navy} strokeWidth={3} strokeLinecap="round" />
      <path d="M177 37 H198 L192 46 L198 55 H177 Z" fill={K.red} />
      <circle cx={222} cy={96} r={22} fill="#EAF2FF" fillOpacity={0.75} stroke={K.navy} strokeWidth={6} />
      <path d="M238 112 L256 132" stroke={K.navy} strokeWidth={8} strokeLinecap="round" />
      <path d="M212 88 L222 98 M222 88 L212 98" stroke={K.red} strokeWidth={3.5} strokeLinecap="round" />
      <Sparkle x={262} y={60} c={K.orange} />
    </>
  ),
  // Gói dịch vụ: các hộp quà xếp chồng + thẻ giá
  packages: () => (
    <>
      <rect x={96} y={96} width={58} height={50} rx={5} fill={K.orange} />
      <rect x={121} y={96} width={8} height={50} fill={K.gold} />
      <rect x={92} y={88} width={66} height={12} rx={4} fill={K.orangeDeep} />
      <rect x={160} y={78} width={66} height={68} rx={5} fill={K.blue} />
      <rect x={189} y={78} width={8} height={68} fill={K.gold} />
      <rect x={156} y={70} width={74} height={12} rx={4} fill="#17558F" />
      <path d="M193 70 C 178 52, 170 64, 193 70 C 208 52, 216 64, 193 70" fill={K.gold} />
      <rect x={232} y={116} width={40} height={30} rx={5} fill={K.green} />
      <rect x={250} y={116} width={6} height={30} fill={K.gold} />
      <g transform="rotate(12 120 54)">
        <path d="M100 44 H134 L142 54 L134 64 H100 Z" fill={K.paper} stroke={K.line} />
        <circle cx={108} cy={54} r={2.5} fill={K.line} />
        <rect x={114} y={51} width={20} height={5} rx={2.5} fill={K.orange} />
      </g>
      <Sparkle x={250} y={64} />
    </>
  ),
  // Tranh chấp: cái cân hai bên
  disputes: () => (
    <>
      <path d="M170 140 V52" stroke={K.navy} strokeWidth={5} strokeLinecap="round" />
      <path d="M150 146 H190" stroke={K.navy} strokeWidth={6} strokeLinecap="round" />
      <circle cx={170} cy={50} r={6} fill={K.gold} />
      <path d="M118 64 L222 56" stroke={K.navy} strokeWidth={4} strokeLinecap="round" />
      <path d="M118 64 L104 96 M118 64 L132 96 M222 56 L208 88 M222 56 L236 88" stroke={K.line} strokeWidth={1.8} />
      <path d="M100 96 H136 Q118 112 100 96 Z" fill={K.orange} />
      <path d="M204 88 H240 Q222 104 204 88 Z" fill={K.blue} />
      <Person x={84} y={152} shirt={K.blue} bag />
      <Person x={262} y={152} shirt={K.navy} cap flip />
    </>
  ),
  // Sổ quỹ: sổ cái mở + chồng xu + khoá
  ledger: () => (
    <>
      <path d="M90 64 Q130 54 166 64 V132 Q130 122 90 132 Z" fill={K.paper} stroke={K.line} />
      <path d="M166 64 Q202 54 242 64 V132 Q202 122 166 132 Z" fill={K.paper} stroke={K.line} />
      <path d="M166 64 V132" stroke={K.line} strokeWidth={2} />
      {[78, 90, 102, 114].map((y) => (
        <g key={y}>
          <rect x={100} y={y} width={52} height={3.5} rx={1.75} fill={K.line} />
          <rect x={178} y={y - 2} width={34} height={3.5} rx={1.75} fill={K.line} />
          <rect x={218} y={y - 2} width={14} height={3.5} rx={1.75} fill={y === 114 ? K.green : K.navy} />
        </g>
      ))}
      <rect x={244} y={102} width={30} height={30} rx={6} fill={K.navy} />
      <path d="M251 102 V94 A8 8 0 0 1 267 94 V102" stroke={K.navy} strokeWidth={4} fill="none" />
      <circle cx={259} cy={115} r={3.5} fill={K.gold} />
      <Coin x={78} y={138} />
      <Coin x={78} y={128} />
      <Coin x={78} y={118} />
    </>
  ),
  // Doanh thu: bảng biểu đồ cột đi lên + xu
  revenue: () => (
    <>
      <rect x={92} y={40} width={128} height={90} rx={8} fill={K.paper} stroke={K.line} />
      <path d="M106 116 H206" stroke={K.line} strokeWidth={2} />
      <rect x={112} y={96} width={14} height={20} rx={3} fill="#FFD2B3" />
      <rect x={134} y={84} width={14} height={32} rx={3} fill="#FFB27F" />
      <rect x={156} y={72} width={14} height={44} rx={3} fill={K.orange} />
      <rect x={178} y={56} width={14} height={60} rx={3} fill={K.orangeDeep} />
      <path d="M112 88 L140 76 L162 64 L196 46" stroke={K.green} strokeWidth={3} fill="none" strokeLinecap="round" />
      <path d="M188 44 L198 45 L196 55" stroke={K.green} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M156 130 V146 M140 148 H172" stroke={K.navy} strokeWidth={4} strokeLinecap="round" />
      <Coin x={238} y={138} r={10} />
      <Coin x={238} y={126} r={10} />
      <Coin x={258} y={140} r={10} />
      <Sparkle x={240} y={60} />
    </>
  ),
  // Thông báo hệ thống: loa + sóng âm + máy bay giấy
  broadcast: () => (
    <>
      <path d="M104 86 L150 62 V128 L104 104 Z" fill={K.orange} />
      <rect x={90} y={84} width={18} height={22} rx={4} fill={K.orangeDeep} />
      <path d="M110 104 L118 128 H106 L100 106" fill={K.navy} />
      <ellipse cx={150} cy={95} rx={7} ry={33} fill={K.orangeDeep} />
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M${166 + i * 14} ${74 - i * 6} Q${180 + i * 16} 95 ${166 + i * 14} ${116 + i * 6}`} stroke={K.navy} strokeWidth={3.5} fill="none" strokeLinecap="round" opacity={1 - i * 0.25} />
      ))}
      <g transform="translate(232 48) rotate(-14)">
        <path d="M0 10 L34 0 L22 30 L16 18 Z" fill={K.paper} stroke={K.line} />
        <path d="M16 18 L34 0" stroke={K.line} />
      </g>
      <path d="M210 70 Q222 64 232 62" stroke={K.line} strokeWidth={2} strokeDasharray="3 4" fill="none" />
      <circle cx={262} cy={118} r={14} fill={K.gold} />
      <path d="M255 122 V116 A7 7 0 0 1 269 116 V122 Z" fill={K.paper} />
      <circle cx={262} cy={125} r={2} fill={K.paper} />
    </>
  ),
  // Xếp hạng: bục vinh danh + cúp
  ranking: () => (
    <>
      <rect x={142} y={86} width={44} height={60} rx={4} fill={K.orange} />
      <rect x={98} y={106} width={44} height={40} rx={4} fill={K.sky} />
      <rect x={186} y={118} width={44} height={28} rx={4} fill={K.green} />
      <text x={164} y={124} textAnchor="middle" fontSize={22} fontWeight={800} fill={K.paper} fontFamily="Sora, sans-serif">1</text>
      <text x={120} y={134} textAnchor="middle" fontSize={18} fontWeight={800} fill={K.paper} fontFamily="Sora, sans-serif">2</text>
      <text x={208} y={140} textAnchor="middle" fontSize={16} fontWeight={800} fill={K.paper} fontFamily="Sora, sans-serif">3</text>
      <path d="M150 44 H178 V56 Q178 72 164 74 Q150 72 150 56 Z" fill={K.gold} />
      <path d="M150 48 H142 Q142 62 152 64 M178 48 H186 Q186 62 176 64" stroke={K.gold} strokeWidth={3} fill="none" />
      <rect x={160} y={74} width={8} height={6} fill="#E09A1F" />
      <rect x={154} y={80} width={20} height={5} rx={2} fill={K.navy} />
      <Sparkle x={126} y={70} />
      <Sparkle x={206} y={84} c={K.orange} s={0.8} />
      <Sparkle x={246} y={58} s={1.2} />
    </>
  ),
  // Gửi yêu cầu: phong bì + máy bay giấy bay đi
  request: () => (
    <>
      <rect x={92} y={78} width={78} height={52} rx={6} fill={K.paper} stroke={K.line} />
      <path d="M92 80 L131 108 L170 80" stroke={K.line} strokeWidth={2} fill="none" />
      <circle cx={158} cy={120} r={8} fill={K.orange} />
      <path d="M180 92 Q206 74 222 62" stroke={K.orange} strokeWidth={2.5} strokeDasharray="4 5" fill="none" strokeLinecap="round" />
      <g transform="translate(222 36) rotate(-10)">
        <path d="M0 14 L44 0 L30 38 L22 22 Z" fill={K.blue} />
        <path d="M22 22 L44 0 L14 18" fill="#17558F" />
      </g>
      <Person x={262} y={152} shirt={K.blue} bag flip />
      <Sparkle x={200} y={50} />
    </>
  ),
  // Yêu cầu của tôi: chồng thẻ yêu cầu đã gửi kèm trạng thái + người cầm điện thoại
  sent: () => (
    <>
      {[
        { y: 46, rot: -4, pill: K.green },
        { y: 78, rot: 2, pill: K.gold },
        { y: 110, rot: -2, pill: K.sky },
      ].map((c, i) => (
        <g key={i} transform={`rotate(${c.rot} 150 ${c.y + 13})`}>
          <rect x={98} y={c.y} width={110} height={26} rx={6} fill={K.paper} stroke={K.line} />
          <circle cx={112} cy={c.y + 13} r={6} fill={i === 0 ? K.orange : i === 1 ? K.blue : K.purple} />
          <rect x={124} y={c.y + 8} width={42} height={4} rx={2} fill={K.navy} />
          <rect x={124} y={c.y + 15} width={30} height={3} rx={1.5} fill={K.line} />
          <rect x={174} y={c.y + 8} width={26} height={10} rx={5} fill={c.pill} />
        </g>
      ))}
      <Person x={250} y={152} s={1.08} shirt={K.orange} wave flip />
      <rect x={222} y={84} width={14} height={22} rx={3} fill={K.navy} transform="rotate(-12 229 95)" />
      <Sparkle x={236} y={60} />
    </>
  ),
  // Yêu cầu gửi đến: hòm thư có thư
  inbox: () => (
    <>
      <path d="M170 146 V104" stroke={K.woodDark} strokeWidth={7} strokeLinecap="round" />
      <path d="M126 76 Q126 52 150 52 H196 Q220 52 220 76 V104 H126 Z" fill={K.blue} />
      <path d="M126 76 Q126 52 150 52 Q174 52 174 76 V104 H126 Z" fill="#17558F" />
      <rect x={136} y={78} width={28} height={6} rx={3} fill={K.navy} />
      <path d="M220 70 V52" stroke={K.navy} strokeWidth={3} strokeLinecap="round" />
      <path d="M221 52 H238 V62 H221 Z" fill={K.red} />
      <g transform="rotate(-12 108 98)">
        <rect x={86} y={86} width={44} height={28} rx={4} fill={K.paper} stroke={K.line} />
        <path d="M86 88 L108 102 L130 88" stroke={K.line} fill="none" />
      </g>
      <g transform="rotate(10 246 120)">
        <rect x={226} y={108} width={40} height={26} rx={4} fill={K.paper} stroke={K.line} />
        <path d="M226 110 L246 123 L266 110" stroke={K.line} fill="none" />
      </g>
      <circle cx={214} cy={50} r={9} fill={K.orange} />
      <text x={214} y={54} textAnchor="middle" fontSize={11} fontWeight={800} fill={K.paper} fontFamily="Sora, sans-serif">1</text>
    </>
  ),
  // Công việc: bàn làm việc + laptop danh sách việc + bảng ghi
  tasks: () => (
    <>
      <rect x={84} y={118} width={176} height={8} rx={3} fill={K.wood} />
      <path d="M96 126 V148 M248 126 V148" stroke={K.woodDark} strokeWidth={5} strokeLinecap="round" />
      <rect x={118} y={62} width={84} height={54} rx={6} fill={K.navy} />
      <rect x={124} y={68} width={72} height={42} rx={3} fill={K.paper} />
      {[76, 88, 100].map((y, i) => (
        <g key={y}>
          <rect x={130} y={y - 4} width={8} height={8} rx={2} fill={i < 2 ? K.green : K.paper} stroke={i < 2 ? K.green : K.line} />
          {i < 2 && <path d={`M131.5 ${y} L133.5 ${y + 2} L136.5 ${y - 2}`} stroke={K.paper} strokeWidth={1.6} fill="none" />}
          <rect x={142} y={y - 2} width={i === 1 ? 34 : 46} height={4} rx={2} fill={K.line} />
        </g>
      ))}
      <path d="M108 118 H212 L204 112 H116 Z" fill="#2B3A5E" />
      <rect x={222} y={78} width={34} height={40} rx={4} fill={K.wood} />
      <rect x={226} y={84} width={26} height={30} rx={2} fill={K.paper} />
      <rect x={233} y={74} width={12} height={8} rx={2} fill={K.navy} />
      <rect x={230} y={92} width={18} height={3} rx={1.5} fill={K.line} />
      <rect x={230} y={100} width={14} height={3} rx={1.5} fill={K.line} />
      <rect x={92} y={98} width={16} height={20} rx={4} fill={K.orange} />
      <path d="M108 104 Q116 106 108 112" stroke={K.orange} strokeWidth={3} fill="none" />
      <Plant x={280} y={150} />
    </>
  ),
  // Thỏa thuận: hai người + bản hợp đồng có chữ ký
  deal: () => (
    <>
      <Person x={104} y={152} s={1.08} shirt={K.blue} bag />
      <Person x={250} y={152} s={1.08} shirt={K.navy} cap flip />
      <rect x={146} y={56} width={58} height={76} rx={5} fill={K.paper} stroke={K.line} />
      <rect x={154} y={64} width={30} height={5} rx={2.5} fill={K.orange} />
      {[76, 84, 92, 100].map((y) => (
        <rect key={y} x={154} y={y} width={y === 100 ? 26 : 42} height={3.5} rx={1.75} fill={K.line} />
      ))}
      <path d="M154 118 Q162 110 168 118 T182 116" stroke={K.navy} strokeWidth={2} fill="none" strokeLinecap="round" />
      <g transform="rotate(35 204 108)">
        <rect x={196} y={92} width={6} height={32} rx={2} fill={K.orange} />
        <path d="M196 124 L199 132 L202 124 Z" fill={K.navy} />
      </g>
      <circle cx={192} cy={124} r={7} fill={K.green} />
      <path d="M188.5 124 L191 126.5 L196 121" stroke={K.paper} strokeWidth={2} fill="none" />
    </>
  ),
  // Thu nhập: ví + xu rơi vào
  wallet: () => (
    <>
      <rect x={110} y={76} width={112} height={66} rx={12} fill={K.navy} />
      <rect x={110} y={76} width={112} height={18} rx={9} fill="#2B3A5E" />
      <rect x={186} y={98} width={44} height={26} rx={8} fill={K.orange} />
      <circle cx={202} cy={111} r={5} fill={K.paper} />
      <Coin x={150} y={58} r={11} />
      <Coin x={176} y={42} r={9} />
      <path d="M150 30 V20 M176 24 V14" stroke={K.line} strokeWidth={2} strokeDasharray="2 3" />
      <path d="M248 128 L262 104 L276 116" stroke={K.green} strokeWidth={3.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M266 102 L263 103 L264 106" stroke={K.green} strokeWidth={3.5} fill="none" strokeLinecap="round" />
      <Sparkle x={98} y={66} />
    </>
  ),
  // Hoàn tiền: xu có mũi tên vòng quay lại + tài khoản ngân hàng
  refund: () => (
    <>
      <path d="M94 104 L140 82 L186 104 Z" fill={K.navy} />
      <rect x={98} y={104} width={84} height={8} fill="#2B3A5E" />
      {[106, 126, 146, 166].map((x) => (
        <rect key={x} x={x - 4} y={112} width={8} height={26} fill={K.paperShade} stroke={K.line} />
      ))}
      <rect x={94} y={138} width={92} height={8} rx={2} fill={K.navy} />
      <Coin x={232} y={88} r={20} />
      <path d="M206 60 A36 36 0 0 1 266 66" stroke={K.green} strokeWidth={4} fill="none" strokeLinecap="round" />
      <path d="M262 56 L267 67 L256 70" stroke={K.green} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M258 116 A36 36 0 0 1 198 110" stroke={K.orange} strokeWidth={4} fill="none" strokeLinecap="round" />
      <path d="M202 120 L197 109 L208 106" stroke={K.orange} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  // Nhóm: bàn tròn nhiều người
  groups: () => (
    <>
      <Person x={130} y={118} s={0.95} shirt={K.blue} />
      <Person x={172} y={112} s={0.95} shirt={K.orange} cap />
      <Person x={214} y={118} s={0.95} shirt={K.green} />
      <ellipse cx={172} cy={124} rx={80} ry={16} fill={K.wood} />
      <ellipse cx={172} cy={121} rx={80} ry={16} fill="#E2A877" />
      <path d="M128 136 V150 M216 136 V150" stroke={K.woodDark} strokeWidth={5} strokeLinecap="round" />
      <Paper x={150} y={110} w={22} h={14} lines={1} />
      <rect x={180} y={112} width={16} height={10} rx={2} fill={K.navy} />
      <circle cx={256} cy={60} r={13} fill={K.paper} stroke={K.line} />
      <path d="M250 60 H262 M256 54 V66" stroke={K.orange} strokeWidth={3} strokeLinecap="round" />
      <Sparkle x={96} y={70} c={K.orange} />
    </>
  ),
  // Tin nhắn: hai người và bong bóng trò chuyện
  chat: () => (
    <>
      <Person x={104} y={152} s={1.05} shirt={K.blue} bag wave />
      <Person x={254} y={152} s={1.05} shirt={K.navy} cap flip />
      <path d="M128 40 H200 Q210 40 210 50 V70 Q210 80 200 80 H148 L136 92 L138 80 H128 Q118 80 118 70 V50 Q118 40 128 40 Z" fill={K.orange} />
      <rect x={130} y={52} width={56} height={4.5} rx={2.25} fill={K.paper} />
      <rect x={130} y={63} width={38} height={4.5} rx={2.25} fill={K.paper} fillOpacity={0.8} />
      <path d="M160 92 H226 Q236 92 236 102 V118 Q236 128 226 128 H218 L220 140 L206 128 H160 Q150 128 150 118 V102 Q150 92 160 92 Z" fill={K.paper} stroke={K.line} />
      <circle cx={176} cy={110} r={4} fill={K.navy} />
      <circle cx={193} cy={110} r={4} fill={K.navy} />
      <circle cx={210} cy={110} r={4} fill={K.navy} />
    </>
  ),
  // Hồ sơ Mentor: thẻ hồ sơ lớn + huy hiệu + bút
  profile: () => (
    <>
      <rect x={104} y={46} width={102} height={92} rx={10} fill={K.paper} stroke={K.line} />
      <rect x={104} y={46} width={102} height={26} rx={10} fill={K.orange} />
      <rect x={104} y={62} width={102} height={10} fill={K.orange} />
      <circle cx={155} cy={78} r={15} fill={K.sky} stroke={K.paper} strokeWidth={4} />
      <circle cx={155} cy={74} r={5} fill={K.paper} />
      <path d="M146 86 Q155 78 164 86" fill={K.paper} />
      <rect x={128} y={100} width={54} height={5} rx={2.5} fill={K.navy} />
      <rect x={136} y={110} width={38} height={3.5} rx={1.75} fill={K.line} />
      <rect x={120} y={120} width={22} height={9} rx={4.5} fill="#FFE9DC" />
      <rect x={146} y={120} width={22} height={9} rx={4.5} fill="#E6F0FB" />
      <rect x={172} y={120} width={22} height={9} rx={4.5} fill="#E3F4E7" />
      <circle cx={228} cy={64} r={16} fill={K.gold} />
      <path d="M228 54 L231 61 L238 61 L232.5 65.5 L234.5 72.5 L228 68 L221.5 72.5 L223.5 65.5 L218 61 L225 61 Z" fill={K.paper} />
      <path d="M220 78 L216 96 L228 90 L240 96 L236 78" fill={K.orange} />
      <g transform="rotate(40 238 124)">
        <rect x={232} y={104} width={9} height={40} rx={3} fill={K.navy} />
        <path d="M232 144 L236.5 154 L241 144 Z" fill={K.gold} />
      </g>
    </>
  ),
  // Trạng thái Mentor: bảng kiểm điều kiện + huy chương
  status: () => (
    <>
      <rect x={96} y={42} width={96} height={104} rx={8} fill={K.wood} />
      <rect x={102} y={50} width={84} height={90} rx={4} fill={K.paper} />
      <rect x={130} y={36} width={28} height={12} rx={4} fill={K.navy} />
      {[66, 84, 102, 120].map((y, i) => (
        <g key={y}>
          <circle cx={116} cy={y} r={6} fill={i < 3 ? K.green : K.paperShade} stroke={i < 3 ? K.green : K.line} />
          {i < 3 && <path d={`M113 ${y} L115.5 ${y + 2.5} L119.5 ${y - 2.5}`} stroke={K.paper} strokeWidth={1.8} fill="none" />}
          <rect x={128} y={y - 2} width={i === 3 ? 30 : 48} height={4} rx={2} fill={K.line} />
        </g>
      ))}
      <path d="M220 56 L232 92 M244 56 L232 92" stroke={K.blue} strokeWidth={7} strokeLinecap="round" />
      <circle cx={232} cy={104} r={20} fill={K.gold} />
      <circle cx={232} cy={104} r={13} fill="none" stroke="#E09A1F" strokeWidth={2} />
      <path d="M232 96 L234.5 101.5 L240 102 L236 106 L237 112 L232 109 L227 112 L228 106 L224 102 L229.5 101.5 Z" fill={K.paper} />
      <Sparkle x={262} y={70} />
    </>
  ),
}

export function BannerScene({ scene, className }: { scene: BannerSceneKey; className?: string }) {
  if (scene === 'campus') return <CampusIllustration tone="warm" className={className} />
  const draw = SCENES[scene]
  return (
    <svg viewBox="40 14 260 156" className={cn('block h-auto w-full', className)} aria-hidden focusable="false">
      <defs>
        <linearGradient id={`bs-hill-${scene}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#FFD9BF" stopOpacity="0" />
          <stop offset="0.3" stopColor="#FFD9BF" />
        </linearGradient>
      </defs>
      <circle cx={276} cy={36} r={14} fill={K.orange} />
      <g fill={K.paper}>
        <rect x={52} y={30} width={40} height={11} rx={5.5} />
        <circle cx={64} cy={30} r={7} />
        <circle cx={76} cy={27} r={8} />
      </g>
      <path d="M40 140 C 100 124, 170 132, 230 138 S 290 132, 300 128 L300 170 L40 170 Z" fill={`url(#bs-hill-${scene})`} />
      {draw()}
    </svg>
  )
}
