import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { AuthScaffold, Field, GoogleButton, useLogin, loginSchema } from '@/features/auth'
import type { LoginInput } from '@/features/auth'
import { Button } from '@/components/ui/Button'

export function LoginPage() {
  const [show, setShow] = useState(false)
  const loginM = useLogin()
  const location = useLocation()
  const successMessage = location.state?.successMessage as string | undefined

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
      <h2 className="text-3xl font-extrabold text-plum-900">Welcome back</h2>
      <p className="mt-2 text-sm text-plum-500">Sign in to reconnect with your network.</p>

      {successMessage && (
        <div className="mt-4 rounded-xl bg-teal-50 border border-teal-200/50 p-3 text-xs text-teal-700 flex items-start gap-2 animate-pop">
          <svg className="h-4 w-4 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l5-5z" clipRule="evenodd" />
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

      <form className="mt-8 space-y-4" onSubmit={handleSubmit((v) => loginM.mutate(v))} noValidate>
        <Field
          label="Email"
          type="email"
          placeholder="you@fpt.edu.vn"
          icon={<Mail size={16} />}
          error={errors.email?.message}
          {...register('email')}
        />
        <Field
          label="Password"
          type={show ? 'text' : 'password'}
          placeholder="••••••••"
          icon={<Lock size={16} />}
          error={errors.password?.message}
          trailing={
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="grid h-8 w-8 place-items-center rounded-lg text-plum-400 hover:bg-plum-900/[0.05] hover:text-plum-900"
              aria-label="Toggle password"
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
          {...register('password')}
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-plum-500">
            <input type="checkbox" className="h-4 w-4 rounded border-plum-900/20 accent-brand-500" {...register('remember')} />
            Remember me
          </label>
          <Link to="/forgot-password" className="font-semibold text-brand-600 hover:text-brand-700">
            Forgot password?
          </Link>
        </div>

        {loginM.isError && (
          <p className="rounded-lg bg-coral-300/30 px-3 py-2 text-sm font-medium text-coral-700">
            {(loginM.error as Error).message}
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={loginM.isPending}
          rightIcon={<ArrowRight size={18} />}
        >
          {loginM.isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-plum-900/10" />
        <span className="text-xs font-semibold uppercase tracking-wider text-plum-400">or</span>
        <span className="h-px flex-1 bg-plum-900/10" />
      </div>

      <GoogleButton label="Continue with Google" />

      <p className="mt-8 text-center text-sm text-plum-500">
        New to AlumNect?{' '}
        <Link to="/register" className="font-bold text-brand-600 hover:text-brand-700">
          Create an account
        </Link>
      </p>
    </AuthScaffold>
  )
}
