import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AuthScaffold, RegisterForm, OtpVerification } from '@/features/auth'

export function RegisterPage() {
  const location = useLocation()
  const googleData = location.state?.googleData as { email: string; fullName: string; token: string } | undefined

  const [step, setStep] = useState<'form' | 'verify'>('form')
  const [registeredData, setRegisteredData] = useState<{ email: string; role: 'STUDENT' | 'ALUMNI' } | null>(null)

  return (
    <AuthScaffold>
      {step === 'form' ? (
        <RegisterForm
          googleData={googleData}
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
