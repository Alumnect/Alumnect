/** Dữ liệu mặc định cho bộ lọc, đồng bộ với Web (UserSearchFilterBar, JobsPage, SalaryPage). */

/** Khóa FPTU từ K21 về K1. */
export const DEFAULT_COHORTS = Array.from({ length: 21 }, (_, i) => 21 - i)

/** 63 tỉnh/thành Việt Nam (A-Z). */
export const VN_CITIES = [
  'An Giang', 'Bà Rịa - Vũng Tàu', 'Bắc Giang', 'Bắc Kạn', 'Bạc Liêu', 'Bắc Ninh', 'Bến Tre',
  'Bình Định', 'Bình Dương', 'Bình Phước', 'Bình Thuận', 'Cà Mau', 'Cần Thơ', 'Cao Bằng',
  'Đà Nẵng', 'Đắk Lắk', 'Đắk Nông', 'Điện Biên', 'Đồng Nai', 'Đồng Tháp', 'Gia Lai',
  'Hà Giang', 'Hà Nam', 'Hà Nội', 'Hà Tĩnh', 'Hải Dương', 'Hải Phòng', 'Hậu Giang',
  'Hòa Bình', 'Hưng Yên', 'Khánh Hòa', 'Kiên Giang', 'Kon Tum', 'Lai Châu', 'Lâm Đồng',
  'Lạng Sơn', 'Lào Cai', 'Long An', 'Nam Định', 'Nghệ An', 'Ninh Bình', 'Ninh Thuận',
  'Phú Thọ', 'Phú Yên', 'Quảng Bình', 'Quảng Nam', 'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị',
  'Sóc Trăng', 'Sơn La', 'Tây Ninh', 'Thái Bình', 'Thái Nguyên', 'Thanh Hóa', 'Thừa Thiên Huế',
  'Tiền Giang', 'TP. Hồ Chí Minh', 'Trà Vinh', 'Tuyên Quang', 'Vĩnh Long', 'Vĩnh Phúc', 'Yên Bái',
]

/** Thành phố lớn hiển thị làm chip nhanh. */
export const MAJOR_CITIES = ['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng', 'Bình Dương']

/** Bỏ dấu và viết thường để so khớp địa điểm, từ khoá. */
export const normalize = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim()

/** Địa điểm có thuộc thành phố này không (chấp nhận "HCM", "Sài Gòn"...). */
export function matchCity(location: string | null | undefined, city: string) {
  const loc = normalize(location ?? '')
  const c = normalize(city)
  const aliases: Record<string, string[]> = {
    'tp. ho chi minh': ['ho chi minh', 'hcm', 'sai gon', 'saigon'],
    'ha noi': ['ha noi', 'hanoi'],
    'da nang': ['da nang', 'danang'],
  }
  return (aliases[c] ?? [c]).some((a) => loc.includes(a))
}

/** Các cơ sở đào tạo FPT University (đồng bộ FPT_CAMPUSES trên Web). */
export const FPT_CAMPUSES = [
  'FPT University Đà Nẵng',
  'FPT University Hà Nội',
  'FPT University TP. Hồ Chí Minh',
  'FPT University Cần Thơ',
  'FPT University Quy Nhơn',
]
