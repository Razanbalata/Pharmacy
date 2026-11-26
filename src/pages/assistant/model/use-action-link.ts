import { useTranslation } from 'react-i18next'
import { paths, to } from '@/shared/config'
import type { AssistantAction } from './types'

/** Where an answer's button leads, and what it says. */
export function useActionLink() {
  const { t } = useTranslation()
  return (action: AssistantAction): { href: string; label: string } => {
    switch (action.kind) {
      case 'order':
        return {
          href: to(paths.purchaseDetail, { id: action.id }),
          label: t('assistant.actions.order', { label: action.label }),
        }
      case 'products':
        return {
          href: `${paths.products}?tab=${action.tab}`,
          label: t(`assistant.actions.products_${action.tab}`),
        }
      case 'report':
        return {
          href: `${paths.reports}?tab=${action.tab}`,
          label: t(`assistant.actions.report_${action.tab}`),
        }
      case 'customer':
        return {
          href: to(paths.customerDetail, { id: action.id }),
          label: t('assistant.actions.customer', { label: action.label }),
        }
      case 'customers':
        return { href: paths.customers, label: t('assistant.actions.customers') }
    }
  }
}
