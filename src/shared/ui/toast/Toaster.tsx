import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/cn'
import { useToastStore, type Toast } from './store'

const DURATION_MS = 5000

function ToastItem({ toast }: { toast: Toast }) {
  const { t } = useTranslation()
  const dismiss = useToastStore((state) => state.dismiss)

  useEffect(() => {
    const timer = window.setTimeout(() => dismiss(toast.id), DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [toast.id, dismiss])

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg px-4 py-3 text-body shadow-pop',
        toast.tone === 'error' ? 'bg-danger text-surface-100' : 'bg-navy text-on-navy',
      )}
    >
      {toast.tone === 'success' && (
        <span aria-hidden className="text-success-soft">
          ✓
        </span>
      )}
      <span className="flex-1">{toast.message}</span>
      {toast.action && (
        <button
          type="button"
          className="font-semibold underline-offset-4 hover:underline"
          onClick={() => {
            toast.action?.onClick()
            dismiss(toast.id)
          }}
        >
          {toast.action.label}
        </button>
      )}
      <button
        type="button"
        aria-label={t('common.close')}
        className="opacity-70 hover:opacity-100"
        onClick={() => dismiss(toast.id)}
      >
        ✕
      </button>
    </div>
  )
}

/** Mounted once in the app. Quick messages appear at the bottom on the end side. */
export function Toaster() {
  const { t } = useTranslation()
  const toasts = useToastStore((state) => state.toasts)
  return (
    <section
      aria-live="polite"
      aria-label={t('common.notifications')}
      className="pointer-events-none fixed bottom-4 end-4 z-50 flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2 [&>*]:pointer-events-auto"
    >
      {toasts.map((item) => (
        <ToastItem key={item.id} toast={item} />
      ))}
    </section>
  )
}
