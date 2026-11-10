import React from 'react'
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg'
import { useTheme } from '@/theme'

/** Cọ dừa: thân cong nhẹ và năm tàu lá, vẽ bằng nét tròn đầu. */
function Palm({ x, base, height, trunk, leaf }: { x: number; base: number; height: number; trunk: string; leaf: string }) {
  const top = base - height
  return (
    <G>
      <Path d={`M ${x} ${base} Q ${x + 3} ${base - height / 2} ${x + 1} ${top}`} stroke={trunk} strokeWidth={3} strokeLinecap="round" fill="none" />
      <G stroke={leaf} strokeWidth={3.4} strokeLinecap="round" fill="none">
        <Path d={`M ${x + 1} ${top} Q ${x - 10} ${top - 9} ${x - 17} ${top + 3}`} />
        <Path d={`M ${x + 1} ${top} Q ${x - 6} ${top - 14} ${x - 12} ${top - 10}`} />
        <Path d={`M ${x + 1} ${top} Q ${x + 1} ${top - 15} ${x + 4} ${top - 17}`} />
        <Path d={`M ${x + 1} ${top} Q ${x + 8} ${top - 14} ${x + 14} ${top - 10}`} />
        <Path d={`M ${x + 1} ${top} Q ${x + 12} ${top - 9} ${x + 19} ${top + 3}`} />
      </G>
    </G>
  )
}

/**
 * Minh hoạ phẳng cho các màn auth, vẽ bằng code từ ý của khẩu hiệu "Cùng một khởi đầu. Mở nhiều hướng đi.":
 * toà FPT University Đà Nẵng (các tầng trắng xếp lệch nhau, vách đục lỗ, hàng dừa, chữ cam FPT UNIVERSITY),
 * một cột biển chỉ bốn hướng (đúng bốn mục của Alumnect), sinh viên và cựu sinh viên đứng bên dưới.
 * Một ngôn ngữ đồ hoạ duy nhất: hình khối phẳng, không viền, không gradient, màu lấy từ nhận diện FPT.
 * \`strip\` chỉ lấy dải thấp của tranh (đủ toà nhà, cột biển và nhân vật) cho màn đăng ký.
 */
