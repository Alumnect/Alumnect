import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import i18n from '@/i18n'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo)
    this.setState({ errorInfo })
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
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-soft text-danger">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h2 className="mt-4 font-heading text-xl font-extrabold text-text">
            {i18n.t('common.errorBoundaryTitle')}
          </h2>
          <p className="mt-2 max-w-md text-xs text-text-muted sm:text-sm">
            {i18n.t('common.errorBoundaryDesc')}
          </p>
          {this.state.error?.message && (
            <div className="mt-3 max-w-2xl w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2 text-left font-mono text-xs text-text-muted dark:text-[#c0c2c6]">
              <div className="font-bold text-danger">{this.state.error.message}</div>
              {this.state.errorInfo?.componentStack && (
                <pre className="mt-2 text-xs text-text-subtle overflow-x-auto whitespace-pre-wrap max-h-40">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>
          )}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary-solid px-5 py-2.5 text-xs font-bold text-on-primary shadow-xs transition hover:bg-primary-hover active:scale-95 cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              <span>{i18n.t('common.reloadPage')}</span>
            </button>
            <button
              type="button"
              onClick={this.handleGoHome}
              className="inline-flex items-center gap-2 rounded-2xl border border-border bg-surface px-5 py-2.5 text-xs font-bold text-text-muted shadow-2xs transition hover:bg-primary-soft hover:text-primary-solid cursor-pointer"
            >
              <Home className="h-4 w-4" />
              <span>{i18n.t('common.goHome')}</span>
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
