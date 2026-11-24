import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// The design system adds its own text sizes (text-body, text-heading, ...). tailwind-merge has to
// know they are sizes, not colours, or it would drop a colour class like text-surface-100 next to them.
const TEXT_STYLES = [
  'display',
  'heading',
  'subheading',
  'body',
  'body-strong',
  'small',
  'caption',
  'number-xl',
  'number-lg',
  'number',
]

const twMerge = extendTailwindMerge({
  extend: {
    theme: { text: TEXT_STYLES },
  },
})

/** Joins class names and lets later Tailwind classes override earlier ones. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
