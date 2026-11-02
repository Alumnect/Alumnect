import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import {
  User, Mail, Eye, EyeOff, GraduationCap, Users,
  ArrowRight, BadgeCheck, Upload, Loader2, Sparkles, CheckCircle2, AlertCircle
} from 'lucide-react'
import { useMajors, useRegister, usePresignedUrl } from '../hooks/useAuth'
import { useGoogleRegister, useGoogleLogin } from '../hooks/useAuthMutations'
import { Field } from './AuthScaffold'
import { registerSchema, googleRegisterSchema } from '../model/schemas'
import { GoogleLogin } from '@react-oauth/google'
import { useNavigate } from 'react-router-dom'
import type { RegisterFormValues } from '../model/schemas'
import { Button } from '@/components/ui/Button'
import { toast, SelectDropdown } from '@/components/ui'
import { cn } from '@/lib/utils'

interface RegisterFormProps {
  googleData?: { email: string; fullName: string; token: string }
  onSuccess: (email: string, role: 'STUDENT' | 'ALUMNI') => void
}

export function RegisterForm({ googleData, onSuccess }: RegisterFormProps) {
  const { t } = useTranslation()
  const [showPassword, setShowPassword] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const { data: majors = [], isLoading: isLoadingMajors } = useMajors()
  const registerMutation = useRegister()
  const googleRegisterMutation = useGoogleRegister()
  const googleLoginMutation = useGoogleLogin()
  const presignedUrlMutation = usePresignedUrl()
  const navigate = useNavigate()

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (credentialResponse.credential) {
      try {
        await googleLoginMutation.mutateAsync(credentialResponse.credential)
      } catch (err: any) {
        if (err.status === 404 || err.data?.error === 404) {
          const metadata = err.data?.data || {}
          navigate('/register', {
            state: {
              googleData: {
                email: metadata.email || '',
                fullName: metadata.fullName || '',
                token: credentialResponse.credential
              }
            },
            replace: true
          })
        }
      }
    }
  }

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues & { token?: string }>({
    resolver: zodResolver(googleData ? googleRegisterSchema : registerSchema) as any,
    defaultValues: {
      role: 'STUDENT',
      fullName: googleData?.fullName || '',
      email: googleData?.email || '',
      password: '',
      token: googleData?.token || '',
    },
  })

  // Cập nhật giá trị form khi googleData thay đổi (chuyển đổi sang đăng ký bằng Google)
  useEffect(() => {
    if (googleData) {
      setValue('email', googleData.email, { shouldValidate: true, shouldDirty: true })
      setValue('fullName', googleData.fullName, { shouldValidate: true, shouldDirty: true })
      setValue('token', googleData.token)
    }
  }, [googleData, setValue])

  const currentRole = watch('role')
  const currentProofUrl = watch('proofUrl')

  // Tải ảnh minh chứng lên Cloudflare R2 qua Presigned URL
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadError(null)

    try {
      const presignedRes = await presignedUrlMutation.mutateAsync({
        fileName: file.name,
        contentType: file.type,
        folder: 'proofs',
      })

      const { uploadUrl, publicUrl } = presignedRes.data

      await axios.put(uploadUrl, file, {
        headers: {
          'Content-Type': file.type,
        },
      })

      setValue('proofUrl', publicUrl)
    } catch (err: any) {
      console.error(err)
      setUploadError(err.response?.data?.message || err.message || t('auth.uploadProofError'))
      setValue('proofUrl', '')
    } finally {
      setIsUploading(false)
    }
  }

  const onSubmit = async (data: RegisterFormValues & { token?: string }) => {
    try {
      if (googleData) {
        await googleRegisterMutation.mutateAsync({
          token: googleData.token,
          fullName: data.fullName,
          role: data.role,
          majorId: Number(data.majorId),
          studentCode: data.studentCode,
          proofUrl: data.proofUrl || undefined,
        })
      } else {
        await registerMutation.mutateAsync({
          fullName: data.fullName,
          email: data.email,
          password: data.password,
          role: data.role,
          majorId: Number(data.majorId),
          studentCode: data.studentCode,
          proofUrl: data.proofUrl || undefined,
        })
        toast.success(t('auth.registerSuccessOtpPrompt'))
        onSuccess(data.email, data.role)
      }
    } catch (err: any) {
      console.error(err)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Sparkles size={20} className="text-primary-solid animate-pulse" />
        <span className="text-xs font-bold uppercase tracking-wider text-primary-solid">{t('auth.registerTitle')}</span>
      </div>
      <h1 className="mt-1 text-3xl font-extrabold text-text tracking-tight">{t('auth.registerTitle')}</h1>
      <p className="mt-1 text-sm text-text-subtle">{t('auth.registerSubtitle')}</p>

      {googleData && (
        <div className="mt-4 rounded-xl bg-primary-soft border border-primary-soft-border p-3 text-xs text-primary-solid flex items-start gap-2 animate-pop">
          <Sparkles size={16} className="shrink-0 mt-0.5 text-primary-solid animate-pulse" />
          <div>
            <p className="font-bold">Google Registration</p>
            <p className="mt-0.5 text-text-muted">
              {googleData.email}
            </p>
          </div>
        </div>
      )}

      {/* Chọn vai trò (Role Selector) */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        {[
          { key: 'STUDENT', label: t('common.student'), desc: 'FPT University', icon: Users },
          { key: 'ALUMNI', label: t('common.alumni'), desc: 'Alumni Network', icon: GraduationCap },
        ].map((r) => {
          const active = currentRole === r.key
          return (
            <button
              key={r.key}
              type="button"
              onClick={() => setValue('role', r.key as 'STUDENT' | 'ALUMNI')}
              className={cn(
                'relative rounded-2xl border p-4 text-left transition duration-300',
                active
                  ? 'border-brand-400/60 bg-primary-soft ring-2 ring-primary/30'
                  : 'border-border bg-surface-2 hover:border-border-strong hover:bg-surface-2',
              )}
            >
              <r.icon size={20} className={active ? 'text-primary-solid' : 'text-text-subtle'} />
              <p className="mt-2 text-sm font-bold text-text">{r.label}</p>
              <p className="text-xs text-text-subtle">{r.desc}</p>
              {active && <BadgeCheck size={16} className="absolute right-3 top-3 text-primary-solid" />}
            </button>
          )
        })}
      </div>

      {(registerMutation.isError || googleRegisterMutation.isError) && (
        <div className="mt-4 rounded-xl bg-danger-soft border border-danger-border p-3 text-xs text-danger flex items-start gap-2 animate-pop">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{registerMutation.error?.message || googleRegisterMutation.error?.message}</span>
        </div>
      )}

      <form className="mt-5 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Thông tin chung */}
        <Field
          label={t('auth.fullName')}
          placeholder="Nguyen Van A"
          trailing={<User size={16} />}
          error={errors.fullName?.message}
          {...register('fullName')}
        />

        <Field
          label={t('auth.email')}
          type="email"
          placeholder="you@fpt.edu.vn"
          trailing={<Mail size={16} />}
          error={errors.email?.message}
          disabled={!!googleData}
          className={cn(googleData && 'bg-surface-2 cursor-not-allowed')}
          {...register('email')}
        />

        {!googleData && (
          <Field
            label={t('auth.password')}
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            error={errors.password?.message}
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="flex h-6 w-6 items-center justify-center text-text-subtle hover:text-text-muted transition-colors cursor-pointer"
                aria-label={t('auth.togglePasswordVisibility')}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
            {...register('password')}
          />
        )}

        {/* Dropdown Chuyên ngành */}
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-text-muted">{t('auth.major')}</span>
          <SelectDropdown
            value={watch('majorId') ? Number(watch('majorId')) : ''}
            onChange={(val) => setValue('majorId', val as number, { shouldValidate: true, shouldDirty: true })}
            options={majors.map((m) => ({ value: m.id, label: `${m.code} - ${m.name}` }))}
            placeholder={t('auth.selectMajor')}
            disabled={isLoadingMajors}
            searchPlaceholder={t('auth.searchMajor')}
            buttonClassName={cn('h-12 text-sm', errors.majorId && 'border-danger ring-danger/20')}
          />
          {errors.majorId && (
            <span className="mt-1 block text-xs font-medium text-danger">{errors.majorId.message}</span>
          )}
        </label>

        {/* Mã số sinh viên */}
        <Field
          label={t('auth.studentCodeLabel')}
          placeholder={t('auth.studentCodePlaceholder')}
          error={errors.studentCode?.message}
          {...register('studentCode')}
        />

        {/* Các trường đặc thù của ALUMNI */}
        {currentRole === 'ALUMNI' && (
          <div className="space-y-4 p-4 rounded-2xl bg-gold-400/5 border border-gold-400/15 animate-pop">
            <div className="text-xs font-semibold text-warning flex items-center gap-1.5">
              <GraduationCap size={16} />
              <span>{t('auth.alumniVerificationNotice')}</span>
            </div>

            {/* Upload tệp tin minh chứng tốt nghiệp */}
            <div className="block">
              <span className="mb-1.5 block text-sm font-semibold text-text-muted">{t('auth.graduationProofLabel')}</span>
              <div className="relative flex items-center justify-center border-2 border-dashed border-border-strong rounded-xl bg-cream-100/50 p-4 transition-colors hover:bg-surface-2">
                {isUploading ? (
                  <div className="flex flex-col items-center py-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary-solid" />
                    <span className="mt-2 text-xs text-text-subtle">{t('auth.uploadingProof')}</span>
                  </div>
                ) : currentProofUrl ? (
                  <div className="w-full flex flex-col items-center">
                    <img src={currentProofUrl} alt={t('auth.proofAlt')} className="h-28 w-full object-cover rounded-lg border border-border" />
                    <span className="mt-2 text-xs text-success font-medium flex items-center gap-1">
                      <CheckCircle2 size={12} /> {t('auth.uploadSuccess')}
                    </span>
                    <label className="mt-2 text-xs text-primary-solid hover:text-primary-solid font-bold cursor-pointer">
                      {t('auth.changeFile')}
                      <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileUpload} />
                    </label>
                  </div>
                ) : (
                  <label className="flex flex-col items-center cursor-pointer w-full py-4">
                    <Upload className="h-6 w-6 text-text-subtle" />
                    <span className="mt-2 text-xs font-semibold text-text-muted">{t('auth.clickToUpload')}</span>
                    <span className="text-xs text-text-subtle mt-1">{t('auth.proofHint')}</span>
                    <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileUpload} />
                  </label>
                )}
              </div>
              {errors.proofUrl && (
                <span className="mt-1 block text-xs font-medium text-danger">{errors.proofUrl.message}</span>
              )}
              {uploadError && (
                <span className="mt-1 block text-xs font-medium text-danger">{uploadError}</span>
              )}
            </div>
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-4"
          disabled={registerMutation.isPending || googleRegisterMutation.isPending || isUploading}
          rightIcon={registerMutation.isPending || googleRegisterMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight size={18} />}
        >
          {registerMutation.isPending || googleRegisterMutation.isPending ? t('common.processing') : t('auth.registerTitle')}
        </Button>
      </form>

      {!googleData && (
        <>
          <div className="my-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs font-semibold uppercase tracking-wider text-text-subtle">{t('common.or')}</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="flex justify-center mb-4">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => console.error('Google Login Failed')}
              useOneTap
              shape="rectangular"
              theme="outline"
              text="signup_with"
              size="large"
            />
          </div>
        </>
      )}

      <p className="mt-8 text-center text-sm text-text-subtle">
        {t('auth.alreadyHaveAccount')}{' '}
        <Link to="/login" className="font-bold text-primary-solid hover:text-primary-solid transition-colors">
          {t('common.loginNow')}
        </Link>
      </p>
    </>
  )
}
