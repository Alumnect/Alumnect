import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { GoogleLogin } from '@react-oauth/google'
import { AuthScaffold, Field, useLogin, useGoogleLogin, loginSchema } from '@/features/auth'
import type { LoginInput } from '@/features/auth'

export function LoginPage() {
  const [show, setShow] = useState(false)
  const loginM = useLogin()
  const googleLoginM = useGoogleLogin()
  const location = useLocation()
  const successMessage = location.state?.successMessage as string | undefined

  // Xử lý khi Google đăng nhập thành công
  const handleGoogleSuccess = (credentialResponse: any) => {
    if (credentialResponse.credential) {
      googleLoginM.mutate(credentialResponse.credential)
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: false },
  })

  return (
    <AuthScaffold>
      <div className="mb-6">
        <p className="text-sm text-gray-500 mb-1">Chào mừng quay trở lại</p>
        <h2 className="text-3xl font-bold text-gray-900">Đăng nhập</h2>
      </div>

      {successMessage && (
        <div className="mb-6 rounded-xl bg-teal-50 border border-teal-200/50 p-3 text-xs text-teal-700 flex items-start gap-2 animate-pop">
          <svg className="h-4 w-4 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l5-5z" clipRule="evenodd" />
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Social Login Buttons */}
      <div className="flex justify-center mb-6">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => console.error('Google Login Failed')}
          useOneTap
          shape="rectangular"
          theme="outline"
          text="signin_with"
          size="large"
        />
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-gray-500">Hoặc</span>
        </div>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit((v) => loginM.mutate(v))} noValidate>
        <Field
          label="Email"
          type="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Field
          label="Mật khẩu"
          type={show ? 'text' : 'password'}
          error={errors.password?.message}
          trailing={
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="grid h-8 w-8 place-items-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              aria-label="Toggle password"
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
          {...register('password')}
        />

        <div className="flex items-center justify-between text-sm mt-1">
          <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
            <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-[#F27024] focus:ring-[#F27024]" {...register('remember')} />
            Ghi nhớ
          </label>
          <Link to="/forgot-password" className="text-gray-600 hover:text-[#F27024]">
            Quên mật khẩu?
          </Link>
        </div>

        {loginM.isError && (
          <p className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">
            {(loginM.error as Error).message}
          </p>
        )}

        <button
          type="submit"
          disabled={loginM.isPending}
          className="w-full rounded-full bg-gradient-to-r from-[#F75512] to-[#F27024] px-4 py-3 text-sm font-bold text-white shadow-[0_8px_20px_-6px_rgba(242,112,36,0.5)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-8px_rgba(242,112,36,0.65)] disabled:opacity-70 disabled:pointer-events-none mt-4"
        >
          {loginM.isPending ? 'Đang xử lý...' : 'Đăng nhập'}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-gray-600">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="font-bold text-gray-900 hover:text-[#F27024]">
          ĐĂNG KÝ NGAY
        </Link>
      </p>
    </AuthScaffold>
  )
}
