import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useVerifyEmail, useResendOtp } from '../hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui'

interface OtpVerificationProps {
  email: string
  role: 'STUDENT' | 'ALUMNI'
  onBack: () => void
}

export function OtpVerification({ email, onBack }: OtpVerificationProps) {
  const { t } = useTranslation()
  const [otpToken, setOtpToken] = useState('')
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [verifySuccess, setVerifySuccess] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(3)
  const [cooldown, setCooldown] = useState(300) // Khởi động mặc định 5 phút cooldown

  const navigate = useNavigate()

  const verifyEmailMutation = useVerifyEmail()
  const resendOtpMutation = useResendOtp()

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  // Đếm ngược chuyển trang khi xác thực thành công
  useEffect(() => {
    if (!verifySuccess) return
    if (countdown <= 0) {
      navigate('/login')
      return
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [verifySuccess, countdown, navigate])

  // Xác thực mã OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otpToken || otpToken.trim().length !== 6) {
      setVerifyError(t('auth.enterOtp6Digits'))
      return
    }

    setVerifyError(null)
    setVerifySuccess(null)

    try {
      const res = await verifyEmailMutation.mutateAsync({
        email: email,
        token: otpToken.trim(),
      })

      setVerifySuccess(res.message || t('auth.verifyEmailSuccess'))
      setCountdown(3)
      toast.success(t('auth.verifyEmailSuccess'))
    } catch (err: any) {
      setVerifyError(err.message || t('auth.otpIncorrectOrExpired'))
      // Nếu mã bị khóa do nhập sai quá 5 lần, reset cooldown về 0 để cho phép gửi lại ngay lập tức
      if (err.message && (err.message.includes('bị khóa') || err.message.includes('5 lần'))) {
        setCooldown(0)
      }
    }
  }

  // Gửi lại mã OTP
  const handleResendOtp = async () => {
    setVerifyError(null)
    setVerifySuccess(null)

    try {
      const res = await resendOtpMutation.mutateAsync(email)
      toast.success(res.message || t('auth.resendOtpNewSuccess'))
      setCooldown(300) // Reset cooldown 5 phút
    } catch (err: any) {
      setVerifyError(err.message || t('auth.resendOtpNewError'))
    }
  }

  // Màn hình chuyển hướng thành công khi hoàn tất xác thực
  if (verifySuccess) {
    return (
      <div className="animate-pop text-center py-4 space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success-soft text-success border border-success-border shadow-inner">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [1.25, 1], opacity: 1 }}
            transition={{ duration: 0.45, type: 'spring', bounce: 0.55 }}
          >
            <CheckCircle2 size={46} className="text-success" />
          </motion.div>
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-text tracking-tight">
            {t('auth.verifyEmailSuccess')}
          </h1>
          <p className="mt-2 text-sm text-text-muted leading-relaxed max-w-sm mx-auto">
            {verifySuccess}
          </p>
        </div>

        {/* Khối loading chuyển trang kèm thanh tiến trình */}
        <div className="rounded-2xl bg-surface-2 p-4 border border-border text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-text-muted">
            <Loader2 size={15} className="animate-spin text-primary-solid" />
            <span>
              {t('auth.redirectingToLogin', { seconds: countdown })}
            </span>
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
            <motion.div
              className="h-full bg-primary-solid rounded-full"
              initial={{ width: '100%' }}
              animate={{ width: `${(countdown / 3) * 100}%` }}
              transition={{ duration: 1, ease: 'linear' }}
            />
          </div>
        </div>

        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={() => navigate('/login')}
          className="w-full"
          rightIcon={<ArrowRight size={18} />}
        >
          {t('auth.loginNow')}
        </Button>
      </div>
    )
  }

  return (
    <div className="animate-pop">
      <button 
        type="button" 
        onClick={onBack}
        className="inline-flex items-center gap-1 text-xs font-bold text-primary-solid hover:text-primary-solid mb-6 group transition-colors"
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" /> 
        {t('auth.backToEditInfo')}
      </button>
      
      <h1 className="text-3xl font-extrabold text-text tracking-tight">{t('auth.verifyEmailTitle')}</h1>
      <p className="mt-2 text-sm text-text-subtle leading-relaxed">
        {t('auth.otpSentNoticePrefix')} <strong className="text-text">{email}</strong>. {t('auth.otpSentNoticeSuffix')}
      </p>

      {verifyError && (
        <div className="mt-4 rounded-xl bg-danger-soft border border-danger-border p-3 text-xs text-danger flex items-start gap-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{verifyError}</span>
        </div>
      )}

      <form className="mt-6 space-y-4" onSubmit={handleVerifyOtp} noValidate>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-text-muted">{t('auth.otpInputLabel')}</span>
          <input
            type="text"
            placeholder="123456"
            maxLength={6}
            value={otpToken}
            disabled={verifyEmailMutation.isPending}
            onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ''))}
            className="h-12 w-full tracking-[0.5em] text-center font-mono font-bold text-lg rounded-xl border border-border bg-surface-2 px-4 text-text placeholder:text-plum-300 focus:border-brand-400/60 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-500/25 disabled:opacity-60 disabled:cursor-not-allowed"
            required
          />
        </label>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-2"
          disabled={verifyEmailMutation.isPending || otpToken.trim().length !== 6}
          rightIcon={verifyEmailMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight size={18} />}
        >
          {verifyEmailMutation.isPending ? t('auth.verifyingText') : t('auth.verifyAccountBtn')}
        </Button>
      </form>

      <div className="mt-6 flex flex-col items-center justify-center gap-2">
        {cooldown > 0 ? (
          <p className="text-xs text-text-subtle">
            {t('auth.resendOtpAfter')}{' '}
            <span className="font-semibold text-primary-solid">
              {t('auth.minutesAndSeconds', { minutes: Math.floor(cooldown / 60), seconds: cooldown % 60 })}
            </span>
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={resendOtpMutation.isPending}
            className="text-xs font-bold text-primary-solid hover:text-primary-solid transition-colors disabled:opacity-50"
          >
            {resendOtpMutation.isPending ? t('auth.sendingText') : t('auth.resendNewOtpBtn')}
          </button>
        )}
      </div>
    </div>
  )
}
