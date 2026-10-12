import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/app'
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-coral-100 text-coral-600 dark:bg-coral-950/40 dark:text-coral-400">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h2 className="mt-4 font-heading text-xl font-extrabold text-plum-900 dark:text-[#e4e6eb]">
            Đã có sự cố xảy ra khi tải trang
          </h2>
          <p className="mt-2 max-w-md text-xs text-plum-600 sm:text-sm dark:text-[#b0b3b8]">
            Hệ thống gặp lỗi không mong muốn trong khi hiển thị nội dung. Bạn có thể thử tải lại trang hoặc quay về trang chủ.
          </p>
          {this.state.error?.message && (
            <div className="mt-3 max-w-lg rounded-xl border border-plum-900/10 bg-plum-50/50 px-3.5 py-2 text-left font-mono text-[11px] text-plum-700 dark:border-[#393a3b] dark:bg-[#2b2c2d] dark:text-[#c0c2c6]">
              {this.state.error.message}
            </div>
          )}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-brand-700 active:scale-95 cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Tải lại trang</span>
            </button>
            <button
              type="button"
              onClick={this.handleGoHome}
              className="inline-flex items-center gap-2 rounded-2xl border border-plum-900/10 bg-white px-5 py-2.5 text-xs font-bold text-plum-700 shadow-2xs transition-all hover:bg-brand-50 hover:text-brand-700 dark:border-[#393a3b] dark:bg-[#2b2c2d] dark:text-[#e4e6eb] cursor-pointer"
            >
              <Home className="h-4 w-4" />
              <span>Về Trang chủ</span>
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
