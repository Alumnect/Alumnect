import { Home, ArrowLeft } from 'lucide-react'
import { ButtonLink } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { AuroraBackground, Starfield } from '@/components/motion'

export function NotFoundPage() {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-ink-900 px-6 text-center">
      <AuroraBackground />
      <Starfield count={40} />
      <div className="relative">
        <Logo className="mx-auto mb-10" />
        <p className="text-[7rem] font-extrabold leading-none text-gradient sm:text-[10rem]">404</p>
        <h1 className="mt-2 text-2xl font-extrabold text-plum-900 sm:text-3xl">This page got lost in the network</h1>
        <p className="mx-auto mt-3 max-w-md text-plum-500">
          The page you're looking for doesn't exist or has moved. Let's get you back home.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink to="/" variant="primary" size="lg" leftIcon={<Home size={18} />}>
            Back to home
          </ButtonLink>
          <ButtonLink to="/app" variant="glass" size="lg" leftIcon={<ArrowLeft size={18} />}>
            Go to feed
          </ButtonLink>
        </div>
      </div>
    </div>
  )
}
