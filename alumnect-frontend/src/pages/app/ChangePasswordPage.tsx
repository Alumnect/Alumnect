import { Reveal } from '@/components/motion'
import { ChangePasswordForm } from '@/features/user/components/ChangePasswordForm'

export function ChangePasswordPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Reveal>
        <div className="flex justify-center">
          <ChangePasswordForm />
        </div>
      </Reveal>
    </div>
  )
}
