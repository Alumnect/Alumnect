import 'react-native-svg'

declare module 'react-native-svg' {
  interface SvgProps {
    /** Phosphor gắn `className` lên <Svg>; kiểu của react-native-svg chưa khai báo thuộc tính này. */
    className?: string
  }
}
