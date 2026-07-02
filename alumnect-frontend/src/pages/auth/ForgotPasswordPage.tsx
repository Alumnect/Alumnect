import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { AuthScaffold, Field, useForgotPassword, forgotSchema } from '@/features/auth'
import type { ForgotInput } from '@/features/auth'
import { Button } from '@/components/ui/Button'

export function ForgotPasswordPage() {
  const forgotM = useForgotPassword()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ForgotInput>({ resolver: zodResolver(forgotSchema), defaultValues: { email: '' } })

  return (
    <AuthScaffold>
      <Link to="/login" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-plum-500 hover:text-plum-900">
        <ArrowLeft size={16} /> Back to sign in
      </Link>

      {forgotM.isSuccess ? (
        <div className="rounded-3xl card-surface p-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-mint-300/50 text-mint-700">
            <CheckCircle2 size={28} />
          </span>
          <h2 className="mt-5 text-2xl font-extrabold text-plum-900">Check your inbox</h2>
          <p className="mt-2 text-sm text-plum-500">
            If an account exists for that email, we've sent a secure reset link. It expires in 30 minutes.
          </p>
          <Button
            variant="secondary"
            size="md"
            className="mt-6 w-full"
            onClick={() => {
              forgotM.reset()
              reset()
            }}
          >
            Use a different email
          </Button>
        </div>
      ) : (
        <>
          <h2 className="text-3xl font-extrabold text-plum-900">Forgot password?</h2>
          <p className="mt-2 text-sm text-plum-500">Enter your registered email and we'll send you a reset link.</p>
          <form className="mt-8 space-y-4" onSubmit={handleSubmit((v) => forgotM.mutate(v))} noValidate>
            <Field label="Email" type="email" placeholder="you@fpt.edu.vn" icon={<Mail size={16} />} error={errors.email?.message} {...register('email')} />
            <Button type="submit" variant="primary" size="lg" className="w-full" disabled={forgotM.isPending}>
              {forgotM.isPending ? 'Sending…' : 'Send reset link'}
            </Button>
          </form>
        </>
      )}
    </AuthScaffold>
  )
}
