import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderApp } from '@test/render'

const history = () => screen.getByRole('region', { name: 'سجل الاشتراك' })
const actions = () => screen.getByRole('region', { name: 'إجراءات' })

describe('PlatformPharmacyPage', () => {
  beforeEach(() => localStorage.setItem('mockRole', 'platform'))

  it('shows who the pharmacy is and how it is used, in counts only', async () => {
    await renderApp('/platform/pharmacies/1')
    expect(await screen.findByRole('heading', { name: /صيدلية الشفاء/ })).toBeInTheDocument()
    const details = within(screen.getByRole('region', { name: 'البيانات' }))
    expect(details.getByText('PH-2026-0147')).toBeInTheDocument()
    const usage = within(screen.getByRole('region', { name: 'الاستخدام' }))
    expect(usage.getByText('24')).toBeInTheDocument()
    expect(usage.getByText(/مبالغ المبيعات والأرباح خاصة بالصيدلية/)).toBeInTheDocument()
    expect(within(history()).getByText(/تنتهي التجربة/)).toBeInTheDocument()
  })

  it('extends the trial and writes it in the history', async () => {
    await renderApp('/platform/pharmacies/1')
    await userEvent.click(
      await within(await screen.findByRole('region', { name: 'إجراءات' })).findByRole('button', {
        name: /تمديد التجربة/,
      }),
    )
    const dialog = screen.getByRole('dialog', { name: 'تمديد التجربة…' })
    await userEvent.click(within(dialog).getByRole('radio', { name: '14 يوم' }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'تأكيد' }))
    expect(await screen.findByText('انمددت التجربة 14 يوم')).toBeInTheDocument()
    expect(
      await within(history()).findByText('انمددت التجربة 14 يوم · رزان بلاطة'),
    ).toBeInTheDocument()
  })

  it('activates a paid plan by hand', async () => {
    await renderApp('/platform/pharmacies/5')
    await userEvent.click(await screen.findByRole('button', { name: 'تفعيل اشتراك' }))
    const dialog = screen.getByRole('dialog', { name: 'تغيير الباقة…' })
    await userEvent.click(within(dialog).getByRole('radio', { name: 'احترافية' }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'حفظ الباقة' }))
    // Once in the message, once in the history.
    expect(await screen.findAllByText(/صارت الباقة احترافية لحد/)).toHaveLength(2)
    expect(await screen.findByRole('heading', { name: /احترافية/ })).toBeInTheDocument()
    expect(
      within(actions()).queryByRole('button', { name: /تمديد التجربة/ }),
    ).not.toBeInTheDocument()
  })

  it('suspends only with a reason, and resumes', async () => {
    await renderApp('/platform/pharmacies/6')
    await userEvent.click(
      await within(await screen.findByRole('region', { name: 'إجراءات' })).findByRole('button', {
        name: /إيقاف الصيدلية/,
      }),
    )
    const dialog = screen.getByRole('dialog', { name: 'إيقاف الصيدلية…' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'إيقاف' }))
    expect(within(dialog).getByText('اكتبي السبب')).toBeInTheDocument()
    await userEvent.type(within(dialog).getByLabelText(/السبب/), 'طلب المالك')
    await userEvent.click(within(dialog).getByRole('button', { name: 'إيقاف' }))
    expect(await screen.findByText('انوقفت صيدلية بلسم')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: /موقوفة/ })).toBeInTheDocument()

    await userEvent.click(within(actions()).getByRole('button', { name: /إعادة تشغيل الصيدلية/ }))
    await userEvent.click(
      within(screen.getByRole('dialog', { name: 'إعادة تشغيل الصيدلية' })).getByRole('button', {
        name: 'تأكيد',
      }),
    )
    expect(await screen.findByText('رجعت صيدلية بلسم تشتغل')).toBeInTheDocument()
  })

  it('asks the owner before support may enter', async () => {
    await renderApp('/platform/pharmacies/1')
    await userEvent.click(
      await within(await screen.findByRole('region', { name: 'إجراءات' })).findByRole('button', {
        name: /دخول للدعم الفني/,
      }),
    )
    await userEvent.click(
      within(screen.getByRole('dialog', { name: 'دخول للدعم الفني' })).getByRole('button', {
        name: 'تأكيد',
      }),
    )
    expect(await screen.findByText('انبعت طلب الدخول للمالكة')).toBeInTheDocument()
    expect(
      await within(actions()).findByRole('button', { name: /بانتظار إذن المالكة/ }),
    ).toBeDisabled()
  })
})
