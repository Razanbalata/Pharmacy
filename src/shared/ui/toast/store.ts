import { create } from 'zustand'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface Toast {
  id: number
  message: string
  tone: 'success' | 'error' | 'info'
  action?: ToastAction
}

interface ToastState {
  toasts: Toast[]
  show: (toast: Omit<Toast, 'id'>) => number
  dismiss: (id: number) => void
}

let nextId = 1

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  show: (toast) => {
    const id = nextId++
    // Newest last; at most three on screen.
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }].slice(-3) }))
    return id
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}))

/** Call from anywhere: toast.success('انحفظت الفاتورة', { label: 'اطبعي', onClick }) */
export const toast = {
  success: (message: string, action?: ToastAction) =>
    useToastStore.getState().show({ message, tone: 'success', ...(action ? { action } : {}) }),
  error: (message: string, action?: ToastAction) =>
    useToastStore.getState().show({ message, tone: 'error', ...(action ? { action } : {}) }),
  info: (message: string, action?: ToastAction) =>
    useToastStore.getState().show({ message, tone: 'info', ...(action ? { action } : {}) }),
}
