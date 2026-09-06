import { create } from 'zustand'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastItem {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastStore {
  toasts: ToastItem[]
  addToast: (type: ToastType, message: string, duration?: number) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (type, message, duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9)
    set((state) => ({
      toasts: [...state.toasts, { id, type, message, duration }],
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
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed top-5 right-5 z-[99999] flex max-w-sm w-full flex-col gap-2.5 px-3 sm:px-0"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((item) => {
          const config = {
            success: {
              icon: CheckCircle2,
              border: 'border-emerald-500/20 bg-white/95 text-emerald-950',
              iconClass: 'text-emerald-500 bg-emerald-50',
            },
            error: {
              icon: AlertCircle,
              border: 'border-rose-500/20 bg-white/95 text-rose-950',
              iconClass: 'text-rose-500 bg-rose-50',
            },
            warning: {
              icon: AlertTriangle,
              border: 'border-amber-500/20 bg-white/95 text-amber-950',
              iconClass: 'text-amber-500 bg-amber-50',
            },
            info: {
              icon: Info,
              border: 'border-brand-500/20 bg-white/95 text-plum-950',
              iconClass: 'text-brand-500 bg-brand-50',
            },
          }[item.type]

          const Icon = config.icon

          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-3.5 shadow-lg shadow-black/5 backdrop-blur-md ${config.border}`}
            >
              <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${config.iconClass}`}>
                <Icon size={18} />
              </div>
              <div className="flex-1 pt-0.5">
                <p className="text-xs font-semibold leading-relaxed break-words">{item.message}</p>
              </div>
              <button
                type="button"
                onClick={() => removeToast(item.id)}
                className="shrink-0 rounded-lg p-1 text-plum-400 transition-colors hover:bg-plum-900/5 hover:text-plum-700"
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
