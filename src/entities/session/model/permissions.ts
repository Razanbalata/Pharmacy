import type { Role } from './types'

/**
 * What each role may open. One place for the rule, so the sidebar, the routes and the
 * buttons never disagree. The server checks again; this only hides what would be refused.
 */
export const AREAS = [
  'dashboard',
  'alerts',
  'sales',
  'invoices',
  'returns',
  'customers',
  'products',
  /** Adding, editing and importing products, categories and ingredients. */
  'catalog',
  'categories',
  'ingredients',
  'stock',
  'movements',
  'purchases',
  'suppliers',
  'finance',
  'reports',
  'assistant',
  'staff',
  'settings',
] as const
export type Area = (typeof AREAS)[number]

const ROLE_AREAS: Record<Role, readonly Area[]> = {
  manager: AREAS,
  pharmacist: [
    'dashboard',
    'alerts',
    'sales',
    'invoices',
    'returns',
    'customers',
    'products',
    'catalog',
    'categories',
    'ingredients',
    'stock',
    'movements',
    'purchases',
    'suppliers',
    'reports',
    'assistant',
  ],
  cashier: ['dashboard', 'sales', 'invoices', 'returns', 'customers', 'products'],
}

export function canAccess(role: Role, area: Area): boolean {
  return ROLE_AREAS[role].includes(area)
}

/**
 * Adding, editing and importing products, categories and active ingredients.
 * The cashier looks products up while selling but does not change them.
 */
export function canManageCatalog(role: Role): boolean {
  return canAccess(role, 'catalog')
}

/** Approving count differences changes stock, so it is the manager's, or given to a pharmacist. */
export function canApproveCounts(user: { role: Role; permissions: { approveCounts: boolean } }) {
  return user.role === 'manager' || (user.role === 'pharmacist' && user.permissions.approveCounts)
}
