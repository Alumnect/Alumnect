import { useState } from 'react'
import { AuthScaffold, RegisterForm, OtpVerification } from '@/features/auth'

export function RegisterPage() {
  const [step, setStep] = useState<'form' | 'verify'>('form')
  const [registeredData, setRegisteredData] = useState<{ email: string; role: 'STUDENT' | 'ALUMNI' } | null>(null)

  return (
    <AuthScaffold>
      {step === 'form' ? (
        <RegisterForm
          onSuccess={(email, role) => {
            setRegisteredData({ email, role })
            setStep('verify')
          }}
        />
      ) : (
        registeredData && (
          <OtpVerification
            email={registeredData.email}
            role={registeredData.role}
            onBack={() => setStep('form')}
          />
        )
      )}
    </AuthScaffold>
  )
}
