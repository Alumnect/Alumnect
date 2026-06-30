import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { User, Mail, Lock, Eye, EyeOff, GraduationCap, Users, ArrowRight, BadgeCheck } from 'lucide-react'
import { AuthScaffold, Field, GoogleButton, useRegister, registerSchema } from '@/features/auth'
import type { RegisterInput } from '@/features/auth'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const ROLES: { key: RegisterInput['role']; label: string; desc: string; icon: typeof Users }[] = [
  { key: 'STUDENT', label: 'Student', desc: 'Current FPTU student', icon: Users },
  { key: 'ALUMNI', label: 'Alumni', desc: 'FPTU graduate', icon: GraduationCap },
]

export function RegisterPage() {
  const [show, setShow] = useState(false)
  const registerM = useRegister()
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', role: 'ALUMNI', agree: false },
  })
  const role = watch('role')

  return (
    <AuthScaffold>
      <h2 className="text-3xl font-extrabold text-plum-900">Create your account</h2>
      <p className="mt-2 text-sm text-plum-500">Join the verified FPTU alumni community.</p>

      {/* role selector */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        {ROLES.map((r) => {
          const active = role === r.key
          return (
            <button
              key={r.key}
              type="button"
              onClick={() => setValue('role', r.key, { shouldValidate: true })}
              className={cn(
                'relative rounded-2xl border p-4 text-left transition-all',
                active ? 'border-brand-400/60 bg-brand-50 ring-2 ring-brand-500/30' : 'border-plum-900/10 bg-cream-100 hover:border-plum-900/25',
              )}
            >
              <r.icon size={20} className={active ? 'text-brand-600' : 'text-plum-400'} />
              <p className="mt-2 text-sm font-bold text-plum-900">{r.label}</p>
              <p className="text-xs text-plum-500">{r.desc}</p>
              {active && <BadgeCheck size={16} className="absolute right-3 top-3 text-brand-500" />}
            </button>
          )
        })}
      </div>

      <form className="mt-5 space-y-4" onSubmit={handleSubmit((v) => registerM.mutate(v))} noValidate>
        <Field label="Full name" placeholder="Nguyễn Văn A" icon={<User size={16} />} error={errors.name?.message} {...register('name')} />
        <Field label="Email" type="email" placeholder="you@fpt.edu.vn" icon={<Mail size={16} />} error={errors.email?.message} {...register('email')} />
        <Field
          label="Password"
          type={show ? 'text' : 'password'}
          placeholder="At least 8 characters"
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

        {role === 'ALUMNI' && (
          <div className="rounded-xl border border-gold-400/30 bg-gold-300/20 p-3 text-xs text-gold-700">
            <BadgeCheck size={14} className="mb-1 inline" /> After signing up you'll submit FPTU proof
            (graduation year, student ID, evidence) for admin verification to earn the verified badge.
          </div>
        )}

        <div>
          <label className="flex items-start gap-2 text-xs text-plum-500">
            <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-plum-900/20 accent-brand-500" {...register('agree')} />
            I agree to the <a href="#" className="text-brand-600">Terms</a> and{' '}
            <a href="#" className="text-brand-600">Community Standards</a>.
          </label>
          {errors.agree && <span className="mt-1 block text-xs font-medium text-coral-600">{errors.agree.message}</span>}
        </div>

        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={registerM.isPending} rightIcon={<ArrowRight size={18} />}>
          {registerM.isPending ? 'Creating…' : 'Create account'}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-plum-900/10" />
        <span className="text-xs font-semibold uppercase tracking-wider text-plum-400">or</span>
        <span className="h-px flex-1 bg-plum-900/10" />
      </div>

      <GoogleButton label="Sign up with Google" />

      <p className="mt-8 text-center text-sm text-plum-500">
        Already have an account?{' '}
        <Link to="/login" className="font-bold text-brand-600 hover:text-brand-700">
          Sign in
        </Link>
      </p>
    </AuthScaffold>
  )
}
