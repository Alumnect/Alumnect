/**
 * Bộ icon cho các chủ đề diễn đàn — dùng chung cho bộ lọc (ForumPage) và
 * picker chọn chủ đề khi đặt câu hỏi (AskQuestionModal) để giao diện nhất quán.
 */
import {
  Hash,
  Briefcase,
  Users,
  Code2,
  GraduationCap,
  LineChart,
  BrainCircuit,
  Database,
  ShieldCheck,
  Cloud,
  Palette,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/** Ánh xạ tên ngành lớn → icon. Chủ đề con không cần icon riêng. */
export const TOPIC_ICONS: Record<string, LucideIcon> = {
  Career: Briefcase,
  Interview: Users,
  'Software Engineering': Code2,
  Education: GraduationCap,
  Salary: LineChart,
  General: Hash,
  'Artificial Intelligence': BrainCircuit,
  'Data Science': Database,
  Cybersecurity: ShieldCheck,
  'Cloud & DevOps': Cloud,
  'UI/UX Design': Palette,
}

/** Icon của một chủ đề (mặc định Hash nếu chưa có trong bảng ánh xạ). */
export function TopicIcon({ name, size = 16, className }: { name: string; size?: number; className?: string }) {
  const Icon = TOPIC_ICONS[name] ?? Hash
  return <Icon size={size} className={className} />
}
