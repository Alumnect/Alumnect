import { create } from 'zustand'
import { motion, AnimatePresence } from 'framer-motion'
import { TRANSITION } from '@/lib/motion'
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X, Bell } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'notification'

export interface ToastItem {
  id: string
  type: ToastType
  message: string
  duration?: number
  actions?: ToastAction[]
}

export interface ToastAction {
  label: string
  onClick: () => void | Promise<void>
  variant?: 'primary' | 'secondary'
}

interface ToastStore {
  toasts: ToastItem[]
  addToast: (type: ToastType, message: string, duration?: number, actions?: ToastAction[]) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (type, message, duration = 4000, actions) => {
    const id = Math.random().toString(36).substring(2, 9)
    set((state) => ({
      toasts: [...state.toasts, { id, type, message, duration, actions }],
    }))

    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }))
      }, duration)
    }
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}))

/** Tiện ích gọi nhanh thông báo trên toàn hệ thống */
export const toast = {
  success: (message: string, duration?: number) =>
    useToastStore.getState().addToast('success', message, duration),
  error: (message: string, duration?: number) =>
    useToastStore.getState().addToast('error', message, duration),
  info: (message: string, duration?: number) =>
    useToastStore.getState().addToast('info', message, duration),
  warning: (message: string, duration?: number) =>
    useToastStore.getState().addToast('warning', message, duration),
  notification: (message: string, duration?: number, actions?: ToastAction[]) =>
    useToastStore.getState().addToast('notification', message, duration, actions),
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-3 z-[99999] mx-auto flex w-full max-w-sm flex-col gap-2.5 px-3 sm:inset-x-auto sm:right-5 sm:top-5 sm:px-0"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((item) => {
          const config = {
            success: { icon: CheckCircle2, border: 'border-success-border', iconClass: 'bg-success-soft text-success' },
            error: { icon: AlertCircle, border: 'border-danger-border', iconClass: 'bg-danger-soft text-danger' },
            warning: { icon: AlertTriangle, border: 'border-warning-border', iconClass: 'bg-warning-soft text-warning' },
            info: { icon: Info, border: 'border-info-border', iconClass: 'bg-info-soft text-info' },
            notification: { icon: Bell, border: 'border-primary-soft-border', iconClass: 'bg-primary-soft text-primary-solid' },
          }[item.type]

          const Icon = config.icon

          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.95, transition: TRANSITION.exit }}
              transition={TRANSITION.pop}
              className={`pointer-events-auto flex items-start gap-3 rounded-2xl border bg-surface p-3.5 text-text shadow-overlay ${config.border}`}
            >
              <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${config.iconClass}`}>
                <Icon size={18} />
              </div>
              <div className="flex-1 pt-0.5">
                <p className="break-words text-sm font-semibold leading-relaxed text-text">{item.message}</p>
                {item.actions && item.actions.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {item.actions.map((action) => (
                      <button
                        key={action.label}
                        type="button"
                        onClick={() => {
                          removeToast(item.id)
                          void action.onClick()
                        }}
                        className={action.variant === 'secondary'
                          ? 'rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-bold text-text-muted hover:bg-surface-2'
                          : 'rounded-lg bg-primary-solid px-3 py-1.5 text-xs font-bold text-on-primary hover:brightness-95'}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeToast(item.id)}
                aria-label="Đóng thông báo"
                className="-m-1.5 grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-lg text-text-subtle transition-colors hover:bg-surface-2 hover:text-text"
              >
                <X size={14} />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
