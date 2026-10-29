import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react'
import { AuthScaffold, Field, GoogleButton, useLogin, loginSchema } from '@/features/auth'
import type { LoginInput } from '@/features/auth'
import { Button } from '@/components/ui/Button'
import { useTranslation } from 'react-i18next'

export function LoginPage() {
  const { t } = useTranslation()
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
      <h1 className="text-3xl font-extrabold text-text">{t('auth.welcomeBack')}</h1>
      <p className="mt-2 text-sm text-text-subtle">{t('auth.loginSubtitle')}</p>

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
          label={t('auth.email')}
          type="email"
          placeholder="ten@fpt.edu.vn"
          icon={<Mail size={16} />}
          error={errors.email?.message}
          {...register('email')}
        />
        <Field
          label={t('auth.password')}
          type={show ? 'text' : 'password'}
          placeholder="••••••••"
          icon={<Lock size={16} />}
          error={errors.password?.message}
          trailing={
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="flex h-6 w-6 items-center justify-center text-text-subtle hover:text-text-muted transition-colors cursor-pointer"
              aria-label="Ẩn hiện mật khẩu"
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
          {...register('password')}
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex min-h-7 cursor-pointer items-center gap-2 text-text-muted">
            <input type="checkbox" className="h-4 w-4 rounded border-border-strong accent-brand-500" {...register('remember')} />
            {t('auth.rememberMe')}
          </label>
          <Link to="/forgot-password" className="inline-flex min-h-7 items-center font-semibold text-primary-solid hover:underline">
            {t('auth.forgotPassword')}
          </Link>
        </div>

        {loginM.isError && (
          <div
            role="alert"
            className="flex items-center gap-2.5 rounded-xl border border-danger-border bg-danger-soft p-3 text-xs font-semibold text-danger animate-pop"
          >
            <AlertCircle size={16} className="shrink-0 text-danger" />
            <span className="text-danger font-medium">{(loginM.error as Error).message}</span>
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={loginM.isPending}
          rightIcon={<ArrowRight size={18} />}
        >
          {loginM.isPending ? t('auth.loggingIn') : t('common.login')}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-surface-3" />
        <span className="text-xs font-semibold uppercase tracking-wider text-text-subtle">{t('common.or')}</span>
        <span className="h-px flex-1 bg-surface-3" />
      </div>

      <GoogleButton label={t('auth.continueWithGoogle')} />

      <p className="mt-8 text-center text-sm text-text-subtle">
        {t('auth.dontHaveAccount')}{' '}
        <Link to="/register" className="font-bold text-primary-solid hover:text-primary-solid">
          {t('auth.registerNow')}
        </Link>
      </p>
    </AuthScaffold>
  )
}
