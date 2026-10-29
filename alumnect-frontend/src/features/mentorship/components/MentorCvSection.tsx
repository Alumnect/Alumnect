import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
        throw new Error(t('mentoring.uploadCvError'))
      }

      // 2. Upload file trực tiếp lên R2
      await mentorRegistrationApi.uploadFileToR2(presigned.uploadUrl, file)

      // 3. Lưu trực tiếp publicUrl như các chức năng khác trong hệ thống
      onCvUploaded(presigned.publicUrl)
      toast.success(t('mentoring.uploadCvSuccess'))
    } catch (err: any) {
      toast.error(err.message || t('mentoring.uploadCvError'))
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="bg-surface rounded-2xl border border-cream-300/80 dark:border-border p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-border dark:border-border mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary-solid flex items-center justify-center font-bold">
            4
          </div>
          <div>
            <h3 className="font-semibold text-text text-lg">
              {t('mentoring.cvSectionStepTitle')} <span className="text-danger">*</span>
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
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
            cvFileKey
              ? 'border-success bg-success-soft hover:bg-success-border/60'
              : 'border-border dark:border-border hover:border-primary bg-cream-100/60 dark:bg-bg/60 hover:bg-brand-50/30 dark:hover:bg-[#1f2022]'
          }`}
        >
          {isUploading ? (
            <div className="py-4 flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-primary-solid animate-spin" />
              <div>
                <span className="text-sm font-semibold text-text-muted block">{t('mentoring.uploadingCv')}</span>
                <span className="text-xs text-text-subtle dark:text-text-subtle block mt-0.5">{t('mentoring.pleaseWait')}</span>
              </div>
            </div>
          ) : cvFileKey ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-success-soft text-success flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <span className="text-sm font-bold text-success block">
                  {selectedFileName || t('mentoring.cvAttached')}
                </span>
                <span className="text-xs text-success block mt-1">
                  {t('mentoring.clickToReplaceCv')}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-primary-soft text-primary-solid flex items-center justify-center shadow-inner">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div>
                <span className="text-base font-semibold text-text-muted block">{t('mentoring.selectCvFile')}</span>
                <span className="text-xs text-text-subtle dark:text-text-subtle block mt-1">{t('mentoring.cvFileLimits')}</span>
              </div>
            </div>
          )}
        </div>

        {(cvDownloadUrl || cvFileKey) && (
          <div className="mt-4 flex items-center justify-between p-3 bg-surface-2 rounded-xl border border-cream-300/80 dark:border-border text-xs">
            <span className="text-text-muted font-medium truncate flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-success shrink-0" />
              <span>{t('mentoring.currentCv')}</span>
            </span>
            <a
              href={cvDownloadUrl || cvFileKey}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-primary-solid hover:text-primary-solid font-semibold bg-primary-soft hover:bg-primary-soft px-3 py-1 rounded-lg transition-colors"
            >
              <span>{t('mentoring.viewCv')}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
