import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()

  return (
    <div className="rounded-3xl border border-border bg-surface p-6 shadow-xs">
      <h4 className="text-base font-bold text-text mb-4">
        {t('mentoring.taskParticipantsTitle', 'Thành viên tham gia nhiệm vụ')}
      </h4>

      <div className="grid grid-cols-1 gap-3">
        {/* Student Box */}
        <div className="flex items-start gap-3.5 rounded-2xl border border-border bg-surface-2 p-4">
          <Avatar
            src={student?.avatarUrl || undefined}
            name={student?.fullName || t('mentoring.student', 'Học viên')}
            className="h-12 w-12 shrink-0 rounded-2xl ring-2 ring-primary/20"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="whitespace-nowrap rounded-md bg-primary-soft px-2 py-0.5 text-xs font-bold uppercase text-primary-solid">
                {t('mentoring.studentRoleTag', 'Học viên (Student)')}
              </span>
            </div>
            <p className="mt-1 truncate text-sm font-bold text-text">
              {student?.fullName || t('mentoring.student', 'Học viên')}
            </p>
            {student?.headline && (
              <p className="flex items-center gap-1 text-xs text-text-subtle mt-0.5">
                <GraduationCap className="h-3 w-3 shrink-0 text-primary-solid" />
                <span className="truncate">{student.headline}</span>
              </p>
            )}
            {student?.email && (
              <p className="flex items-center gap-1 text-xs text-text-subtle mt-1">
                <Mail className="h-3 w-3 shrink-0" />
                <span className="truncate">{student.email}</span>
              </p>
            )}
          </div>
        </div>

        {/* Mentor Box */}
        <div className="flex items-start gap-3.5 rounded-2xl border border-border bg-surface-2 p-4">
          <Avatar
            src={mentor?.avatarUrl || undefined}
            name={mentor?.fullName || t('mentoring.mentor', 'Mentor')}
            className="h-12 w-12 shrink-0 rounded-2xl ring-2 ring-success"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="whitespace-nowrap rounded-md bg-success-soft px-2 py-0.5 text-xs font-bold uppercase text-success">
                {t('mentoring.mentorRoleTag', 'Cố vấn (Mentor)')}
              </span>
            </div>
            <p className="mt-1 truncate text-sm font-bold text-text">
              {mentor?.fullName || t('mentoring.mentor', 'Mentor')}
            </p>
            {mentor?.headline && (
              <p className="flex items-center gap-1 text-xs text-text-subtle mt-0.5">
                <Award className="h-3 w-3 shrink-0 text-success" />
                <span className="truncate">{mentor.headline}</span>
              </p>
            )}
            {mentor?.email && (
              <p className="flex items-center gap-1 text-xs text-text-subtle mt-1">
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
