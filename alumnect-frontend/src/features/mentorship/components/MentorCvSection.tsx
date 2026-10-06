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
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-6">
        <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#f27024] flex items-center justify-center font-bold">
          4
        </div>
        <h3 className="font-semibold text-slate-800 text-lg">CV</h3>
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
              ? 'border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50/60'
              : 'border-slate-200 hover:border-[#f27024] bg-slate-50/60 hover:bg-orange-50/30'
          }`}
        >
          {isUploading ? (
            <div className="py-4 flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-[#f27024] animate-spin" />
              <div>
                <span className="text-sm font-semibold text-slate-700 block">Đang tải lên...</span>
              </div>
            </div>
          ) : cvFileKey ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <span className="text-sm font-bold text-emerald-900 block">
                  {selectedFileName || 'Đã đính kèm CV'}
                </span>
                <span className="text-xs text-emerald-600 block mt-1">
                  Nhấp để thay tệp khác
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 text-[#f27024] flex items-center justify-center shadow-inner">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div>
                <span className="text-base font-semibold text-slate-700 block">Chọn tệp CV</span>
                <span className="text-xs text-slate-400 block mt-1">PDF, DOC, DOCX (tối đa 15MB)</span>
              </div>
            </div>
          )}
        </div>

        {(cvDownloadUrl || cvFileKey) && (
          <div className="mt-4 flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
            <span className="text-slate-700 font-medium truncate flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>CV hiện tại</span>
            </span>
            <a
              href={cvDownloadUrl || cvFileKey}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[#f27024] hover:text-[#d45105] font-semibold bg-orange-50 hover:bg-orange-100 px-3 py-1 rounded-lg transition-colors"
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
