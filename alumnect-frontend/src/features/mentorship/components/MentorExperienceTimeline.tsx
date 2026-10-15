import { Briefcase, Building, Calendar, MapPin, Star } from 'lucide-react'
import { Card } from '@/components/ui'
import type { MentorExperienceItem } from '../model/mentorDetailTypes'

interface MentorExperienceTimelineProps {
  experiences: MentorExperienceItem[]
}

/**
 * Định dạng ngày tháng năm hiển thị thân thiện (MM/YYYY).
 */
function formatPeriod(dateStr?: string | null): string {
  if (!dateStr) return ''
  try {
    const parts = dateStr.split('-')
    if (parts.length >= 2) {
      return `${parts[1]}/${parts[0]}`
    }
    return dateStr
  } catch {
    return dateStr
  }
}

/**
 * Hiển thị Dòng thời gian kinh nghiệm làm việc của Mentor (Career Timeline - UC99).
 * Tái sử dụng phong cách thiết kế timeline từ User Profile hiện có.
 */
export function MentorExperienceTimeline({ experiences }: MentorExperienceTimelineProps) {
  const hasExperiences = experiences && experiences.length > 0

  return (
    <Card
      hover={false}
      className="border border-border bg-surface p-6 sm:p-7 text-left space-y-5"
    >
      <div className="flex items-center gap-2.5 border-b border-border pb-3.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-warning-soft text-warning">
          <Briefcase className="h-4 w-4" />
        </span>
        <h2 className="font-display text-lg font-bold text-text">
          Hành trình nghề nghiệp & Kinh nghiệm
        </h2>
      </div>

      {hasExperiences ? (
        <div className="relative mt-4 pl-4 sm:pl-6 space-y-6 before:absolute before:left-2 sm:before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-plum-900/10 dark:before:bg-white/10">
          {experiences.map((exp) => (
            <div key={exp.id} className="relative group">
              {/* Biểu tượng timeline */}
              <span
                className={`absolute -left-[21px] sm:-left-[29px] top-1.5 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full border-2 border-white ring-2 transition-all dark:border-border ${
                  exp.isPrimary
                    ? 'bg-amber-400 ring-amber-300'
                    : exp.isCurrent
                    ? 'bg-primary-solid ring-brand-200'
                    : 'bg-plum-300 ring-border dark:bg-white/15'
                }`}
              />

              <div className="rounded-2xl p-4 transition-all duration-200 bg-cream-100/40 hover:bg-cream-100/80 border border-border dark:bg-white/[0.02] dark:hover:bg-white/[0.05] dark:border-white/[0.04]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-text">
                        {exp.title}
                      </h3>
                      {exp.isPrimary && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-warning-soft px-2 py-0.5 text-xs font-bold text-warning border border-warning-border">
                          <Star className="h-3 w-3 fill-warning text-warning" /> Vai trò chính
                        </span>
                      )}
                      {exp.isCurrent && !exp.isPrimary && (
                        <span className="inline-flex items-center rounded-lg bg-success-soft px-2 py-0.5 text-xs font-bold text-success border border-success-border">
                          Hiện tại
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-bold text-text-muted mt-0.5 flex items-center gap-1.5">
                      <Building className="h-3.5 w-3.5 text-text-subtle shrink-0" />
                      <span>{exp.company}</span>
                    </p>
                  </div>
                </div>

                {/* Thời gian và địa điểm */}
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-subtle">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-text-subtle" />
                    <span>
                      {exp.startDate ? formatPeriod(exp.startDate) : ''} -{' '}
                      {exp.isCurrent ? 'Hiện tại' : exp.endDate ? formatPeriod(exp.endDate) : ''}
                    </span>
                  </span>

                  {(exp.locationCity || exp.location) && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-text-subtle" />
                      <span>{exp.locationCity || exp.location}</span>
                    </span>
                  )}
                </div>

                {/* Mô tả chi tiết */}
                {exp.description && (
                  <p className="mt-2.5 text-xs leading-relaxed text-text-muted whitespace-pre-line border-t border-border pt-2 dark:border-white/[0.05]">
                    {exp.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-text-subtle italic">
          Mentor chưa cập nhật lịch sử làm việc trên hệ thống.
        </p>
      )}
    </Card>
  )
}
