import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useVerifyEmail, useResendOtp } from '../hooks/useAuth'
import { Button } from '@/components/ui/Button'

interface OtpVerificationProps {
  email: string
  role: 'STUDENT' | 'ALUMNI'
  onBack: () => void
}

export function OtpVerification({ email, role, onBack }: OtpVerificationProps) {
  const [otpToken, setOtpToken] = useState('')
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [verifySuccess, setVerifySuccess] = useState<string | null>(null)
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

      setVerifySuccess(res.message)

      // Đợi 3 giây rồi điều hướng về trang đăng nhập
      setTimeout(() => {
        navigate('/login')
      }, 3000)
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
      setVerifySuccess(res.message)
      setCooldown(300) // Reset cooldown 5 phút
    } catch (err: any) {
      setVerifyError(err.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại sau.')
    }
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

      {verifySuccess && (
        <div className="mt-4 rounded-xl bg-mint-50 border border-mint-200/50 p-3 text-xs text-mint-700 flex items-start gap-2">
          <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
          <span>{verifySuccess}</span>
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
            onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ''))}
            className="h-12 w-full tracking-[0.5em] text-center font-mono font-bold text-lg rounded-xl border border-plum-900/10 bg-cream-100 px-4 text-plum-900 placeholder:text-plum-300 focus:border-brand-400/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/25"
            required
          />
        </label>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-2"
          disabled={verifyEmailMutation.isPending}
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
