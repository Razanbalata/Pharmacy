import type { landingAr } from './landing.ar'

export const landingEn: typeof landingAr = {
  landing: {
    nav: { features: 'Features', how: 'How it works', roles: 'Who it is for', login: 'Sign in' },
    badge: 'Built for pharmacies in Gaza · Keeps working offline',
    title: 'Your whole pharmacy on one screen,',
    titleAccent: 'from the sale to the last pill in stock',
    sub: 'PharmaSmart replaces the notebook and the spreadsheet: fast barcode sales, alerts before medicine expires, tidy customer debts, and reports that show your real profit.',
    join: 'Request to join',
    login: 'I have an account',
    trust: ['30-day free trial', 'No card needed', 'Arabic and English'],
    shotAlt: 'The manager dashboard in PharmaSmart',
    stats: [
      { value: '3', label: 'roles, each with its own permissions' },
      { value: '90 days', label: 'default expiry warning, yours to change' },
      { value: '4', label: 'reports to print or export' },
      { value: 'Daily', label: 'automatic backup' },
    ],
    featuresTitle: 'Everything a pharmacy needs, in one place',
    featuresSub: 'Each part answers a real problem that happens every day behind the counter.',
    features: {
      pos: {
        title: 'Fast point of sale',
        text: 'Barcode, search by name or active ingredient, sell by box or by pill, pay cash, by bank app or on credit.',
      },
      expiry: {
        title: 'Expiry in plain sight',
        text: 'Every batch has its date, sales take the nearest expiry first, and you are warned well ahead.',
      },
      stock: {
        title: 'Stock and purchasing',
        text: 'Shortages show in time, suggested orders per supplier, receiving, counts and damage on a clear log.',
      },
      debts: {
        title: 'A debt book that never gets lost',
        text: 'A statement per customer, a credit limit, WhatsApp reminders, and a receipt for every payment.',
      },
      shifts: {
        title: 'Shifts and a balanced till',
        text: 'Each cashier opens a shift and counts the drawer at the end; any difference shows at once.',
      },
      ai: {
        title: 'Smart assistant',
        text: 'Ask about your sales and stock in your own words, and get a monthly analysis with clear next steps.',
      },
    },
    howTitle: 'From request to first sale in three steps',
    how: [
      {
        title: 'Request to join',
        text: 'Fill in the pharmacy and license details; we review it and send the activation link on WhatsApp.',
      },
      {
        title: 'Set up products',
        text: 'Import from Excel, pick from the ready catalog, or try it with sample data.',
      },
      {
        title: 'Start selling',
        text: 'Add staff with their permissions, open a shift, and the first invoice takes seconds.',
      },
    ],
    rolesTitle: 'Everyone sees what is theirs',
    roles: {
      manager: { title: 'Manager', text: 'Numbers, profit, expenses, staff and settings.' },
      pharmacist: {
        title: 'Pharmacist',
        text: 'Sales, products, stock and purchasing, without profit.',
      },
      cashier: { title: 'Cashier', text: 'Sales, invoices, returns and customers only.' },
    },
    offlineTitle: 'Internet down? Sales go on',
    offlineText:
      'Invoices are saved on the device and upload by themselves when the connection is back. A backup runs every day.',
    ctaTitle: 'Ready to retire the notebook?',
    ctaText: 'Send your request today, and start the free trial once it is accepted.',
    footer: 'Pharmacy management system',
  },
}
