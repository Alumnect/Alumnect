import React, { useRef, useState } from 'react'
import {
  UploadCloud,
  CheckCircle2,
  ExternalLink,
  Loader2,
  FileCheck,
} from 'lucide-react'
import { mentorRegistrationApi } from '../api/mentorRegistrationApi'
import { toast } from '@/components/ui'

interface Props {
  cvFileKey: string
  cvDownloadUrl?: string | null
  onCvUploaded: (key: string) => void
}

export const MentorCvSection: React.FC<Props> = ({
  cvFileKey,
  cvDownloadUrl,
  onCvUploaded,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFileName, setSelectedFileName] = useState<string>('')

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFileName(file.name)
    setIsUploading(true)

    try {
      // 1. Lấy link ký upload lên Cloudflare R2
      const presigned = await mentorRegistrationApi.getPresignedUploadUrl(
        file.name,
        file.type || 'application/pdf'
      )
      if (!presigned || !presigned.uploadUrl) {
        throw new Error('Không lấy được link tải lên.')
      }

      // 2. Upload file trực tiếp lên R2
      await mentorRegistrationApi.uploadFileToR2(presigned.uploadUrl, file)

      // 3. Lưu trực tiếp publicUrl như các chức năng khác trong hệ thống
      onCvUploaded(presigned.publicUrl)
      toast.success('Đã tải CV lên')
    } catch (err: any) {
      toast.error(err.message || 'Tải CV thất bại, vui lòng thử lại.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-[#242526] rounded-2xl border border-cream-300/80 dark:border-[#393a3b] p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-cream-200 dark:border-[#393a3b] mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-700/40 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold">
            4
          </div>
          <div>
            <h3 className="font-semibold text-plum-800 dark:text-[#f0f2f5] text-lg">
              CV của bạn <span className="text-coral-500">*</span>
            </h3>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={handleFileChange}
        />

        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            cvFileKey
              ? 'border-mint-400/80 dark:border-mint-600/50 bg-mint-50/50 dark:bg-mint-950/20 hover:bg-mint-50/70 dark:hover:bg-mint-950/30'
              : 'border-cream-300 dark:border-[#393a3b] hover:border-brand-600 dark:hover:border-brand-600 bg-cream-100/60 dark:bg-[#18191a]/60 hover:bg-brand-50/30 dark:hover:bg-[#1f2022]'
          }`}
        >
          {isUploading ? (
            <div className="py-4 flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-brand-600 animate-spin" />
              <div>
                <span className="text-sm font-semibold text-plum-700 dark:text-[#f0f2f5] block">Đang tải lên...</span>
                <span className="text-xs text-plum-400 dark:text-[#8a8d91] block mt-0.5">Vui lòng đợi trong giây lát</span>
              </div>
            </div>
          ) : cvFileKey ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-mint-100 dark:bg-mint-950/60 text-mint-600 dark:text-mint-400 flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <span className="text-sm font-bold text-mint-900 dark:text-mint-300 block">
                  {selectedFileName || 'Đã đính kèm CV'}
                </span>
                <span className="text-xs text-mint-600 dark:text-mint-400 block mt-1">
                  Nhấp để thay tệp khác
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-700/40 text-brand-600 flex items-center justify-center shadow-inner">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div>
                <span className="text-base font-semibold text-plum-700 dark:text-[#f0f2f5] block">Chọn tệp CV</span>
                <span className="text-xs text-plum-400 dark:text-[#8a8d91] block mt-1">PDF, DOC, DOCX (tối đa 15MB)</span>
              </div>
            </div>
          )}
        </div>

        {(cvDownloadUrl || cvFileKey) && (
          <div className="mt-4 flex items-center justify-between p-3 bg-cream-100 dark:bg-[#18191a]/60 rounded-xl border border-cream-300/80 dark:border-[#393a3b] text-xs">
            <span className="text-plum-700 dark:text-[#f0f2f5] font-medium truncate flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-mint-600 dark:text-mint-400 shrink-0" />
              <span>CV hiện tại</span>
            </span>
            <a
              href={cvDownloadUrl || cvFileKey}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-brand-600 hover:text-brand-700 font-semibold bg-brand-50 dark:bg-brand-700/40 hover:bg-brand-100 dark:hover:bg-brand-700/50 px-3 py-1 rounded-lg transition-colors"
            >
              <span>Xem</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
