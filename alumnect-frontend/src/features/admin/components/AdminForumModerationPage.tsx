import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { HelpCircle, MessageSquare, ShieldCheck } from 'lucide-react'
import { PageHeader } from '@/components/ui'
import { cn } from '@/lib/utils'
import { AdminViolatingQuestionsQueue } from './AdminViolatingQuestionsQueue'
import { AdminViolatingAnswersQueue } from './AdminViolatingAnswersQueue'

interface AdminForumModerationPageProps {
  defaultTab?: 'questions' | 'answers'
}

/**
 * Trang kiểm duyệt Diễn đàn Q&A thống nhất dành cho Admin.
 * Cho phép chuyển đổi linh hoạt giữa kiểm duyệt Câu hỏi vi phạm (UC78) và Câu trả lời vi phạm (UC79).
 */
export function AdminForumModerationPage({ defaultTab = 'questions' }: AdminForumModerationPageProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabFromUrl = searchParams.get('tab') as 'questions' | 'answers' | null

  const [activeTab, setActiveTab] = useState<'questions' | 'answers'>(tabFromUrl || defaultTab)

  // Đồng bộ state khi URL search params thay đổi
  useEffect(() => {
    if (tabFromUrl && (tabFromUrl === 'questions' || tabFromUrl === 'answers')) {
      setActiveTab(tabFromUrl)
    }
  }, [tabFromUrl])

  const handleTabChange = (tab: 'questions' | 'answers') => {
    setActiveTab(tab)
    setSearchParams({ tab }, { replace: true })
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      {/* Header trang và Bộ chuyển đổi Tab kiểm duyệt */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <PageHeader
          title="Kiểm duyệt Diễn đàn Q&A"
          subtitle="Quản lý và xử lý các báo cáo vi phạm câu hỏi và câu trả lời từ cộng đồng AlumNect."
        />

        {/* Tab switch chọn: Câu hỏi hoặc Câu trả lời */}
        <div className="flex items-center gap-1.5 p-1.5 bg-white border border-plum-900/10 rounded-full shadow-xs self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => handleTabChange('questions')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer',
              activeTab === 'questions'
                ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md'
                : 'text-plum-600 hover:text-plum-950 hover:bg-brand-50/60'
            )}
          >
            <HelpCircle size={15} />
            <span>Báo cáo câu hỏi</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('answers')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer',
              activeTab === 'answers'
                ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md'
                : 'text-plum-600 hover:text-plum-950 hover:bg-brand-50/60'
            )}
          >
            <MessageSquare size={15} />
            <span>Báo cáo câu trả lời</span>
          </button>
        </div>
      </div>

      {/* Nội dung tương ứng của từng tab */}
      <div>
        {activeTab === 'questions' ? (
          <AdminViolatingQuestionsQueue hideHeader />
        ) : (
          <AdminViolatingAnswersQueue hideHeader />
        )}
      </div>
    </div>
  )
}
