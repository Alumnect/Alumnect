import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { AuthScaffold, Field } from '@/features/auth'
import { Button } from '@/components/ui/Button'

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)

  return (
    <AuthScaffold>
      <Link to="/login" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-plum-500 hover:text-plum-900">
        <ArrowLeft size={16} /> Back to sign in
      </Link>

      {sent ? (
        <div className="rounded-2xl card-surface p-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-600">
            <CheckCircle2 size={28} />
          </span>
          <h2 className="mt-5 text-2xl font-extrabold text-plum-900">Check your inbox</h2>
          <p className="mt-2 text-sm text-plum-500">
            If an account exists for that email, we've sent a secure reset link. It expires in 30 minutes.
          </p>
          <Button variant="secondary" size="md" className="mt-6 w-full" onClick={() => setSent(false)}>
            Use a different email
          </Button>
        </div>
      ) : (
        <>
          <h2 className="text-3xl font-extrabold text-plum-900">Forgot password?</h2>
          <p className="mt-2 text-sm text-plum-500">
            Enter your registered email and we'll send you a reset link.
          </p>
          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              setSent(true)
            }}
          >
            <Field label="Email" type="email" name="email" placeholder="you@fpt.edu.vn" icon={<Mail size={16} />} />
            <Button type="submit" variant="primary" size="lg" className="w-full">
              Send reset link
            </Button>
          </form>
        </>
      )}
    </AuthScaffold>
  )
}
