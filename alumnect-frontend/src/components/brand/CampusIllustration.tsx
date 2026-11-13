import { useId } from 'react'
import { cn } from '@/lib/utils'

/**
 * Minh hoạ nhận diện Alumnect: toà FPT University, cột biển chỉ đường (Cố vấn · Việc làm · Hỏi đáp · Sự kiện),
 * một sinh viên đeo ba lô và một cựu sinh viên đội mũ cử nhân. Chuyển từ AuthIllustration của app mobile.
 * `tone="warm"` dùng đồi cam nhạt (dải chào), `tone="cool"` dùng đồi xanh nhạt.
 */
const PALETTES = {
  warm: { hillBack: '#FFD9BF', hillFront: '#FFC7A1', slabShade: '#E8C9B5' },
  cool: { hillBack: '#C8DCF3', hillFront: '#B0CCEC', slabShade: '#C3D2E6' },
} as const

const C = {
  sun: '#F27024',
  cloud: '#FFFFFF',
  slab: '#FFFFFF',
  glass: '#5B7399',
  dot: '#9DB0CC',
  trunk: '#6B4E3A',
  leaf: '#3E9B4F',
  leafDark: '#2F7E3D',
  ink: '#1F2A44',
  skin: '#F2C7A5',
  blue: '#004F9E',
  shirt: '#1F6BB8',
  sky: '#5B8FD1',
  orange: '#F27024',
  green: '#3E9B4F',
  paper: '#F4F1E8',
}

const SIGNS = [
  { rotate: '-3 250 88', d: 'M250 78 H312 L324 88 L312 98 H250 Z', color: C.orange, x: 258, y: 92, label: 'Cố vấn' },
  { rotate: '2 250 114', d: 'M250 104 H188 L176 114 L188 124 H250 Z', color: C.blue, x: 192, y: 118, label: 'Việc làm' },
  { rotate: '-2 250 140', d: 'M250 130 H312 L324 140 L312 150 H250 Z', color: C.green, x: 258, y: 144, label: 'Hỏi đáp' },
  { rotate: '3 250 166', d: 'M250 156 H188 L176 166 L188 176 H250 Z', color: C.sky, x: 194, y: 170, label: 'Sự kiện' },
]

function Palm({ x, base, height, trunk, leaf }: { x: number; base: number; height: number; trunk: string; leaf: string }) {
  const top = base - height
  return (
    <g fill="none" strokeLinecap="round">
      <path d={`M${x} ${base} Q ${x + 2} ${base - height / 2} ${x - 1} ${top}`} stroke={trunk} strokeWidth={3} />
      {[[-14, -6], [14, -6], [-10, 6], [10, 6], [0, -12]].map(([dx, dy]) => (
        <path key={`${dx}${dy}`} d={`M${x - 1} ${top} q ${dx / 2} ${dy - 6} ${dx} ${dy}`} stroke={leaf} strokeWidth={3.2} />
      ))}
    </g>
  )
}

