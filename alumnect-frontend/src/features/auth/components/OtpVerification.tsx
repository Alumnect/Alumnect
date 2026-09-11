import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, ArrowRight, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react'
import { useVerifyEmail, useResendOtp } from '../hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui'

interface OtpVerificationProps {
  email: string
  role: 'STUDENT' | 'ALUMNI'
  onBack: () => void
}

export function OtpVerification({ email, onBack }: OtpVerificationProps) {
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
      setVerifyError('Vui lòng nhập đúng mã OTP 6 chữ số')
      return
    }

    setVerifyError(null)
    setVerifySuccess(null)

    try {
      const res = await verifyEmailMutation.mutateAsync({
        email: email,
        token: otpToken.trim(),
      })

      setVerifySuccess(res.message || 'Xác thực email thành công!')
      setCountdown(3)
      toast.success('Xác thực email thành công!')
    } catch (err: any) {
      setVerifyError(err.message || 'Mã OTP không chính xác hoặc đã hết hạn')
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
      toast.success(res.message || 'Đã gửi lại mã OTP mới!')
      setCooldown(300) // Reset cooldown 5 phút
    } catch (err: any) {
      setVerifyError(err.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại sau.')
    }
  }

  // Màn hình chuyển hướng thành công khi hoàn tất xác thực
  if (verifySuccess) {
    return (
      <div className="animate-pop text-center py-4 space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/80 shadow-inner">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [1.25, 1], opacity: 1 }}
            transition={{ duration: 0.45, type: 'spring', bounce: 0.55 }}
          >
            <CheckCircle2 size={46} className="text-emerald-500" />
          </motion.div>
        </div>

        <div>
          <h2 className="text-2xl font-extrabold text-plum-900 tracking-tight">
            Xác thực email thành công!
          </h2>
          <p className="mt-2 text-sm text-plum-600 leading-relaxed max-w-sm mx-auto">
            {verifySuccess}
          </p>
        </div>

        {/* Khối loading chuyển trang kèm thanh tiến trình */}
        <div className="rounded-2xl bg-cream-100 p-4 border border-plum-900/[0.06] text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-plum-600">
            <Loader2 size={15} className="animate-spin text-brand-600" />
            <span>
              Đang chuyển hướng về trang Đăng nhập trong{' '}
              <strong className="text-brand-600 font-bold">{countdown}s</strong>...
            </span>
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-plum-900/[0.08]">
            <motion.div
              className="h-full bg-brand-500 rounded-full"
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
          Đăng nhập ngay
        </Button>
      </div>
    )
  }

  return (
    <div className="animate-pop">
      <button 
        type="button" 
        onClick={onBack}
        className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 mb-6 group transition-colors"
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" /> 
        Quay lại sửa thông tin
      </button>
      
      <h2 className="text-3xl font-extrabold text-plum-900 tracking-tight">Xác thực Email</h2>
      <p className="mt-2 text-sm text-plum-500 leading-relaxed">
        Chúng tôi đã gửi mã xác thực OTP 6 số đến địa chỉ <strong className="text-plum-900">{email}</strong>. Vui lòng kiểm tra email (cả hòm thư Spam) và nhập mã vào bên dưới.
      </p>

      {verifyError && (
        <div className="mt-4 rounded-xl bg-coral-50 border border-coral-200/50 p-3 text-xs text-coral-600 flex items-start gap-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{verifyError}</span>
        </div>
      )}

      <form className="mt-6 space-y-4" onSubmit={handleVerifyOtp} noValidate>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-plum-700">Mã xác thực OTP (6 chữ số)</span>
          <input
            type="text"
            placeholder="123456"
            maxLength={6}
            value={otpToken}
            disabled={verifyEmailMutation.isPending}
            onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ''))}
            className="h-12 w-full tracking-[0.5em] text-center font-mono font-bold text-lg rounded-xl border border-plum-900/10 bg-cream-100 px-4 text-plum-900 placeholder:text-plum-300 focus:border-brand-400/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/25 disabled:opacity-60 disabled:cursor-not-allowed"
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
          {verifyEmailMutation.isPending ? 'Đang xác thực...' : 'Xác thực tài khoản'}
        </Button>
      </form>

      <div className="mt-6 flex flex-col items-center justify-center gap-2">
        {cooldown > 0 ? (
          <p className="text-xs text-plum-400">
            Gửi lại mã OTP sau: <span className="font-semibold text-brand-600">{Math.floor(cooldown / 60)} phút {cooldown % 60} giây</span>
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={resendOtpMutation.isPending}
            className="text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors disabled:opacity-50"
          >
            {resendOtpMutation.isPending ? 'Đang gửi...' : 'Gửi lại mã OTP mới'}
          </button>
        )}
      </div>
    </div>
  )
}
