import { Mail, GraduationCap, Award } from 'lucide-react'
import { Avatar } from '@/components/ui/primitives'
import type { MentoringParticipant } from '../model/mentoringTaskTypes'

interface MentoringTaskParticipantsCardProps {
  student?: MentoringParticipant | null
  mentor?: MentoringParticipant | null
}

export function MentoringTaskParticipantsCard({
  student,
  mentor,
}: MentoringTaskParticipantsCardProps) {
  return (
    <div className="rounded-3xl border border-plum-900/[0.08] bg-white p-6 shadow-xs dark:border-[#393a3b] dark:bg-[#242526]">
      <h4 className="text-base font-bold text-plum-900 dark:text-white mb-4">
        Thành viên tham gia nhiệm vụ
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Student Box */}
        <div className="flex items-start gap-3.5 rounded-2xl border border-plum-900/[0.06] bg-plum-900/[0.02] p-4 dark:border-white/5 dark:bg-white/[0.02]">
          <Avatar
            src={student?.avatarUrl || undefined}
            name={student?.fullName || 'Học viên'}
            className="h-12 w-12 shrink-0 rounded-2xl ring-2 ring-brand-500/20"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-brand-100 px-2 py-0.5 text-[11px] font-bold uppercase text-brand-700 dark:bg-brand-700/40 dark:text-brand-300">
                Học viên (Student)
              </span>
            </div>
            <p className="mt-1 truncate text-sm font-bold text-plum-900 dark:text-white">
              {student?.fullName || 'Học viên'}
            </p>
            {student?.headline && (
              <p className="flex items-center gap-1 text-xs text-plum-500 dark:text-[#b0b3b8] mt-0.5">
                <GraduationCap className="h-3 w-3 shrink-0 text-brand-500" />
                <span className="truncate">{student.headline}</span>
              </p>
            )}
            {student?.email && (
              <p className="flex items-center gap-1 text-xs text-plum-400 dark:text-[#8f9399] mt-1">
                <Mail className="h-3 w-3 shrink-0" />
                <span className="truncate">{student.email}</span>
              </p>
            )}
          </div>
        </div>

        {/* Mentor Box */}
        <div className="flex items-start gap-3.5 rounded-2xl border border-plum-900/[0.06] bg-plum-900/[0.02] p-4 dark:border-white/5 dark:bg-white/[0.02]">
          <Avatar
            src={mentor?.avatarUrl || undefined}
            name={mentor?.fullName || 'Mentor'}
            className="h-12 w-12 shrink-0 rounded-2xl ring-2 ring-mint-500/20"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-mint-100 px-2 py-0.5 text-[11px] font-bold uppercase text-mint-700 dark:bg-mint-950/40 dark:text-mint-300">
                Cố vấn (Mentor)
              </span>
            </div>
            <p className="mt-1 truncate text-sm font-bold text-plum-900 dark:text-white">
              {mentor?.fullName || 'Mentor'}
            </p>
            {mentor?.headline && (
              <p className="flex items-center gap-1 text-xs text-plum-500 dark:text-[#b0b3b8] mt-0.5">
                <Award className="h-3 w-3 shrink-0 text-mint-500" />
                <span className="truncate">{mentor.headline}</span>
              </p>
            )}
            {mentor?.email && (
              <p className="flex items-center gap-1 text-xs text-plum-400 dark:text-[#8f9399] mt-1">
                <Mail className="h-3 w-3 shrink-0" />
                <span className="truncate">{mentor.email}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