export function CampusIllustration({ tone = 'warm', className }: { tone?: keyof typeof PALETTES; className?: string }) {
  const p = PALETTES[tone]
  const uid = useId().replace(/:/g, '')
  const dots: Array<[number, number]> = []
  for (let r = 0; r < 3; r++) for (let q = 0; q < 6; q++) dots.push([100 + q * 4.2, 100 + r * 3.6])
  const glassRow = (y: number, h: number) =>
    [0, 1, 2, 3, 4, 5, 6, 7].map((i) => <rect key={`${y}-${i}`} x={15 + i * 6} y={y} width={2.2} height={h} />)

  return (
    <svg viewBox="0 20 390 206" className={cn('block h-auto w-full', className)} aria-hidden focusable="false">
      <circle cx={330} cy={64} r={22} fill={C.sun} />
      <g fill={C.cloud}>
        <rect x={168} y={46} width={64} height={18} rx={9} />
        <circle cx={190} cy={46} r={12} />
        <circle cx={210} cy={42} r={14} />
        <rect x={296} y={96} width={46} height={12} rx={6} />
        <circle cx={312} cy={95} r={9} />
      </g>
      {/* Đồi nhạt dần ở mép trái để hoà vào nền khi đặt trong dải chào */}
      <defs>
        {(['hillBack', 'hillFront'] as const).map((k) => (
          <linearGradient key={k} id={`${uid}-${k}`} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={90} y2={0}>
            <stop offset={0} stopColor={p[k]} stopOpacity={0} />
            <stop offset={1} stopColor={p[k]} />
          </linearGradient>
        ))}
      </defs>
      <path d="M0 172 C 80 142, 170 152, 250 170 S 360 162, 390 152 L390 240 L0 240 Z" fill={`url(#${uid}-hillBack)`} />
      <path d="M0 202 C 90 180, 200 192, 300 200 S 370 198, 390 192 L390 240 L0 240 Z" fill={`url(#${uid}-hillFront)`} />

      {/* Toà FPT University: các khối trắng xếp lệch, dải kính giữa các tầng */}
      <g transform="translate(-5 -26) scale(1.15)">
        <rect x={12} y={150} width={50} height={42} fill={C.slab} />
        <rect x={12} y={164} width={50} height={3} fill={p.slabShade} />
        <rect x={12} y={178} width={50} height={3} fill={p.slabShade} />
        <g fill={C.glass}>
          {glassRow(153, 10)}
          {glassRow(168, 9)}
          {glassRow(182, 9)}
        </g>
        <rect x={70} y={96} width={64} height={16} fill={C.slab} />
        <rect x={70} y={112} width={64} height={4} fill={p.slabShade} />
        <rect x={78} y={116} width={50} height={9} fill={C.glass} />
        <rect x={58} y={125} width={86} height={16} fill={C.slab} />
        <rect x={58} y={141} width={86} height={4} fill={p.slabShade} />
        <rect x={66} y={145} width={72} height={9} fill={C.glass} />
        <rect x={64} y={154} width={74} height={16} fill={C.slab} />
        <rect x={64} y={170} width={74} height={4} fill={p.slabShade} />
        <rect x={72} y={174} width={58} height={18} fill={C.glass} />
        <g fill={C.dot}>
          {dots.map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={1.1} />
          ))}
        </g>
        <rect x={8} y={178} width={146} height={14} rx={4} fill={C.leafDark} />
        <rect x={10} y={192} width={142} height={5} rx={1.5} fill={C.slab} />
        <text x={18} y={190} fontSize={11} fontWeight={900} fill={C.orange} fontFamily="Sora, sans-serif">
          FPT UNIVERSITY
        </text>
        <Palm x={154} base={194} height={40} trunk={C.trunk} leaf={C.leafDark} />
      </g>
      <Palm x={366} base={198} height={30} trunk={C.trunk} leaf={C.leaf} />

      {/* Cột biển chỉ đường bốn hướng */}
      <rect x={246} y={66} width={8} height={138} rx={3} fill={C.ink} />
      <path d="M250 42 L278 53 L250 64 L222 53 Z" fill={C.ink} />
      {SIGNS.map((s) => (
        <g key={s.label} transform={`rotate(${s.rotate})`}>
          <path d={s.d} fill={s.color} />
          <text x={s.x} y={s.y} fontSize={10.5} fontWeight={700} fill="#FFFFFF" fontFamily="Plus Jakarta Sans, sans-serif">
            {s.label}
          </text>
        </g>
      ))}

      {/* Sinh viên đeo ba lô */}
      <g>
        <rect x={278} y={190} width={5} height={12} rx={2} fill={C.ink} />
        <rect x={285} y={190} width={5} height={12} rx={2} fill={C.ink} />
        <rect x={291} y={177} width={8} height={14} rx={3} fill={C.orange} />
        <rect x={276} y={175} width={16} height={19} rx={5} fill={C.shirt} />
        <circle cx={284} cy={167} r={7} fill={C.skin} />
        <path d="M277 166 A7 7 0 0 1 291 166 Z" fill="#2B2B2B" />
      </g>
      {/* Cựu sinh viên đội mũ cử nhân, cầm bằng */}
      <g>
        <rect x={306} y={196} width={5} height={7} rx={2} fill={C.ink} />
        <rect x={314} y={196} width={5} height={7} rx={2} fill={C.ink} />
        <rect x={304} y={173} width={16} height={26} rx={5} fill={C.ink} />
        <circle cx={312} cy={165} r={7} fill={C.skin} />
        <path d="M302 159 L312 155 L322 159 L312 163 Z" fill={C.ink} />
        <path d="M321 159 L321 168" stroke={C.orange} strokeWidth={1.5} strokeLinecap="round" />
        <rect x={318} y={181} width={13} height={4} rx={2} fill={C.paper} />
      </g>
    </svg>
  )
}
