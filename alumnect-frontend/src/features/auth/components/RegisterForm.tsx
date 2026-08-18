import { useState, useEffect } from 'react'
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
import { cn } from '@/lib/utils'

interface RegisterFormProps {
  googleData?: { email: string; fullName: string; token: string }
  onSuccess: (email: string, role: 'STUDENT' | 'ALUMNI') => void
}

export function RegisterForm({ googleData, onSuccess }: RegisterFormProps) {
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
      note: '',
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
      setUploadError(err.response?.data?.message || err.message || 'Lỗi xảy ra khi tải ảnh lên R2')
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
          cohort: Number(data.cohort),
          studentCode: data.studentCode,
          graduationYear: data.graduationYear ? Number(data.graduationYear) : undefined,
          proofUrl: data.proofUrl || undefined,
          note: data.note || undefined,
        })
      } else {
        await registerMutation.mutateAsync({
          fullName: data.fullName,
          email: data.email,
          password: data.password,
          role: data.role,
          majorId: Number(data.majorId),
          cohort: Number(data.cohort),
          studentCode: data.studentCode,
          graduationYear: data.graduationYear ? Number(data.graduationYear) : undefined,
          proofUrl: data.proofUrl || undefined,
          note: data.note || undefined,
        })
        onSuccess(data.email, data.role)
      }
    } catch (err: any) {
      console.error(err)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Sparkles size={20} className="text-brand-500 animate-pulse" />
        <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Join AlumNect</span>
      </div>
      <h2 className="mt-1 text-3xl font-extrabold text-plum-900 tracking-tight">Đăng ký tài khoản</h2>
      <p className="mt-1 text-sm text-plum-500">Kết nối với cộng đồng sinh viên và cựu sinh viên FPTU.</p>

      {googleData && (
        <div className="mt-4 rounded-xl bg-brand-500/10 border border-brand-500/20 p-3 text-xs text-brand-700 flex items-start gap-2 animate-pop">
          <Sparkles size={16} className="shrink-0 mt-0.5 text-brand-600 animate-pulse" />
          <div>
            <p className="font-bold">Đăng ký qua Google</p>
            <p className="mt-0.5 text-plum-600">
              Hệ thống đã nhận email xác thực <strong className="text-plum-900 font-semibold">{googleData.email}</strong>. Vui lòng điền nốt thông tin dưới đây để hoàn tất hồ sơ.
            </p>
          </div>
        </div>
      )}

      {/* Chọn vai trò (Role Selector) */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        {[
          { key: 'STUDENT', label: 'Sinh viên', desc: 'Đang theo học', icon: Users },
          { key: 'ALUMNI', label: 'Cựu sinh viên', desc: 'Đã tốt nghiệp', icon: GraduationCap },
        ].map((r) => {
          const active = currentRole === r.key
          return (
            <button
              key={r.key}
              type="button"
              onClick={() => setValue('role', r.key as 'STUDENT' | 'ALUMNI')}
              className={cn(
                'relative rounded-2xl border p-4 text-left transition-all duration-300',
                active
                  ? 'border-brand-400/60 bg-brand-500/10 ring-2 ring-brand-500/30'
                  : 'border-plum-900/10 bg-plum-900/[0.03] hover:border-plum-900/20 hover:bg-plum-900/[0.05]',
              )}
            >
              <r.icon size={20} className={active ? 'text-brand-600' : 'text-plum-400'} />
              <p className="mt-2 text-sm font-bold text-plum-900">{r.label}</p>
              <p className="text-xs text-plum-400">{r.desc}</p>
              {active && <BadgeCheck size={16} className="absolute right-3 top-3 text-brand-500" />}
            </button>
          )
        })}
      </div>

      {(registerMutation.isError || googleRegisterMutation.isError) && (
        <div className="mt-4 rounded-xl bg-coral-50 border border-coral-200/50 p-3 text-xs text-coral-600 flex items-start gap-2 animate-pop">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{registerMutation.error?.message || googleRegisterMutation.error?.message}</span>
        </div>
      )}

      <form className="mt-5 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Thông tin chung */}
        <Field 
          label="Họ và tên" 
          placeholder="Nguyễn Văn A" 
          trailing={<User size={16} />} 
          error={errors.fullName?.message}
          {...register('fullName')}
        />
        
        <Field 
          label="Email FPT" 
          type="email" 
          placeholder="you@fpt.edu.vn" 
          trailing={<Mail size={16} />} 
          error={errors.email?.message}
          disabled={!!googleData}
          className={cn(googleData && 'bg-plum-900/[0.05] cursor-not-allowed')}
          {...register('email')}
        />

        {!googleData && (
          <Field
            label="Mật khẩu"
            type={showPassword ? 'text' : 'password'}
            placeholder="Tối thiểu 8 ký tự, có cả chữ và số"
            error={errors.password?.message}
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="grid h-8 w-8 place-items-center rounded-lg text-plum-400 hover:bg-plum-900/[0.06] hover:text-plum-900 transition-colors"
                aria-label="Ẩn/hiện mật khẩu"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
            {...register('password')}
          />
        )}

        {/* Dropdown Chuyên ngành */}
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-plum-700">Chuyên ngành</span>
          <select
            className={cn(
              'h-12 w-full rounded-xl border border-plum-900/10 bg-cream-100 px-3 text-sm text-plum-900 transition-colors focus:border-brand-400/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/25',
              errors.majorId && 'border-coral-400/60 focus:ring-coral-500/25 focus:border-coral-500'
            )}
            disabled={isLoadingMajors}
            {...register('majorId')}
          >
            <option value="">Chọn chuyên ngành</option>
            {majors.map((m) => (
              <option key={m.id} value={m.id}>
                {m.code} - {m.name}
              </option>
            ))}
          </select>
          {errors.majorId && (
            <span className="mt-1 block text-xs font-medium text-coral-500">{errors.majorId.message}</span>
          )}
        </label>

        <div className="grid grid-cols-2 gap-3">
          {/* Mã số sinh viên */}
          <Field
            label="Mã số sinh viên"
            placeholder="HE180000"
            error={errors.studentCode?.message}
            {...register('studentCode')}
          />

          {/* Khóa học */}
          <Field
            label="Khóa học (Cohort)"
            type="number"
            placeholder="Ví dụ: 18"
            error={errors.cohort?.message}
            {...register('cohort')}
          />
        </div>

        {/* Các trường đặc thù của ALUMNI */}
        {currentRole === 'ALUMNI' && (
          <div className="space-y-4 p-4 rounded-2xl bg-gold-400/5 border border-gold-400/15 animate-pop">
            <div className="text-xs font-semibold text-gold-700 flex items-center gap-1.5">
              <GraduationCap size={16} />
              <span>Yêu cầu xác minh cho Cựu sinh viên</span>
            </div>

            <Field
              label="Năm tốt nghiệp"
              type="number"
              placeholder="2022"
              error={errors.graduationYear?.message}
              {...register('graduationYear')}
            />

            {/* Upload tệp tin minh chứng tốt nghiệp */}
            <div className="block">
              <span className="mb-1.5 block text-sm font-semibold text-plum-700">Minh chứng bằng tốt nghiệp</span>
              <div className="relative flex items-center justify-center border-2 border-dashed border-plum-900/15 rounded-xl bg-cream-100/50 p-4 transition-colors hover:bg-cream-100">
                {isUploading ? (
                  <div className="flex flex-col items-center py-2">
                    <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
                    <span className="mt-2 text-xs text-plum-500">Đang tải ảnh lên Cloudflare R2...</span>
                  </div>
                ) : currentProofUrl ? (
                  <div className="w-full flex flex-col items-center">
                    <img src={currentProofUrl} alt="Minh chứng" className="h-28 w-full object-cover rounded-lg border border-plum-900/10" />
                    <span className="mt-2 text-xs text-mint-600 font-medium flex items-center gap-1">
                      <CheckCircle2 size={12} /> Tải lên thành công!
                    </span>
                    <label className="mt-2 text-xs text-brand-600 hover:text-brand-700 font-bold cursor-pointer">
                      Thay đổi tệp
                      <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileUpload} />
                    </label>
                  </div>
                ) : (
                  <label className="flex flex-col items-center cursor-pointer w-full py-4">
                    <Upload className="h-6 w-6 text-plum-400" />
                    <span className="mt-2 text-xs font-semibold text-plum-600">Nhấp để tải ảnh lên (JPG, PNG)</span>
                    <span className="text-[10px] text-plum-400 mt-1">Ảnh chụp bằng tốt nghiệp hoặc bảng điểm</span>
                    <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileUpload} />
                  </label>
                )}
              </div>
              {errors.proofUrl && (
                <span className="mt-1 block text-xs font-medium text-coral-500">{errors.proofUrl.message}</span>
              )}
              {uploadError && (
                <span className="mt-1 block text-xs font-medium text-coral-500">{uploadError}</span>
              )}
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-plum-700">Ghi chú cho Admin (Tùy chọn)</span>
              <textarea
                placeholder="Mô tả hoặc thông tin bổ sung để duyệt nhanh hơn..."
                className="w-full rounded-xl border border-plum-900/10 bg-cream-100 p-3 text-sm text-plum-900 placeholder:text-plum-400 transition-colors focus:border-brand-400/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/25"
                rows={2}
                {...register('note')}
              />
              {errors.note && (
                <span className="mt-1 block text-xs font-medium text-coral-500">{errors.note.message}</span>
              )}
            </label>
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
          {registerMutation.isPending || googleRegisterMutation.isPending ? 'Đang đăng ký...' : 'Đăng ký tài khoản'}
        </Button>
      </form>

      {!googleData && (
        <>
          <div className="my-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-plum-900/[0.06]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-plum-300">hoặc</span>
            <span className="h-px flex-1 bg-plum-900/[0.06]" />
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

      <p className="mt-8 text-center text-sm text-plum-500">
        Đã có tài khoản?{' '}
        <Link to="/login" className="font-bold text-brand-600 hover:text-brand-700 transition-colors">
          Đăng nhập ngay
        </Link>
      </p>
    </>
  )
}
