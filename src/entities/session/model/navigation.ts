import type { PathKey } from '@/shared/config'
import type { Area } from './permissions'
import type { Role } from './types'
import { canAccess } from './permissions'

export interface NavItem {
  /** Also the i18n key under "nav." and the key in shared/config paths. */
  key: PathKey
  area: Area
}

export interface NavGroup {
  /** i18n key under "nav.groups.", or null for the top group without a title. */
  title: 'sales' | 'stock' | 'purchases' | 'finance' | 'admin' | null
  items: NavItem[]
}

/** The sidebar, in the order of the design. */
export const NAVIGATION: NavGroup[] = [
  {
    title: null,
    items: [
      { key: 'dashboard', area: 'dashboard' },
      { key: 'alerts', area: 'alerts' },
    ],
  },
  {
    title: 'sales',
    items: [
      { key: 'pos', area: 'sales' },
      { key: 'invoices', area: 'invoices' },
      { key: 'returns', area: 'returns' },
      { key: 'customers', area: 'customers' },
    ],
  },
  {
    title: 'stock',
    items: [
      { key: 'products', area: 'products' },
      { key: 'categories', area: 'categories' },
      { key: 'ingredients', area: 'ingredients' },
      { key: 'stockCounts', area: 'stock' },
      { key: 'movements', area: 'movements' },
    ],
  },
  {
    title: 'purchases',
    items: [
      { key: 'purchases', area: 'purchases' },
      { key: 'suppliers', area: 'suppliers' },
    ],
  },
  {
    title: 'finance',
    items: [
      { key: 'shifts', area: 'finance' },
      { key: 'reports', area: 'reports' },
      { key: 'assistant', area: 'assistant' },
    ],
  },
  {
    title: 'admin',
    items: [
      { key: 'staff', area: 'staff' },
      { key: 'settings', area: 'settings' },
    ],
  },
]

/** The sidebar for one role: hidden items removed, empty groups dropped. */
export function navigationFor(role: Role): NavGroup[] {
  return NAVIGATION.map((group) => ({
    ...group,
    items: group.items.filter((item) => canAccess(role, item.area)),
  })).filter((group) => group.items.length > 0)
}
