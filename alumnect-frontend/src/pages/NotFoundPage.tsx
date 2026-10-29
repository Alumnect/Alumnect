import { Home } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ButtonLink } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { AuroraBackground, Starfield } from '@/components/motion'

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-ink-900 px-6 text-center">
      <AuroraBackground />
      <Starfield count={40} />
      <div className="relative">
        <Logo className="mx-auto mb-10" />
        <p className="text-[7rem] font-extrabold leading-none text-gradient sm:text-[10rem]">404</p>
        <h1 className="mt-2 text-2xl font-extrabold text-text sm:text-3xl">{t('common.notFoundTitle')}</h1>
        <p className="mx-auto mt-3 max-w-md text-text-subtle">
          {t('common.notFoundDesc')}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink to="/app" variant="primary" size="lg" leftIcon={<Home size={18} />}>
            {t('common.backToFeed')}
          </ButtonLink>
        </div>
      </div>
    </div>
  )
}
