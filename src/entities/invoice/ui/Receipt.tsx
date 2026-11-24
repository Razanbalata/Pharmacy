import { useTranslation } from 'react-i18next'
import { formatMoney } from '@/shared/lib/money'
import { Barcode } from '@/shared/ui/barcode'
import type { Invoice } from '../model/types'

interface ReceiptProps {
  invoice: Invoice
  pharmacy: { name: string; address: string; phone: string; licenseNumber: string }
  returnDays: number
}

/** The printed receipt, 80 mm wide like the till printer. Black on white whatever the theme. */
export function Receipt({ invoice, pharmacy, returnDays }: ReceiptProps) {
  const { t } = useTranslation()
  const date = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(invoice.at))
  const row = 'flex justify-between gap-2'

  return (
    <div
      className="mx-auto flex w-[80mm] flex-col gap-2 bg-white p-4 font-mono text-[12px] leading-snug text-black"
      aria-label={t('receipt.title')}
    >
      <div className="text-center">
        <p className="text-[14px] font-bold">{pharmacy.name}</p>
        <p>{pharmacy.address}</p>
        <p>
          <bdi dir="ltr">{pharmacy.phone}</bdi>
          {pharmacy.licenseNumber &&
            ` · ${t('receipt.license', { number: pharmacy.licenseNumber })}`}
        </p>
      </div>
      <div className="border-y border-dashed border-black py-1.5">
        <p className={row}>
          <span>{t('receipt.invoice')}</span>
          <bdi dir="ltr">{invoice.number}</bdi>
        </p>
        <p className={row}>
          <span>{t('receipt.date')}</span>
          <bdi dir="ltr">{date}</bdi>
        </p>
        <p className={row}>
          <span>{t('receipt.cashier')}</span>
          <span>{invoice.cashier.split(' ')[0]}</span>
        </p>
      </div>
      <ul className="flex flex-col gap-1">
        {invoice.lines.map((line) => (
          <li key={`${line.productId}-${line.unit}`}>
            <bdi className="block">{line.name}</bdi>
            <span className={row}>
              <span>
                {line.quantity} {line.unit} × {formatMoney(line.price)}
              </span>
              <span>{formatMoney(line.total)}</span>
            </span>
          </li>
        ))}
      </ul>
      <div className="border-t border-dashed border-black pt-1.5">
        <p className={row}>
          <span>{t('receipt.subtotal')}</span>
          <span>{formatMoney(invoice.subtotal)}</span>
        </p>
        {invoice.discount > 0 && (
          <p className={row}>
            <span>{t('receipt.discount')}</span>
            <bdi dir="ltr">-{formatMoney(invoice.discount)}</bdi>
          </p>
        )}
        <p className={`${row} text-[14px] font-bold`}>
          <span>{t('receipt.total')}</span>
          <span>{formatMoney(invoice.total)} ₪</span>
        </p>
        {invoice.payment.cash > 0 && (
          <p className={row}>
            <span>{t('receipt.cashReceived')}</span>
            <span>{formatMoney(invoice.payment.received)}</span>
          </p>
        )}
        {invoice.payment.bank > 0 && (
          <p className={row}>
            <span>{t('receipt.bank')}</span>
            <span>{formatMoney(invoice.payment.bank)}</span>
          </p>
        )}
        {invoice.payment.credit > 0 && (
          <p className={row}>
            <span>{t('receipt.credit', { name: invoice.customer?.name ?? '' })}</span>
            <span>{formatMoney(invoice.payment.credit)}</span>
          </p>
        )}
        {invoice.payment.change > 0 && (
          <p className={row}>
            <span>{t('receipt.change')}</span>
            <span>{formatMoney(invoice.payment.change)}</span>
          </p>
        )}
      </div>
      <Barcode
        code={invoice.number.replace(/\D/g, '').padStart(13, '0')}
        className="mx-auto w-48"
      />
      <p className="text-center text-[11px]">{t('receipt.returnPolicy', { days: returnDays })}</p>
    </div>
  )
}
