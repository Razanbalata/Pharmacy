import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@test/render'

const CSV = [
  'اسم الدواء,المادة,القسم,سعر,الكمية,تاريخ الانتهاء,الشركة,ملاحظات,الباركود',
  'Nexium 40mg 14 Tablets,Esomeprazole,جهاز هضمي,55,20,2028-01-31,AstraZeneca,رف 3,7310000000047',
  'Strepsils Cool 24,,أدوية حلق,19,10,01/2025,Reckitt,,',
  'Omeprazole Pro 20mg,Omeprazole,جهاز هضمي,,15,31/05/2028,Dexcel,,',
  'Panadol Extra 24 Tablets,Paracetamol + Caffeine,مسكنات,23,0,,GSK,,6281100030011',
].join('\n')

async function upload(content: string, name = 'أدوية الصيدلية.csv') {
  const input = await screen.findByLabelText(/اسحبي الملف لهون/)
  await userEvent.upload(input, new File([content], name, { type: 'text/csv' }))
}

describe('ProductImportPage', () => {
  it('imports a file: match columns, fix the rows, then undo it', async () => {
    await renderApp('/products/import')
    await upload(CSV)

    expect(
      await screen.findByText('4 سطر · ربطنا 8 من 9 أعمدة لحالنا · ملف أدوية الصيدلية.csv'),
    ).toBeInTheDocument()
    const next = screen.getByRole('button', { name: 'التالي' })
    expect(next).toBeDisabled()
    expect(screen.getByText('بدها اختيار')).toBeInTheDocument()
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'وين يروح عمود ملاحظات' }),
      'تجاهلي هالعمود',
    )
    await userEvent.click(next)

    expect(await screen.findByText('2 جاهز')).toBeInTheDocument()
    expect(screen.getByText('2 بدهم تصحيح')).toBeInTheDocument()
    expect(screen.getByText('1 مواد فعالة جديدة')).toBeInTheDocument()
    expect(screen.getByText('تاريخ الانتهاء فات')).toBeInTheDocument()
    expect(screen.getByText('موجود من قبل بنفس الباركود')).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('تصحيح سعر البيع بالسطر 4'), '18{Enter}')
    expect(await screen.findByText('3 جاهز')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('تصحيح تاريخ الانتهاء بالسطر 3'), '2027-12-31')
    await userEvent.tab()
    expect(await screen.findByText('4 جاهز')).toBeInTheDocument()
    expect(screen.getByText('1 تصنيف جديد')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'استيراد 4 سطر' }))
    expect(await screen.findByRole('heading', { name: '3 صنف انضاف' })).toBeInTheDocument()
    expect(
      screen.getByText('مع 1 تصنيف جديد و 1 مواد فعالة جديدة. 1 صنف موجود اتحدّث.'),
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'تراجعي عن هالاستيراد' }))
    expect(await screen.findByText('تم التراجع عن الاستيراد')).toBeInTheDocument()
    expect(await screen.findByLabelText(/اسحبي الملف لهون/)).toBeInTheDocument()
  })

  it('shows the new products in the list after importing', async () => {
    await renderApp('/products/import')
    await upload('name,price,qty,expiry\nImported One,12,5,2029-01-31')
    await userEvent.click(await screen.findByRole('button', { name: 'التالي' }))
    await userEvent.click(await screen.findByRole('button', { name: 'استيراد 1 سطر' }))
    await userEvent.click(await screen.findByRole('link', { name: 'اعرضي الأصناف' }))
    const table = await screen.findByRole('table', { name: 'الأصناف' })
    expect(await within(table).findByText('Imported One')).toBeInTheDocument()
  })

  it('says why a file cannot be used', async () => {
    await renderApp('/products/import')
    await upload('اسم,سعر\n')
    expect(await screen.findByRole('alert')).toHaveTextContent('الملف فاضي')
    await upload('x', 'list.pdf')
    expect(await screen.findByRole('alert')).toHaveTextContent('نوع الملف مش مدعوم')
  })
})
