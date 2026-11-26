import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderApp } from '@test/render'

async function rows() {
  const table = await screen.findByRole('table', { name: 'الصيدليات' })
  await within(table).findAllByRole('link')
  return within(table).getAllByRole('row').slice(1)
}

describe('PlatformPharmaciesPage', () => {
  beforeEach(() => localStorage.setItem('mockRole', 'platform'))

  it('lists every pharmacy with its plan and usage, soonest to end first', async () => {
    await renderApp('/platform/pharmacies')
    const list = await rows()
    expect(list).toHaveLength(7)
    expect(within(list[0]!).getByRole('link', { name: 'صيدلية النور' })).toBeInTheDocument()
    expect(within(list[6]!).getByText('موقوفة')).toBeInTheDocument()
    const shifa = within(list.find((row) => within(row).queryByText('صيدلية الشفاء'))!)
    expect(shifa.getByRole('link', { name: 'صيدلية الشفاء' })).toHaveAttribute(
      'href',
      '/platform/pharmacies/1',
    )
    expect(shifa.getByText('تجربة')).toBeInTheDocument()
    expect(shifa.getByText('رزان بلاطة')).toBeInTheDocument()
  })

  it('filters by plan and by city, and finds by phone', async () => {
    await renderApp('/platform/pharmacies')
    await rows()
    await userEvent.click(screen.getByRole('radio', { name: 'تجربة · 2' }))
    await within(screen.getByRole('table')).findByText('صيدلية الهدى')
    expect(await rows()).toHaveLength(2)

    await userEvent.click(screen.getByRole('radio', { name: 'الكل · 7' }))
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'المدينة' }), 'رفح')
    await within(screen.getByRole('table')).findByText('صيدلية السلام')
    expect(await rows()).toHaveLength(1)

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'المدينة' }), '')
    await userEvent.type(screen.getByRole('searchbox'), '0595')
    await within(screen.getByRole('table')).findByText('صيدلية بلسم')
    expect(await rows()).toHaveLength(1)
  })
})
