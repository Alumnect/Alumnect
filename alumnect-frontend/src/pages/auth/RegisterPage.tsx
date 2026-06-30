import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Lock, Eye, EyeOff, GraduationCap, Users, ArrowRight, BadgeCheck } from 'lucide-react'
import { AuthScaffold, Field, GoogleButton } from '@/features/auth'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

type Role = 'student' | 'alumni'

export function RegisterPage() {
  const [show, setShow] = useState(false)
  const [role, setRole] = useState<Role>('alumni')
  const navigate = useNavigate()

  const roles: { key: Role; label: string; desc: string; icon: typeof Users }[] = [
    { key: 'student', label: 'Student', desc: 'Current FPTU student', icon: Users },
    { key: 'alumni', label: 'Alumni', desc: 'FPTU graduate', icon: GraduationCap },
  ]

  return (
    <AuthScaffold>
      <h2 className="text-3xl font-extrabold text-plum-900">Create your account</h2>
      <p className="mt-2 text-sm text-plum-500">Join the verified FPTU alumni community.</p>

      {/* role selector */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        {roles.map((r) => {
          const active = role === r.key
          return (
            <button
              key={r.key}
              type="button"
              onClick={() => setRole(r.key)}
              className={cn(
                'relative rounded-2xl border p-4 text-left transition-all',
                active
                  ? 'border-brand-400/60 bg-brand-500/10 ring-2 ring-brand-500/30'
                  : 'border-plum-900/10 bg-plum-900/[0.04] hover:border-plum-900/25',
              )}
            >
              <r.icon size={20} className={active ? 'text-brand-600' : 'text-plum-400'} />
              <p className="mt-2 text-sm font-bold text-plum-900">{r.label}</p>
              <p className="text-xs text-plum-400">{r.desc}</p>
              {active && <BadgeCheck size={16} className="absolute right-3 top-3 text-brand-400" />}
            </button>
          )
        })}
      </div>

      <form
        className="mt-5 space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          navigate('/login')
        }}
      >
        <Field label="Full name" name="name" placeholder="Nguyễn Văn A" icon={<User size={16} />} />
        <Field label="Email" type="email" name="email" placeholder="you@fpt.edu.vn" icon={<Mail size={16} />} />
        <Field
          label="Password"
          type={show ? 'text' : 'password'}
          name="password"
          placeholder="At least 8 characters"
          icon={<Lock size={16} />}
          trailing={
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="grid h-8 w-8 place-items-center rounded-lg text-plum-400 hover:bg-plum-900/[0.06] hover:text-plum-900"
              aria-label="Toggle password"
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        {role === 'alumni' && (
          <div className="rounded-xl border border-gold-400/20 bg-gold-400/5 p-3 text-xs text-gold-600/90">
            <BadgeCheck size={14} className="mb-1 inline" /> After signing up you'll submit FPTU proof
            (graduation year, student ID, evidence) for admin verification to earn the verified badge.
          </div>
        )}

        <label className="flex items-start gap-2 text-xs text-plum-500">
          <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-plum-900/20 bg-plum-900/[0.06] accent-brand-500" />
          I agree to the <a href="#" className="text-brand-600">Terms</a> and{' '}
          <a href="#" className="text-brand-600">Community Standards</a>.
        </label>

        <Button type="submit" variant="primary" size="lg" className="w-full" rightIcon={<ArrowRight size={18} />}>
          Create account
        </Button>
      </form>

      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-plum-900/[0.06]" />
        <span className="text-xs font-semibold uppercase tracking-wider text-plum-300">or</span>
        <span className="h-px flex-1 bg-plum-900/[0.06]" />
      </div>

      <GoogleButton label="Sign up with Google" />

      <p className="mt-8 text-center text-sm text-plum-500">
        Already have an account?{' '}
        <Link to="/login" className="font-bold text-brand-600 hover:text-brand-600">
          Sign in
        </Link>
      </p>
    </AuthScaffold>
  )
}
