/**
 * Định nghĩa các kiểu dữ liệu cốt lõi cho tính năng Alumni Map.
 * Tách biệt model khỏi implementation để dễ maintain và test.
 */

// ---------------------------------------------------------------------------
// Provider & Theme
// ---------------------------------------------------------------------------

/**
 * Nhà cung cấp bản đồ nền.
 * - AUTO: Tự động chọn dựa trên tọa độ alumni được chọn
 * - VIETMAP: Bản đồ VietMap – chi tiết khu vực Việt Nam
 * - MAPTILER: Bản đồ MapTiler – phủ sóng toàn cầu
 */
export type MapProvider = 'AUTO' | 'VIETMAP' | 'MAPTILER'

/**
 * Chủ đề hiển thị bản đồ.
 * - DEFAULT: Bản đồ đường phố mặc định
 * - MINIMAL: Bản đồ tối giản
 * - DARK: Bản đồ đêm tối
 * - LIBERTY: Bản đồ hiện đại
 * - PASTEL: Bản đồ Pastel dịu nhẹ (Premium Pastel Design)
 * - SATELLITE: Bản đồ vệ tinh địa hình (Hybrid)
 */
export type MapTheme = 'DEFAULT' | 'MINIMAL' | 'DARK' | 'LIBERTY' | 'PASTEL' | 'SATELLITE'

// ---------------------------------------------------------------------------
// Alumni Map Item
// ---------------------------------------------------------------------------

/**
 * Thông tin cựu sinh viên được hiển thị trên bản đồ.
 * Dữ liệu tối giản để không tải toàn bộ hồ sơ ngay khi mở map.
 */
export interface AlumniMapItem {
  /** ID duy nhất của cựu sinh viên (ánh xạ từ userId) */
  alumniId: string
  /** Họ và tên hiển thị (ánh xạ từ fullName) */
  displayName: string
  /** URL ảnh đại diện */
  avatarUrl?: string
  /** Chức danh công việc hiện tại */
  currentTitle?: string
  /** Tên công ty/tổ chức */
  companyName?: string
  /** Niên khóa học (ví dụ: 12, 15) */
  cohort?: number
  /** Thành phố hiện tại */
  city?: string
  /**
   * Mã quốc gia ISO alpha-2 (ví dụ: 'VN', 'JP', 'US').
   * Suy diễn từ tọa độ nếu backend chưa cung cấp.
   */
  countryCode?: string
  /**
   * Vĩ độ địa lý.
   * @example 16.0544
   */
  latitude: number
  /**
   * Kinh độ địa lý.
   * @example 108.2022
   */
  longitude: number
}

// ---------------------------------------------------------------------------
// Map State
// ---------------------------------------------------------------------------

/**
 * Trạng thái nội bộ của bản đồ trong quá trình chuyển style.
 */
export type MapSwitchingState = 'idle' | 'switching' | 'error'
