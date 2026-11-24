import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@test/render'

async function openNew() {
  await renderApp('/products/new')
  return screen.findByRole('heading', { name: 'إضافة صنف', level: 1 })
}

describe('ProductFormPage', () => {
  it('fills a product from the shared drug list and saves it', async () => {
    await openNew()
    await userEvent.type(
      screen.getByLabelText(
        'أسرع طريقة: اختاري من قائمة الأدوية المشتركة، والبيانات بتنعبى لحالها',
      ),
      'nexium',
    )
    await userEvent.click(await screen.findByRole('button', { name: /Nexium 40mg 14 Tablets/ }))

    expect(await screen.findByText(/عبينا البيانات من القائمة المشتركة/)).toBeInTheDocument()
    expect(screen.getByLabelText('الاسم التجاري')).toHaveValue('Nexium 40mg 14 Tablets')
    expect(screen.getByLabelText(/^الباركود/)).toHaveValue('7310000000047')
    expect(await screen.findByDisplayValue('Esomeprazole')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'حفظ الصنف' }))
    expect(
      await screen.findByRole('heading', { name: 'Nexium 40mg 14 Tablets', level: 1 }),
    ).toBeInTheDocument()
    expect(screen.getByText('Esomeprazole')).toBeInTheDocument()
    expect(screen.getByText('انحفظ Nexium 40mg 14 Tablets')).toBeInTheDocument()
  })

  it('checks every field, the units and the opening stock before saving', async () => {
    await openNew()
    await userEvent.click(screen.getByRole('button', { name: 'حفظ الصنف' }))
    expect(await screen.findByText('هالحقل مطلوب')).toBeInTheDocument()
    expect(screen.getByText('السعر لازم يكون أكبر من صفر')).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('الاسم التجاري'), 'Test Tablets 20')
    await userEvent.type(screen.getByLabelText('سعر البيع: علبة'), '30')
    await userEvent.click(screen.getByRole('button', { name: '+ أضيفي وحدة' }))
    await userEvent.type(screen.getByLabelText('الوحدة 2'), 'شريط')
    await userEvent.type(screen.getByLabelText('كم وحدة فيها اللي فوقها: شريط'), '1')
    await userEvent.type(screen.getByLabelText('سعر البيع: شريط'), '16')
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'عندي كمية منه هلأ على الرف (مخزون افتتاحي)' }),
    )
    await userEvent.type(screen.getByLabelText('الكمية'), '12')
    await userEvent.type(screen.getByLabelText('تاريخ الانتهاء'), '2020-01-01')
    await userEvent.type(screen.getByLabelText('سعر الشراء'), '20')
    await userEvent.click(screen.getByRole('button', { name: 'حفظ الصنف' }))

    expect(await screen.findByText('لازم عدد صحيح أكبر من 1')).toBeInTheDocument()
    expect(screen.getByText('التاريخ لازم يكون بالمستقبل')).toBeInTheDocument()

    await userEvent.clear(screen.getByLabelText('كم وحدة فيها اللي فوقها: شريط'))
    await userEvent.type(screen.getByLabelText('كم وحدة فيها اللي فوقها: شريط'), '2')
    await userEvent.clear(screen.getByLabelText('تاريخ الانتهاء'))
    await userEvent.type(screen.getByLabelText('تاريخ الانتهاء'), '2028-05-31')
    await userEvent.click(screen.getByRole('button', { name: 'حفظ الصنف' }))

    expect(await screen.findByRole('heading', { name: 'Test Tablets 20', level: 1 })).toBeVisible()
    expect(screen.getAllByText('12 علبة').length).toBeGreaterThan(0)
    expect(screen.getByText(/علبة = 2 شريط/)).toBeInTheDocument()
  })

  it('refuses a barcode another product already has', async () => {
    await openNew()
    await userEvent.type(screen.getByLabelText('الاسم التجاري'), 'Copy')
    await userEvent.type(screen.getByLabelText('سعر البيع: علبة'), '10')
    await userEvent.type(screen.getByLabelText(/^الباركود/), '5000123456789')
    await userEvent.click(screen.getByRole('button', { name: 'حفظ الصنف' }))
    expect(await screen.findByText('في صنف تاني بنفس الباركود')).toBeInTheDocument()
  })

  it('keeps the form open for the next product with "save and add another"', async () => {
    await openNew()
    await userEvent.type(screen.getByLabelText('الاسم التجاري'), 'First One')
    await userEvent.type(screen.getByLabelText('سعر البيع: علبة'), '9')
    await userEvent.click(screen.getByRole('button', { name: 'حفظ وإضافة صنف تاني' }))
    expect(await screen.findByText('انحفظ First One')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'إضافة صنف', level: 1 })).toBeInTheDocument()
    expect(screen.getByLabelText('الاسم التجاري')).toHaveValue('')
  })

  it('edits a product, and the status follows the new minimum', async () => {
    await renderApp('/products/5/edit')
    expect(
      await screen.findByRole('heading', { name: 'تعديل Ventolin Inhaler 100mcg', level: 1 }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: /مخزون افتتاحي/ })).not.toBeInTheDocument()
    await userEvent.clear(screen.getByLabelText('الحد الأدنى'))
    await userEvent.type(screen.getByLabelText('الحد الأدنى'), '2')
    await userEvent.click(screen.getByRole('button', { name: 'حفظ الصنف' }))

    const heading = await screen.findByRole('heading', {
      name: 'Ventolin Inhaler 100mcg',
      level: 1,
    })
    expect(within(heading.parentElement!).getByText('متوفر')).toBeInTheDocument()
  })

  it('is closed to the cashier', async () => {
    localStorage.setItem('mockRole', 'cashier')
    await renderApp('/products/new')
    expect(await screen.findByText('هالصفحة مش ضمن صلاحياتك')).toBeInTheDocument()
  })
})
