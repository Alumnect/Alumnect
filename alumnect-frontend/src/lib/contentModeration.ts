/**
 * Bộ kiểm duyệt nội dung phía Client (UC123 - Automated Content Moderation Guard)
 * Đồng bộ logic và thang điểm với ContentModerationServiceImpl ở Backend:
 * - Điểm < 20%: Hợp lệ (LOW) - Cho phép đăng bài.
 * - Điểm 20% - 84%: Nghi vấn (MEDIUM) - Chặn đăng, yêu cầu sửa các từ nhạy cảm / gây hiểu lầm.
 * - Điểm >= 85%: Vi phạm nghiêm trọng (HIGH) - Chặn đăng, cảnh báo ngôn từ độc hại.
 */

export interface ModerationResult {
  allowed: boolean
  score: number // ví dụ: 0.25, 0.30, 0.65
  scorePercent: number // ví dụ: 25, 30, 65
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  flaggedWords: string[]
  reason: string
}

// 1. Nhóm từ tục tĩu nặng / đe dọa (SEVERE - Khởi điểm 65%)
const SEVERE_TERMS: string[] = [
  'lồn', 'lìn', 'cặc', 'cặk', 'kặc', 'buồi', 'địt', 'đụ', 'đĩ', 'chịch', 'đm', 'đéo',
  'đcm', 'dcm', 'đcmm', 'dcmm', 'đkm', 'dkm', 'đkmm', 'dkmm', 'đmm', 'dmm', 'đmcs', 'dmcs',
  'cmm', 'clm', 'clmm', 'tml', 'thml', 'loz', 'lozz', 'djt', 'đjt', 'đyt', 'dyt',
  'cái lồn', 'mặt lồn', 'thằng mặt lồn', 'con mặt lồn', 'đụ má', 'đụ mẹ', 'đụ mịa', 'đụ mé',
  'đù má', 'đù mẹ', 'địt mẹ', 'địt má', 'địt mịa', 'địt mé', 'địt cụ', 'địt bố', 'đéo mẹ', 'đéo má',
  'đm mày', 'đm nó', 'đcm mày', 'mẹ cha mày', 'mẹ tổ mày', 'giết mày', 'chém chết', 'đâm chết',
  'bắn chết', 'đập chết', 'tự tử đi', 'tự sát đi', 'cút mẹ mày đi', 'biến mẹ mày đi',
  'bắc kỳ chó', 'nam kỳ chó', 'trung kỳ chó', 'fuck', 'motherfucker', 'cunt', 'ditme', 'ditconme',
  'daubuoi', 'buoi', 'cailon', 'anlon', 'mutcac', 'bucac'
]

// 2. Nhóm xúc phạm / thô tục vừa (OFFENSIVE - Khởi điểm 50%)
const OFFENSIVE_TERMS: string[] = [
  'óc chó', 'súc vật', 'súc sinh', 'cầm thú', 'khốn nạn', 'khốn kiếp', 'vô học', 'vô giáo dục',
  'vô văn hóa', 'vô liêm sỉ', 'láo toét', 'láo lếu', 'cặn bã', 'rác rưởi', 'thứ rác rưởi', 'mất dạy',
  'bố láo', 'bố đời', 'bỉ ổi', 'đê tiện', 'đê hèn', 'câm mồm', 'câm mõm', 'im mồm', 'im mõm',
  'ngậm mồm', 'ngậm mõm', 'chết tiệt', 'mẹ kiếp', 'chó chết', 'chó đẻ', 'chó má', 'mặt chó',
  'quần què', 'vcl', 'vkl', 'vcc', 'vlol', 'vloz', 'vlon', 'vãi lol', 'vãi loz', 'cmn', 'cmnr',
  'clg', 'clgt', 'cc', 'cl', 'dm', 'ml', 'bitch', 'asshole', 'bastard', 'idiot', 'dickhead'
]

// 3. Nhóm từ lóng nhẹ / nhạy cảm dễ gây hiểu lầm (WEAK - Khởi điểm 20%, +5% mỗi từ thêm)
const WEAK_TERMS: string[] = [
  'xàm', 'xạo', 'trẻ trâu', 'trẩu', 'hãm', 'khùng', 'nhục', 'láo', 'ỉa', 'đái', 'đít',
  'dell', 'đel', 'đell', 'dek', 'đếk', 'mẹ nó', 'má nó', 'bố m', 'bê đê', 'bede',
  'bắc kỳ', 'bắc kì', 'nam kỳ', 'nam kì', 'vl', 'vc', 'sml', 'xl', 'qq', 'đb', 'wtf', 'damn'
]

