import React, { useRef, useState } from 'react'
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  Building,
  User,
  Hash,
  Loader2,
} from 'lucide-react'
import { mentorRegistrationApi } from '../api/mentorRegistrationApi'
import { toast } from '@/components/ui'

interface Props {
  cvFileKey: string
  cvDownloadUrl?: string | null
  bankName: string
  bankAccountNumber: string
  bankAccountHolder: string
  onCvUploaded: (key: string) => void
  onBankNameChange: (val: string) => void
  onBankAccountNumberChange: (val: string) => void
  onBankAccountHolderChange: (val: string) => void
}

export const MentorCvAndBankSection: React.FC<Props> = ({
  cvFileKey,
  cvDownloadUrl,
  bankName,
  bankAccountNumber,
  bankAccountHolder,
  onCvUploaded,
  onBankNameChange,
  onBankAccountNumberChange,
  onBankAccountHolderChange,
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
      const presigned = await mentorRegistrationApi.getPresignedUploadUrl(file.name, file.type || 'application/pdf')
      if (!presigned || !presigned.uploadUrl) {
        throw new Error('Không lấy được link upload tệp tin từ hệ thống.')
      }

      // 2. Upload file trực tiếp lên R2
      await mentorRegistrationApi.uploadFileToR2(presigned.uploadUrl, file)

      // 3. Trích xuất file key từ publicUrl hoặc key
      let fileKey = presigned.publicUrl
      if (fileKey.includes('mentorship/cvs/')) {
        fileKey = fileKey.substring(fileKey.indexOf('mentorship/cvs/'))
      }

      onCvUploaded(fileKey)
      toast.success('Tải tệp CV lên hệ thống thành công!')
    } catch (err: any) {
      toast.error(err.message || 'Tải CV lên kho lưu trữ thất bại. Vui lòng thử lại.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-6">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
          4
        </div>
        <div>
          <h3 className="font-semibold text-slate-800 text-lg">Đính kèm CV & Tài khoản nhận chi trả</h3>
          <p className="text-xs text-slate-500">Tài liệu và thông tin tài khoản được lưu trữ an toàn, bảo mật riêng tư</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Phần 1: Tải CV (Private File) */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-emerald-600" /> Hồ sơ năng lực / CV <span className="text-rose-500">*</span>
          </label>
          <p className="text-xs text-slate-500 mb-3">
            Tải lên CV (PDF hoặc Word). CV được bảo mật riêng tư và chỉ người có thẩm quyền mới có thể truy cập.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={handleFileChange}
          />

          <div
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              cvFileKey
                ? 'border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50/60'
                : 'border-slate-200 hover:border-primary-400 bg-slate-50/60 hover:bg-primary-50/20'
            }`}
          >
            {isUploading ? (
              <div className="py-4 flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                <span className="text-xs font-medium text-slate-600">Đang tải tệp lên kho lưu trữ R2...</span>
              </div>
            ) : cvFileKey ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-emerald-800 block">
                    {selectedFileName || 'Đã có tệp CV được đính kèm'}
                  </span>
                  <span className="text-[11px] text-emerald-600 block mt-0.5">Nhấp vào đây nếu bạn muốn thay đổi CV khác</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-700 block">Nhấp để chọn tệp CV tải lên</span>
                  <span className="text-xs text-slate-400 block mt-0.5">Hỗ trợ PDF, DOC, DOCX</span>
                </div>
              </div>
            )}
          </div>

          {cvDownloadUrl && (
            <div className="mt-3 flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-600 truncate max-w-[200px] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>CV hiện tại đã lưu</span>
              </span>
              <a
                href={cvDownloadUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-semibold"
              >
                <span>Xem CV (Signed link)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        {/* Phần 2: Tài khoản nhận chi trả (Private 1-1) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-emerald-600" /> Tài khoản ngân hàng nhận chi trả <span className="text-rose-500">*</span>
            </label>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
              <ShieldCheck className="w-3 h-3 text-emerald-600" /> Private
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Thông tin được cô lập bảo mật, chỉ dùng cho việc chi trả thù lao cố vấn và tuyệt đối không hiển thị công khai.
          </p>

          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                <Building className="w-3 h-3 text-slate-400" /> Tên ngân hàng thụ hưởng <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                maxLength={100}
                placeholder="VD: Vietcombank, Techcombank, MB Bank..."
                value={bankName}
                onChange={(e) => onBankNameChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                <Hash className="w-3 h-3 text-slate-400" /> Số tài khoản ngân hàng <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                maxLength={50}
                placeholder="VD: 0123456789"
                value={bankAccountNumber}
                onChange={(e) => onBankAccountNumberChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" /> Tên chủ tài khoản (Viết hoa không dấu) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                maxLength={150}
                placeholder="VD: NGUYEN VAN A"
                value={bankAccountHolder}
                onChange={(e) => onBankAccountHolderChange(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium tracking-wide focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
