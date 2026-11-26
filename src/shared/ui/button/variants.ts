import { cva } from 'class-variance-authority'

/** The button look, for links that act as buttons (a Link to a page, a download). */
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-brand text-on-brand shadow-card hover:bg-brand-strong',
        secondary:
          'border border-border bg-surface-100 text-ink shadow-[0_1px_1px_rgba(15,31,51,0.05)] hover:border-border-strong/60 hover:bg-surface-200/60',
        ghost: 'text-brand-strong hover:bg-brand-soft',
        // surface-100 is white in light and deep navy in dark, so the label keeps contrast on both reds.
        danger: 'bg-danger text-surface-100 hover:opacity-90',
      },
      size: {
        sm: 'h-8 px-3 text-small',
        md: 'h-10 px-4 text-body',
        lg: 'h-12 px-5 text-body-strong',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)
