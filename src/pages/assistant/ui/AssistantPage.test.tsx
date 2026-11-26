import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@test/render'

const chat = () =>
  screen.getByRole('region', { name: /طلبيات هالأسبوع|ليش|أكتر|الأصناف|محادثة جديدة|قارن|مين/ })

describe('AssistantPage', () => {
  it('opens the latest conversation, its answers worked out from the data', async () => {
    await renderApp('/assistant')
    const list = await screen.findByRole('navigation', { name: 'المحادثات' })
    expect(await within(list).findByRole('button', { name: 'طلبيات هالأسبوع' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    const region = await screen.findByRole('region', { name: 'طلبيات هالأسبوع' })
    expect(await within(region).findByText(/في 5 أصناف تحت الحد الأدنى/)).toBeInTheDocument()
    expect(
      within(region).getByRole('cell', { name: 'Ventolin Inhaler 100mcg' }),
    ).toBeInTheDocument()
    expect(within(region).getByRole('link', { name: 'افتحي PO-0015' })).toHaveAttribute(
      'href',
      '/purchases/15',
    )
    expect(within(region).getByText(/صافي الربح هالشهر لحد اليوم 1,081.00 ₪/)).toBeInTheDocument()
  })

  it('answers a ready question in a new conversation, and lists it', async () => {
    await renderApp('/assistant')
    await screen.findByRole('region', { name: 'طلبيات هالأسبوع' })
    await userEvent.click(screen.getByRole('button', { name: '+ محادثة جديدة' }))
    const fresh = await screen.findByRole('region', { name: 'محادثة جديدة' })
    expect(within(fresh).getByText(/اسألي عن صيدليتك/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'مين أكتر زبون متأخر بالدفع؟' }))
    const answered = await screen.findByRole('region', { name: 'مين أكتر زبون متأخر بالدفع؟' })
    expect(await within(answered).findByText(/أكتر زبون متأخر أبو يوسف البطش/)).toBeInTheDocument()
    expect(within(answered).getByRole('link', { name: 'كشف حساب أبو يوسف البطش' })).toHaveAttribute(
      'href',
      '/customers/6',
    )
    expect(
      within(screen.getByRole('navigation', { name: 'المحادثات' })).getByRole('button', {
        name: 'مين أكتر زبون متأخر بالدفع؟',
      }),
    ).toBeInTheDocument()
  })

  it('answers a typed question, and says what it can do when it does not understand', async () => {
    await renderApp('/assistant')
    await screen.findByRole('region', { name: 'طلبيات هالأسبوع' })
    const box = screen.getByRole('textbox', { name: 'اكتبي سؤالك' })
    await userEvent.type(box, 'شو بينتهي الشهر الجاي؟{Enter}')
    expect(await within(chat()).findByText('دفعة وحدة بتنتهي الشهر الجاي:')).toBeInTheDocument()
    expect(
      within(chat()).getByRole('cell', { name: 'Augmentin 457mg/5ml Syrup' }),
    ).toBeInTheDocument()
    await waitFor(() => expect(box).toHaveValue(''))

    await userEvent.type(box, 'كيف الطقس؟{Enter}')
    expect(await within(chat()).findByText(/ما فهمت السؤال منيح/)).toBeInTheDocument()
  })

  it('opens the analysis with its points and their buttons', async () => {
    await renderApp('/assistant?view=analysis')
    const drawer = await screen.findByRole('dialog', { name: 'التحليل الذكي' })
    expect(await within(drawer).findByText('Ventolin Inhaler 100mcg قرب يخلص')).toBeInTheDocument()
    expect(within(drawer).getByRole('link', { name: 'افتحي تقرير الديون' })).toHaveAttribute(
      'href',
      '/reports?tab=debts',
    )
    expect(within(drawer).getByText(/المبيعات هالشهر لحد اليوم 16,172.00 ₪/)).toBeInTheDocument()
  })
})
