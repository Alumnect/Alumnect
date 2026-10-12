import { MapPin, Laptop, Users, BookOpen, Quote } from 'lucide-react'
import { Card } from '@/components/ui'
import type { MentorDetailData } from '../model/mentorDetailTypes'

interface MentorAboutSectionProps {
  mentor: MentorDetailData
}

/**
 * Hiển thị phần Giới thiệu & Định hướng cố vấn của Mentor (UC99).
 * Thiết kế tinh gọn, trang nhã, không lặp lại các thông tin đã hiển thị ở Header.
 */
export function MentorAboutSection({ mentor }: MentorAboutSectionProps) {
  const bio = mentor.bio?.trim() || ''
  const biography = mentor.biography?.trim() || ''
  const isDuplicateBio = bio.length > 0 && biography.length > 0 && bio === biography

  const displayBio = bio || biography
  const displaySecondaryBio = !isDuplicateBio && biography.length > 0 ? biography : null

  return (
    <Card
      hover={false}
      className="border border-plum-900/[0.08] bg-white p-6 sm:p-7 text-left space-y-5 dark:bg-[#242526] dark:border-[#393a3b]"
    >
      <div className="flex items-center gap-2.5 border-b border-plum-900/[0.06] pb-3.5 dark:border-[#393a3b]">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
          <BookOpen className="h-4 w-4" />
        </span>
        <h2 className="font-heading text-lg font-extrabold text-plum-900 dark:text-[#e4e6eb]">
          Giới thiệu & Định hướng cố vấn
        </h2>
      </div>

      {/* Thông điệp từ Mentor */}
      {displayBio ? (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-plum-400 dark:text-[#8f9399]">
            <Quote className="h-3.5 w-3.5 text-brand-500" />
            <span>Thông điệp gửi tới học viên</span>
          </div>
          <p className="text-sm leading-relaxed text-plum-800 dark:text-[#e4e6eb] bg-brand-50/30 p-4 rounded-2xl border border-brand-200/40 dark:bg-white/[0.03] dark:border-white/[0.05] italic">
            "{displayBio}"
          </p>
        </div>
      ) : (
        <p className="text-xs text-plum-400 italic">
          Mentor chưa cập nhật thông điệp giới thiệu.
        </p>
      )}

      {/* Tiểu sử cá nhân chi tiết (nếu có nội dung khác biệt với bio) */}
      {displaySecondaryBio && (
        <div className="space-y-2 pt-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-plum-400 dark:text-[#8f9399]">
            Tổng quan sự nghiệp & kinh nghiệm
          </h3>
          <p className="text-sm leading-relaxed text-plum-600 dark:text-[#b0b3b8] whitespace-pre-line">
            {displaySecondaryBio}
          </p>
        </div>
      )}

      {/* Dòng tags thông tin kết nối gọn gàng */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-3 border-t border-plum-900/[0.05] dark:border-[#393a3b] text-xs text-plum-600 dark:text-[#b0b3b8]">
        {mentor.city && (
          <span className="inline-flex items-center gap-1.5 font-medium">
            <MapPin className="h-3.5 w-3.5 text-coral-500" />
            <span>Khu vực: <strong>{mentor.city}</strong></span>
          </span>
        )}

        {mentor.workingMode && (
          <span className="inline-flex items-center gap-1.5 font-medium">
            <Laptop className="h-3.5 w-3.5 text-brand-500" />
            <span>
              Hình thức:{' '}
              <strong>
                {mentor.workingMode === 'ONLINE'
                  ? 'Trực tuyến (Online)'
                  : mentor.workingMode === 'OFFLINE'
                  ? 'Gặp mặt (Offline)'
                  : 'Linh hoạt (Online & Offline)'}
              </strong>
            </span>
          </span>
        )}

        {mentor.mentoringType && (
          <span className="inline-flex items-center gap-1.5 font-medium">
            <Users className="h-3.5 w-3.5 text-violet-500" />
            <span>
              Phương thức:{' '}
              <strong>
                {mentor.mentoringType === 'INDIVIDUAL'
                  ? 'Kèm 1-1 cá nhân'
                  : mentor.mentoringType === 'GROUP'
                  ? 'Theo nhóm nhỏ'
                  : 'Cả 1-1 & Theo nhóm'}
              </strong>
            </span>
          </span>
        )}
      </div>
    </Card>
  )
}
