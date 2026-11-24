import type { Messages } from './ar'

/** Typed against Arabic: a missing or extra key fails the type check. */
export const en: Messages = {
  app: { name: 'PharmaSmart' },
  theme: { label: 'Theme', system: 'System', light: 'Light', dark: 'Dark' },
  language: { label: 'Language', ar: 'العربية', en: 'English' },
  home: {
    title: 'The design system is wired',
    body: 'Colors and fonts come from the design system and follow the theme.',
  },
  actions: {
    newSale: 'New sale',
    export: 'Export',
    viewAll: 'View all',
    cancelInvoice: 'Cancel invoice',
  },
  status: {
    inStock: 'In stock',
    expiringSoon: 'Expiring soon',
    expired: 'Expired',
    outOfStock: 'Out of stock',
    draft: 'Draft',
  },
  role: { manager: 'Manager', pharmacist: 'Pharmacist', cashier: 'Cashier' },
  network: {
    offline: 'You are offline. Your work is saved and will sync when the connection is back.',
    pending: 'Waiting to sync: {{count}}',
  },
  notFound: { title: 'Page not found', back: 'Back to home' },
}