export function AuthIllustration({ width, strip = false }: { width: number; strip?: boolean }) {
  const t = useTheme()
  const d = t.isDark
  const c = {
    sun: '#F27024',
    cloud: d ? '#22304A' : '#FFFFFF',
    hillBack: d ? '#1F2C42' : '#D3E2F5',
    hillFront: d ? '#2A3B58' : '#B9D0EE',
    slab: d ? '#E3EAF5' : '#FFFFFF',
    slabShade: d ? '#8FA3C4' : '#AFC0D8',
    glass: d ? '#0F1826' : '#5B7399',
    dot: d ? '#9DB0CC' : '#9DB0CC',
    trunk: '#6B4E3A',
    leaf: '#3E9B4F',
    leafDark: '#2F7E3D',
    ink: d ? '#5C7399' : '#1F2A44',
    inkSoft: d ? '#6F86AD' : '#2E3C5E',
    skin: '#F2C7A5',
    blue: '#004F9E',
    shirt: '#1F6BB8',
    sky: '#5B8FD1',
    orange: '#F27024',
    green: '#3E9B4F',
    paper: '#F4F1E8',
  }
  const view = strip ? { x: 0, y: 36, w: 390, h: 178 } : { x: 0, y: 20, w: 390, h: 206 }
  const height = (width * view.h) / view.w
  const dots: [number, number][] = []
  for (let r = 0; r < 3; r++) for (let q = 0; q < 6; q++) dots.push([100 + q * 4.2, 100 + r * 3.6])
  return (
    <Svg width={width} height={height} viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {/* Trời */}
      <Circle cx={330} cy={64} r={22} fill={c.sun} />
      <G fill={c.cloud}>
        <Rect x={168} y={46} width={64} height={18} rx={9} />
        <Circle cx={190} cy={46} r={12} />
        <Circle cx={210} cy={42} r={14} />
        <Rect x={296} y={96} width={46} height={12} rx={6} />
        <Circle cx={312} cy={95} r={9} />
      </G>

      {/* Đồi */}
      <Path d="M0 172 C 80 142, 170 152, 250 170 S 360 162, 390 152 L390 240 L0 240 Z" fill={c.hillBack} />

      {/* Đồi phía trước */}
      <Path d="M0 202 C 90 180, 200 192, 300 200 S 370 198, 390 192 L390 240 L0 240 Z" fill={c.hillFront} />

      {/* Toà FPT University Đà Nẵng (phóng to 1.15 lần): các khối trắng xếp lệch, dải kính tối giữa các tầng */}
      <G transform="translate(-5 -26) scale(1.15)">
      <Rect x={12} y={150} width={50} height={42} fill={c.slab} />
      <Rect x={12} y={164} width={50} height={3} fill={c.slabShade} />
      <Rect x={12} y={178} width={50} height={3} fill={c.slabShade} />
      <G fill={c.glass}>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <Rect key={`l${i}`} x={15 + i * 6} y={153} width={2.2} height={10} />)}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <Rect key={`m${i}`} x={15 + i * 6} y={168} width={2.2} height={9} />)}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <Rect key={`n${i}`} x={15 + i * 6} y={182} width={2.2} height={9} />)}
      </G>

      <Rect x={70} y={96} width={64} height={16} fill={c.slab} />
      <Rect x={70} y={112} width={64} height={4} fill={c.slabShade} />
      <Rect x={78} y={116} width={50} height={9} fill={c.glass} />
      <Rect x={58} y={125} width={86} height={16} fill={c.slab} />
      <Rect x={58} y={141} width={86} height={4} fill={c.slabShade} />
      <Rect x={66} y={145} width={72} height={9} fill={c.glass} />
      <Rect x={64} y={154} width={74} height={16} fill={c.slab} />
      <Rect x={64} y={170} width={74} height={4} fill={c.slabShade} />
      <Rect x={72} y={174} width={58} height={18} fill={c.glass} />
      <G fill={c.dot}>
        {dots.map(([x, y], i) => <Circle key={`d${i}`} cx={x} cy={y} r={1.1} />)}
      </G>
      <G fill={c.dot}>
        {[0, 1, 2, 3, 4, 5].map((i) => <Rect key={`v${i}`} x={64 + i * 4} y={130} width={1.6} height={8} />)}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => <Rect key={`w${i}`} x={72 + i * 6} y={158} width={1.6} height={8} />)}
      </G>

      {/* Biển chữ cam FPT UNIVERSITY trên bờ tường trắng */}
      <Rect x={8} y={178} width={146} height={14} rx={4} fill={c.leafDark} />
      <Rect x={10} y={192} width={142} height={5} rx={1.5} fill={c.slab} />
      <SvgText x={18} y={190} fontSize={11} fontWeight="900" fill={c.orange}>FPT UNIVERSITY</SvgText>

      {/* Cọ dừa bên phải toà nhà */}
      <Palm x={154} base={194} height={40} trunk={c.trunk} leaf={c.leafDark} />
      </G>
      <Palm x={366} base={198} height={30} trunk={c.trunk} leaf={c.leaf} />

      {/* Cột biển bốn hướng */}
      <Rect x={246} y={66} width={8} height={138} rx={3} fill={c.ink} />
      <Path d="M250 42 L278 53 L250 64 L222 53 Z" fill={c.ink} />
      <Path d="M236 58 L236 67 Q250 74 264 67 L264 58 L250 64 Z" fill={c.inkSoft} />
      <Path d="M276 54 L276 70" stroke={c.orange} strokeWidth={2} strokeLinecap="round" />
      <Circle cx={276} cy={72} r={2.5} fill={c.orange} />

      <G transform="rotate(-3 250 88)">
        <Path d="M250 78 H312 L324 88 L312 98 H250 Z" fill={c.orange} />
        <SvgText x={258} y={92} fontSize={11} fontWeight="700" fill="#FFFFFF">Cố vấn</SvgText>
      </G>
      <G transform="rotate(2 250 114)">
        <Path d="M250 104 H188 L176 114 L188 124 H250 Z" fill={c.blue} />
        <SvgText x={194} y={118} fontSize={11} fontWeight="700" fill="#FFFFFF">Việc làm</SvgText>
      </G>
      <G transform="rotate(-2 250 140)">
        <Path d="M250 130 H312 L324 140 L312 150 H250 Z" fill={c.green} />
        <SvgText x={258} y={144} fontSize={11} fontWeight="700" fill="#FFFFFF">Hỏi đáp</SvgText>
      </G>
      <G transform="rotate(3 250 166)">
        <Path d="M250 156 H188 L176 166 L188 176 H250 Z" fill={c.sky} />
        <SvgText x={196} y={170} fontSize={11} fontWeight="700" fill="#FFFFFF">Sự kiện</SvgText>
      </G>

      {/* Sinh viên (đeo ba lô) */}
      <G>
        <Rect x={278} y={190} width={5} height={12} rx={2} fill={c.ink} />
        <Rect x={285} y={190} width={5} height={12} rx={2} fill={c.ink} />
        <Rect x={291} y={177} width={8} height={14} rx={3} fill={c.orange} />
        <Rect x={276} y={175} width={16} height={19} rx={5} fill={c.shirt} />
        <Circle cx={284} cy={167} r={7} fill={c.skin} />
        <Path d="M277 166 A7 7 0 0 1 291 166 Z" fill="#2B2B2B" />
      </G>

      {/* Cựu sinh viên (mũ cử nhân, cuộn bằng) */}
      <G>
        <Rect x={306} y={196} width={5} height={7} rx={2} fill={c.ink} />
        <Rect x={314} y={196} width={5} height={7} rx={2} fill={c.ink} />
        <Rect x={304} y={173} width={16} height={26} rx={5} fill={c.ink} />
        <Circle cx={312} cy={165} r={7} fill={c.skin} />
        <Path d="M302 159 L312 155 L322 159 L312 163 Z" fill={c.ink} />
        <Path d="M321 159 L321 168" stroke={c.orange} strokeWidth={1.5} strokeLinecap="round" />
        <Rect x={318} y={181} width={13} height={4} rx={2} fill={c.paper} />
      </G>
    </Svg>
  )
}
