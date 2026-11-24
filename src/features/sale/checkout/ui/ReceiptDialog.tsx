import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Receipt, type Invoice } from '@/entities/invoice'
import { pharmacyQueries } from '@/entities/pharmacy'
import { formatMoney } from '@/shared/lib/money'
import { whatsappLink } from '@/shared/lib/validation'
import { Button, buttonVariants } from '@/shared/ui/button'
import { Dialog } from '@/shared/ui/dialog'

interface ReceiptDialogProps {
  invoice: Invoice | null
  onClose: () => void
}

/** The receipt after a sale, or when reprinting one: print, send, or move on. */
export function ReceiptDialog({ invoice, onClose }: ReceiptDialogProps) {
  const { t } = useTranslation()
  const { data: profile } = useQuery(pharmacyQueries.profile())
  const { data: settings } = useQuery(pharmacyQueries.settings())
  if (!invoice) return null
  const pharmacy = {
    name: profile?.name ?? '',
    address: profile?.address ?? '',
    phone: profile?.phone ?? '',
    licenseNumber: profile?.licenseNumber ?? '',
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={t('receipt.title')}
      footer={
        <>
          {invoice.customer?.phone && (
            <a
              href={whatsappLink(
                invoice.customer.phone,
                t('receipt.whatsappText', {
                  pharmacy: pharmacy.name,
                  number: invoice.number,
                  amount: formatMoney(invoice.total),
                }),
              )}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: 'secondary' })}
            >
              {t('receipt.sendWhatsapp')}
            </a>
          )}
          <Button variant="secondary" onClick={() => window.print()}>
            {t('receipt.print')}
          </Button>
          <Button onClick={onClose}>{t('receipt.newSale')}</Button>
        </>
      }
    >
      <div className="print-area max-h-[60vh] overflow-y-auto rounded-md border border-border">
        <Receipt
          invoice={invoice}
          pharmacy={pharmacy}
          returnDays={settings?.sale.returnDays ?? 14}
        />
      </div>
    </Dialog>
  )
}