/** Khử dấu tiếng Việt để kiểm tra đồng dạng. */
export function removeAccents(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
}

/**
 * Đánh giá và chấm điểm nội dung kiểm duyệt.
 *
 * @param content Nội dung bài viết cần kiểm tra
 * @returns Kết quả kiểm duyệt (allowed, score, riskLevel, flaggedWords, reason)
 */
export function evaluateContentModeration(content: string): ModerationResult {
  if (!content || !content.trim()) {
    return {
      allowed: true,
      score: 0.0,
      scorePercent: 0,
      riskLevel: 'LOW',
      flaggedWords: [],
      reason: 'EMPTY_CONTENT',
    }
  }

  const rawLower = content.toLowerCase()
  // Loại bỏ các ký tự dấu chấm/gạch nối viết lách (vd: "c.ặ.c" -> "cặc", "đ-m" -> "đm")
  const deobfuscated = rawLower.replace(/([a-zà-ỹ0-9])[.\-_*+~^/\\|\s]+(?=[a-zà-ỹ0-9])/gi, '$1')

  const matchedSevere = new Set<string>()
  const matchedOffensive = new Set<string>()
  const matchedWeak = new Set<string>()

  const checkTerm = (term: string, category: 'severe' | 'offensive' | 'weak') => {
    // Tìm cụm từ hoặc từ nguyên vẹn với word boundary hoặc khoảng trắng
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`(^|[^a-zà-ỹ0-9])${escaped}(?=[^a-zà-ỹ0-9]|$)`, 'i')

    if (regex.test(rawLower) || regex.test(deobfuscated)) {
      if (category === 'severe') matchedSevere.add(term)
      else if (category === 'offensive') matchedOffensive.add(term)
      else matchedWeak.add(term)
    }
  }

  // Quét theo thứ tự từ dài đến ngắn
  const sortLongest = (arr: string[]) => [...arr].sort((a, b) => b.length - a.length)

  sortLongest(SEVERE_TERMS).forEach((term) => checkTerm(term, 'severe'))
  sortLongest(OFFENSIVE_TERMS).forEach((term) => checkTerm(term, 'offensive'))
  sortLongest(WEAK_TERMS).forEach((term) => checkTerm(term, 'weak'))

  // Kiểm tra đặc thù từ "ngu" có dấu (ngữ cảnh xúc phạm)
  if (/(^|[^a-zà-ỹ0-9])ngu(?=[^a-zà-ỹ0-9]|$)/i.test(rawLower)) {
    matchedOffensive.add('ngu')
  }

  const allFlagged = [
    ...Array.from(matchedSevere),
    ...Array.from(matchedOffensive),
    ...Array.from(matchedWeak),
  ]

  // Nếu không có bất kỳ từ vi phạm nào -> An toàn (5%)
  if (allFlagged.length === 0) {
    return {
      allowed: true,
      score: 0.05,
      scorePercent: 5,
      riskLevel: 'LOW',
      flaggedWords: [],
      reason: 'NO_PROFANITY_DETECTED',
    }
  }

  const distinctHigh = matchedSevere.size + matchedOffensive.size

  let score = 0.0
  let reason = 'WEAK_SIGNAL_ONLY'

  if (distinctHigh === 0) {
    // Chỉ có các từ lóng nhẹ (WEAK): Khởi điểm 20%, mỗi từ tiếp theo +5%, tối đa 35%
    score = Math.min(0.35, 0.20 + (matchedWeak.size - 1) * 0.05)
    reason = 'WEAK_SIGNAL_ONLY'
  } else {
    // Có từ SEVERE (65%) hoặc OFFENSIVE (50%)
    const base = matchedSevere.size > 0 ? 0.65 : 0.50
    score = base + (distinctHigh - 1) * 0.20
    if (deobfuscated !== rawLower) {
      score += 0.10 // Thưởng phạt cố tình lách luật
    }
    score = Math.min(0.99, score)
    reason = matchedSevere.size > 0 ? 'SEVERE_PROFANITY' : 'OFFENSIVE_LANGUAGE'
  }

  const scorePercent = Math.round(score * 100)
  // Ngưỡng LOW: < 20% (chỉ khi hoàn toàn không có từ cấm, score = 5%)
  // Từ 20% trở lên là MEDIUM và HIGH -> Chặn đăng bài!
  const allowed = score < 0.20
  const riskLevel = score >= 0.85 ? 'HIGH' : score >= 0.20 ? 'MEDIUM' : 'LOW'

  return {
    allowed,
    score,
    scorePercent,
    riskLevel,
    flaggedWords: allFlagged,
    reason,
  }
}

