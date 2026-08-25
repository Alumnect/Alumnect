/**
 * Bộ icon cho các THỂ LOẠI thảo luận — dùng chung cho bộ lọc (ForumPage) và
 * picker chọn thể loại khi đặt câu hỏi (AskQuestionModal) để giao diện nhất quán.
 */
import { Hash, Briefcase, Users, GraduationCap, LineChart } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/** Ánh xạ tên thể loại → icon (danh sách phẳng 5 thể loại sau khi dọn phân cấp ở V19). */
export const TOPIC_ICONS: Record<string, LucideIcon> = {
  Career: Briefcase,
  Interview: Users,
  Education: GraduationCap,
  Salary: LineChart,
  General: Hash,
}

/** Icon của một thể loại (mặc định Hash nếu chưa có trong bảng ánh xạ). */
export function TopicIcon({ name, size = 16, className }: { name: string; size?: number; className?: string }) {
  const Icon = TOPIC_ICONS[name] ?? Hash
  return <Icon size={size} className={className} />
}
