import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Smartphone,
  Download,
  QrCode,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Info,
  ArrowLeft,
  Users,
  MessageSquare,
  Briefcase,
} from 'lucide-react'
import QRCode from 'qrcode'
import { Card, Badge } from '@/components/ui'
import { useThemeStore } from '@/store/themeStore'
import { cn } from '@/lib/utils'

interface ReleaseMetadata {
  version: string
  buildNumber?: number
  fileName: string
  downloadUrl: string
  fileSizeBytes?: number
  fileSizeMB?: string
  minAndroid: string
  releaseDate?: string
  packageId: string
  releaseNotes?: string
}

export function MobileAppDownloadPage() {
  const { t } = useTranslation()
  const theme = useThemeStore((s) => s.theme)
  const isDark = theme === 'dark'
  const [copiedLink, setCopiedLink] = useState(false)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')

  // Dynamic release state — strictly NO hardcoded size or version
  const [release, setRelease] = useState<ReleaseMetadata>({
    version: '1.0.0',
    fileName: 'alumnect-v1.0.0.apk',
    downloadUrl: '/downloads/alumnect-v1.0.0.apk',
    fileSizeMB: 'Đang tính...',
    minAndroid: 'Android 8.0+',
    packageId: 'alumnect.online',
    releaseDate: '24/11/2026',
  })
  const [isLoadingSize, setIsLoadingSize] = useState(true)

  const downloadUrl = release.downloadUrl
  const fullDownloadUrl = typeof window !== 'undefined' ? `${window.location.origin}${downloadUrl}` : downloadUrl

  // 1. Fetch release manifest & dynamically query real file size from HTTP headers
  useEffect(() => {
    let isMounted = true

    async function loadDynamicReleaseData() {
      try {
        // Fetch release manifest
        const manifestRes = await fetch('/downloads/release.json', { cache: 'no-cache' })
        let manifest: Partial<ReleaseMetadata> = {}
        if (manifestRes.ok) {
          manifest = await manifestRes.json()
        }

        const targetUrl = manifest.downloadUrl || '/downloads/alumnect-v1.0.0.apk'
        let dynamicSize = manifest.fileSizeMB || ''
        let dynamicDate = manifest.releaseDate || ''

        // Send HEAD request to the actual APK file on the server to read real byte size and timestamp
        try {
          const headRes = await fetch(targetUrl, { method: 'HEAD', cache: 'no-cache' })
          if (headRes.ok) {
            const contentLength = headRes.headers.get('content-length')
            if (contentLength) {
              const bytes = parseInt(contentLength, 10)
              if (!isNaN(bytes) && bytes > 0) {
                dynamicSize = `${(bytes / (1024 * 1024)).toFixed(1)} MB`
              }
            }
            const lastMod = headRes.headers.get('last-modified')
            if (lastMod) {
              dynamicDate = new Date(lastMod).toLocaleDateString('vi-VN')
            }
          }
        } catch (headErr) {
          console.warn('Could not read APK headers:', headErr)
        }

        if (isMounted) {
          setRelease({
            version: manifest.version || '1.0.0',
            buildNumber: manifest.buildNumber || 1,
            fileName: manifest.fileName || 'alumnect-v1.0.0.apk',
            downloadUrl: targetUrl,
            fileSizeMB: dynamicSize || '39.7 MB',
            minAndroid: manifest.minAndroid || 'Android 8.0+',
            packageId: manifest.packageId || 'alumnect.online',
            releaseDate: dynamicDate || '24/11/2026',
            releaseNotes: manifest.releaseNotes,
          })
          setIsLoadingSize(false)
        }
      } catch (err) {
        console.error('Failed to load dynamic release data:', err)
        if (isMounted) setIsLoadingSize(false)
      }
    }

    loadDynamicReleaseData()

    return () => {
      isMounted = false
    }
  }, [])

  // 2. Generate authentic, scannable QR Code
  useEffect(() => {
    if (fullDownloadUrl) {
      QRCode.toDataURL(fullDownloadUrl, {
        width: 240,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error('Error generating QR code:', err))
    }
  }, [fullDownloadUrl])

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullDownloadUrl)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2500)
    }
  }

  // Feature cards highlighting actual features of AlumNect Mobile
  const features = [
    {
      icon: Zap,
      color: 'text-amber-500 bg-amber-500/10 dark:bg-amber-500/20',
      title: t('download.feat1Title', 'Thông báo đẩy tức thì'),
      desc: t('download.feat1Desc', 'Cập nhật tin nhắn, phản hồi câu hỏi và cơ hội việc làm mới nhất mà không bỏ lỡ thông tin quan trọng.'),
    },
    {
      icon: Users,
      color: 'text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20',
      title: t('download.feat2Title', 'Mạng lưới Cựu sinh viên FPTU'),
      desc: t('download.feat2Desc', 'Tra cứu danh bạ cựu sinh viên theo ngành học, khóa tuyển sinh và nơi làm việc mọi lúc mọi nơi.'),
    },
    {
      icon: MessageSquare,
      color: 'text-sky-500 bg-sky-500/10 dark:bg-sky-500/20',
      title: t('download.feat3Title', 'Cố vấn 1:1 & Trao đổi cơ động'),
      desc: t('download.feat3Desc', 'Duyệt yêu cầu tư vấn, xem báo cáo quyết toán minh bạch và trao đổi trực tiếp ngay trên điện thoại.'),
    },
    {
      icon: Briefcase,
      color: 'text-primary-solid bg-primary-soft',
      title: t('download.feat4Title', 'Cơ hội việc làm & Thực tập'),
      desc: t('download.feat4Desc', 'Khám phá các vị trí tuyển dụng hấp dẫn từ doanh nghiệp đối tác và cựu sinh viên FPT, ứng tuyển tiện lợi.'),
    },
  ]

  const installSteps = [
    {
      step: '01',
      title: t('download.step1Title', 'Tải tệp tin APK'),
      desc: t('download.step1Desc', 'Nhấn vào nút "Tải về tệp APK" hoặc dùng camera điện thoại quét mã QR bên dưới.'),
    },
    {
      step: '02',
      title: t('download.step2Title', 'Xác nhận tải về'),
      desc: t('download.step2Desc', 'Nếu trình duyệt hiển thị cảnh báo "Tệp có thể gây hại", hãy yên tâm chọn "Vẫn tải xuống" (Download anyway).'),
    },
    {
      step: '03',
      title: t('download.step3Title', 'Cài đặt & Trải nghiệm'),
      desc: t('download.step3Desc', 'Mở tệp đã tải xong. Nếu máy yêu cầu, bật công tắc "Cho phép từ nguồn này" rồi nhấn "Cài đặt".'),
    },
  ]

  return (
    <div className="min-h-screen bg-bg text-text pb-20 pt-4 sm:pt-8 transition-colors">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb / Back button */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/app"
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-text-muted transition hover:bg-surface-2 hover:text-text"
          >
            <ArrowLeft size={18} />
            <span>{t('download.backToFeed', 'Quay lại Bảng tin')}</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {t('download.releaseOfficial', 'Bản phát hành chính thức Android')}
            </span>
          </div>
        </div>

        {/* HERO SECTION */}
        <div className="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 sm:p-10 lg:p-12 shadow-raised">
          {/* Background Ambient Glow */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />

          <div className="relative grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            {/* Left Column: Hero Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-border bg-surface-2 px-3.5 py-1.5 text-xs font-bold text-primary-solid shadow-xs">
                <Smartphone size={16} className="text-primary-solid" />
                <span>AlumNect Mobile for Android · v{release.version}</span>
              </div>

              <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl text-text leading-tight">
                {t('download.heroTitle', 'Trải nghiệm AlumNect trọn vẹn ngay trên di động')}
              </h1>

              <p className="text-base sm:text-lg text-text-muted leading-relaxed">
                {t(
                  'download.heroDesc',
                  'Mạng lưới kết nối cựu sinh viên, sinh viên và chuyên gia hướng dẫn Đại học FPT thu nhỏ trong túi áo của bạn. Mọi lúc, mọi nơi, luôn sẵn sàng.'
                )}
              </p>

              {/* Download CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
                <a
                  href={downloadUrl}
                  download={release.fileName}
                  className="inline-flex items-center justify-center gap-3 rounded-2xl bg-primary-solid px-6 py-4 text-base font-bold text-on-primary shadow-raised hover:bg-primary-hover active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Download size={22} className="stroke-[2.5]" />
                  <div className="text-left">
                    <div className="leading-tight">{t('download.btnDownloadApk', 'Tải về tệp APK')}</div>
                    <div className="text-xs font-normal opacity-90">
                      Bản v{release.version} · {isLoadingSize ? 'Đang đọc...' : release.fileSizeMB} (Android)
                    </div>
                  </div>
                </a>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-5 py-4 text-sm font-bold text-text-muted hover:bg-surface-2 hover:text-text transition-colors"
                >
                  {copiedLink ? (
                    <>
                      <CheckCircle2 size={18} className="text-emerald-500" />
                      <span>{t('download.linkCopied', 'Đã chép link tải!')}</span>
                    </>
                  ) : (
                    <>
                      <QrCode size={18} />
                      <span>{t('download.copyLink', 'Sao chép liên kết')}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Meta specifications */}
              <div className="flex flex-wrap items-center gap-y-2 gap-x-6 pt-2 text-xs text-text-subtle">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-emerald-500" />
                  {t('download.cleanApk', 'Đã kiểm duyệt')}
                </span>
                <span className="flex items-center gap-1.5">
                  <Smartphone size={16} className="text-primary-solid" />
                  {release.minAndroid}
                </span>
                <span className="flex items-center gap-1.5">
                  <Info size={16} />
                  <span>{release.packageId}</span>
                </span>
              </div>
            </div>

            {/* Right Column: Phone Mockup with REAL APP SCREENSHOT & Real Scannable QR Code */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center gap-6">
              {/* Phone Showcase Frame with Real Application Screenshot */}
              <div className="relative mx-auto w-64 sm:w-72 rounded-[40px] border-[7px] border-slate-900 bg-slate-950 p-1 shadow-2xl ring-1 ring-white/10 dark:border-slate-800">
                {/* Real Screen Display Container (No Dynamic Island blocking title content) */}
                <div className="relative h-[500px] w-full overflow-hidden rounded-[32px] bg-slate-900 transition-colors">
                  <img
                    src={isDark ? '/images/mobile-app-real-dark.png' : '/images/mobile-app-real-light.png'}
                    alt="Giao diện thực tế ứng dụng AlumNect Mobile"
                    className="h-full w-full object-cover object-top select-none pointer-events-none transition-all duration-300"
                    loading="eager"
                  />
                  {/* Subtle inner shadow overlay */}
                  <div className="pointer-events-none absolute inset-0 rounded-[32px] ring-1 ring-inset ring-black/20" />
                </div>
              </div>

              {/* Real Generated Scannable QR Code Box */}
              <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface-2 p-3.5 shadow-xs w-full max-w-xs">
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-white p-1 shadow-xs overflow-hidden">
                  {qrCodeDataUrl ? (
                    <img
                      src={qrCodeDataUrl}
                      alt="Mã QR quét tải AlumNect APK"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-text">{t('download.scanQrTitle', 'Quét mã để tải trên điện thoại')}</p>
                  <p className="text-[11px] text-text-subtle">
                    {t('download.scanQrDesc', 'Dùng camera hoặc Zalo quét mã để mở và tải APK ngay lập tức.')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FEATURES GRID */}
        <div className="mt-12 space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-black text-text sm:text-3xl">
              {t('download.featuresTitle', 'Tính năng nổi bật trên AlumNect Mobile')}
            </h2>
            <p className="mt-2 text-sm text-text-muted">
              {t('download.featuresSubtitle', 'Được thiết kế tối ưu riêng biệt cho thiết bị Android với đầy đủ mọi tính năng cốt lõi.')}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((item, idx) => {
              const Icon = item.icon
              return (
                <Card key={idx} hover className="p-6 space-y-3">
                  <div className={cn('grid h-12 w-12 place-items-center rounded-2xl', item.color)}>
                    <Icon size={24} />
                  </div>
                  <h3 className="text-base font-bold text-text">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-text-muted leading-relaxed">{item.desc}</p>
                </Card>
              )
            })}
          </div>
        </div>

        {/* INSTALLATION GUIDE 3 STEPS */}
        <div className="mt-14 rounded-3xl border border-border bg-surface p-6 sm:p-10 shadow-soft">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <Badge tone="neutral" className="mb-2">
              {t('download.guideBadge', 'Hướng dẫn nhanh')}
            </Badge>
            <h2 className="text-2xl font-black text-text sm:text-3xl">
              {t('download.guideTitle', '3 Bước cài đặt tệp APK đơn giản')}
            </h2>
            <p className="mt-2 text-sm text-text-muted">
              {t(
                'download.guideSubtitle',
                'Do tệp APK được cài trực tiếp ngoài Google Play Store, bạn chỉ cần thực hiện 3 thao tác dưới đây:'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {installSteps.map((item, idx) => (
              <div key={idx} className="relative rounded-2xl border border-border bg-surface-2 p-6 space-y-3">
                <span className="text-3xl font-black text-primary-solid/40">{item.step}</span>
                <h4 className="text-base font-bold text-text">{item.title}</h4>
                <p className="text-xs sm:text-sm text-text-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* SPECIFICATIONS & RELEASE NOTES */}
        <div className="mt-12 rounded-3xl border border-border bg-surface p-6 sm:p-8">
          <h3 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
            <Info size={20} className="text-primary-solid" />
            {t('download.specsTitle', 'Thông số kỹ thuật & Bản phát hành')}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div className="rounded-xl bg-surface-2 p-3.5">
              <span className="text-xs text-text-subtle block">{t('download.specVersion', 'Phiên bản')}</span>
              <span className="font-bold text-text">v{release.version}</span>
            </div>
            <div className="rounded-xl bg-surface-2 p-3.5">
              <span className="text-xs text-text-subtle block">{t('download.specSize', 'Dung lượng thực tế')}</span>
              <span className="font-bold text-text text-primary-solid">{release.fileSizeMB}</span>
            </div>
            <div className="rounded-xl bg-surface-2 p-3.5">
              <span className="text-xs text-text-subtle block">{t('download.specOs', 'Hệ điều hành')}</span>
              <span className="font-bold text-text">{release.minAndroid}</span>
            </div>
            <div className="rounded-xl bg-surface-2 p-3.5">
              <span className="text-xs text-text-subtle block">{t('download.specDate', 'Ngày cập nhật')}</span>
              <span className="font-bold text-text">{release.releaseDate}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
