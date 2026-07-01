import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { AuthScaffold, Field, GoogleButton } from '@/features/auth'
import { Button } from '@/components/ui/Button'

export function LoginPage() {
  const [show, setShow] = useState(false)
  const navigate = useNavigate()

  return (
    <AuthScaffold>
      <h2 className="text-3xl font-extrabold text-plum-900">Welcome back</h2>
      <p className="mt-2 text-sm text-plum-500">Sign in to reconnect with your network.</p>

      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          navigate('/app')
        }}
      >
        <Field label="Email" type="email" name="email" placeholder="you@fpt.edu.vn" icon={<Mail size={16} />} />
        <Field
          label="Password"
          type={show ? 'text' : 'password'}
          name="password"
          placeholder="••••••••"
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

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-plum-500">
            <input type="checkbox" className="h-4 w-4 rounded border-plum-900/20 bg-plum-900/[0.06] accent-brand-500" />
            Remember me
          </label>
          <Link to="/forgot-password" className="font-semibold text-brand-600 hover:text-brand-600">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" variant="primary" size="lg" className="w-full" rightIcon={<ArrowRight size={18} />}>
          Sign in
        </Button>
      </form>

      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-plum-900/[0.06]" />
        <span className="text-xs font-semibold uppercase tracking-wider text-plum-300">or</span>
        <span className="h-px flex-1 bg-plum-900/[0.06]" />
      </div>

      <GoogleButton label="Continue with Google" />

      <p className="mt-8 text-center text-sm text-plum-500">
        New to AlumNect?{' '}
        <Link to="/register" className="font-bold text-brand-600 hover:text-brand-600">
          Create an account
        </Link>
      </p>
    </AuthScaffold>
  )
}
