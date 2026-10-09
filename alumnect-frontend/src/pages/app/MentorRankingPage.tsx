import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { Container } from '@/components/ui/primitives'
import { useMentorIndustries } from '@/features/mentorship/hooks/useMentorRegistration'
import { useMentorRanking } from '@/features/mentorship/hooks/useMentorRanking'
import { MentorRankingHeader } from '@/features/mentorship/components/MentorRankingHeader'
import { MentorFieldSelector } from '@/features/mentorship/components/MentorFieldSelector'
import { MentorRankingList } from '@/features/mentorship/components/MentorRankingList'

/**
 * Trang Xem bảng xếp hạng Mentor theo từng lĩnh vực chuyên môn (UC97).
 * Đường dẫn: /app/mentoring/ranking
 */
export function MentorRankingPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  // 1. Tải danh mục ngành nghề / lĩnh vực chuyên môn
  const { data: industries = [], isLoading: isIndustriesLoading } = useMentorIndustries()

  // 2. Xác định lĩnh vực được chọn từ URL hoặc lấy ngành đầu tiên làm mặc định
  const initialFieldIdFromUrl = searchParams.get('fieldId')
    ? Number(searchParams.get('fieldId'))
    : null

  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(initialFieldIdFromUrl)
  const [page, setPage] = useState<number>(0)

  // Đồng bộ lĩnh vực mặc định khi danh sách ngành tải xong
  useEffect(() => {
    if (!selectedFieldId && industries.length > 0) {
      const defaultId = initialFieldIdFromUrl || industries[0].id
      setSelectedFieldId(defaultId)
    }
  }, [industries, selectedFieldId, initialFieldIdFromUrl])

  // Xử lý khi người dùng đổi lĩnh vực
  const handleSelectField = (fieldId: number) => {
    if (fieldId === selectedFieldId) return
    setSelectedFieldId(fieldId)
    setPage(0) // Đổi field phải reset trang về 0 (BR-01 & BR-05)
    setSearchParams({ fieldId: String(fieldId) }, { replace: true })
  }

  // 3. Truy vấn bảng xếp hạng Mentor theo fieldId và page đã chọn
  const { data: rankingData, isLoading, isError, error } = useMentorRanking(
    {
      fieldId: selectedFieldId || 0,
      page,
      size: 10,
    },
    Boolean(selectedFieldId),
  )

  const selectedIndustry = industries.find((ind) => ind.id === selectedFieldId)

  return (
    <Container className="space-y-5 py-4 sm:space-y-6 sm:py-6">
      {/* Thanh điều hướng quay lại Trang chủ Mentoring */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          to="/app/mentoring"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-plum-600 hover:text-brand-600 transition-colors dark:text-[#b0b3b8] dark:hover:text-[#e4e6eb]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Về Không gian Cố vấn</span>
        </Link>

        <span className="hidden items-center gap-1 text-xs text-plum-400 sm:flex dark:text-[#8a8d91]">
          <Sparkles className="h-3.5 w-3.5 text-gold-500" />
          Cập nhật theo mạng lưới cựu sinh viên FPT
        </span>
      </div>

      {/* Hero Header */}
      <MentorRankingHeader
        selectedFieldName={selectedIndustry?.name}
        totalMentors={rankingData?.totalElements}
      />

      {/* Category Selector theo lĩnh vực */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3 px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-plum-500 dark:text-[#b0b3b8]">
            Chọn Lĩnh Vực Chuyên Môn
          </h2>
          <span className="text-xs text-plum-400">
            {industries.length} lĩnh vực
          </span>
        </div>

        <MentorFieldSelector
          fields={industries}
          selectedFieldId={selectedFieldId}
          onSelectField={handleSelectField}
          isLoading={isIndustriesLoading}
        />
      </div>

      {/* Danh sách thứ hạng Mentor */}
      <MentorRankingList
        data={rankingData}
        isLoading={isLoading}
        isError={isError}
        error={error}
        page={page}
        onPageChange={setPage}
        fieldName={selectedIndustry?.name}
      />
    </Container>
  )
}
