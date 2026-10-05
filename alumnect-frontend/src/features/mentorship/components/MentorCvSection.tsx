import React, { useRef, useState } from 'react'
import {
  UploadCloud,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
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
        throw new Error('Không lấy được link upload tệp tin từ hệ thống.')
      }

      // 2. Upload file trực tiếp lên R2
      await mentorRegistrationApi.uploadFileToR2(presigned.uploadUrl, file)

      // 3. Lưu trực tiếp publicUrl như các chức năng khác trong hệ thống
      onCvUploaded(presigned.publicUrl)
      toast.success('Tải tệp CV lên hệ thống thành công!')
    } catch (err: any) {
      toast.error(err.message || 'Tải CV lên kho lưu trữ thất bại. Vui lòng thử lại.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-[#242526] rounded-2xl border border-slate-200/80 dark:border-[#393a3b] p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#393a3b] mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#f27024] dark:text-orange-400 flex items-center justify-center font-bold">
            4
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-[#f0f2f5] text-lg">Đính kèm Hồ sơ năng lực / CV</h3>
            <p className="text-xs text-slate-500 dark:text-[#b0b3b8]">
              Tài liệu CV được lưu trữ an toàn, bảo mật riêng tư và chỉ người có thẩm quyền mới có thể truy cập
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Private Document
        </span>
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
              ? 'border-emerald-400/80 dark:border-emerald-600/50 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/30'
              : 'border-slate-200 dark:border-[#393a3b] hover:border-[#f27024] dark:hover:border-[#f27024] bg-slate-50/60 dark:bg-[#18191a]/60 hover:bg-orange-50/30 dark:hover:bg-[#1f2022]'
          }`}
        >
          {isUploading ? (
            <div className="py-4 flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-[#f27024] animate-spin" />
              <div>
                <span className="text-sm font-semibold text-slate-700 dark:text-[#f0f2f5] block">Đang tải tệp lên kho lưu trữ đám mây...</span>
                <span className="text-xs text-slate-400 dark:text-[#8a8d91] block mt-0.5">Vui lòng đợi trong giây lát</span>
              </div>
            </div>
          ) : cvFileKey ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <span className="text-sm font-bold text-emerald-900 dark:text-emerald-300 block">
                  {selectedFileName || 'Tệp CV đã được đính kèm thành công'}
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 block mt-1">
                  Nhấp vào đây nếu bạn muốn chọn tệp CV khác để thay thế
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-[#f27024] flex items-center justify-center shadow-inner">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div>
                <span className="text-base font-semibold text-slate-700 dark:text-[#f0f2f5] block">Nhấp để chọn tệp CV tải lên</span>
                <span className="text-xs text-slate-400 dark:text-[#8a8d91] block mt-1">Hỗ trợ định dạng PDF, DOC, DOCX (Tối đa 15MB)</span>
              </div>
            </div>
          )}
        </div>

        {(cvDownloadUrl || cvFileKey) && (
          <div className="mt-4 flex items-center justify-between p-3 bg-slate-50 dark:bg-[#18191a]/60 rounded-xl border border-slate-200/80 dark:border-[#393a3b] text-xs">
            <span className="text-slate-700 dark:text-[#f0f2f5] font-medium truncate flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Tệp CV hiện tại đang lưu trữ</span>
            </span>
            <a
              href={cvDownloadUrl || cvFileKey}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[#f27024] hover:text-[#d45105] font-semibold bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900/50 px-3 py-1 rounded-lg transition-colors"
            >
              <span>Xem tệp CV</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
