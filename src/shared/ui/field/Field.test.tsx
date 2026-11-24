import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Field } from './Field'
import { Input } from './Input'

describe('Field', () => {
  it('links the label to the control', () => {
    render(<Field label="اسم الصنف">{(control) => <Input {...control} />}</Field>)
    expect(screen.getByLabelText('اسم الصنف')).toBeInTheDocument()
  })

  it('announces the hint with the control', () => {
    render(
      <Field label="الجوال" hint="عليه بيوصل رابط التفعيل">
        {(control) => <Input {...control} />}
      </Field>,
    )
    expect(screen.getByLabelText('الجوال')).toHaveAccessibleDescription('عليه بيوصل رابط التفعيل')
  })

  it('marks the control invalid and reads the error instead of the hint', () => {
    render(
      <Field label="الكمية" hint="بالعلبة" error="الكمية لازم تكون أكبر من صفر">
        {(control) => <Input {...control} />}
      </Field>,
    )
    const input = screen.getByLabelText('الكمية')
    expect(input).toBeInvalid()
    expect(input).toHaveAccessibleDescription('الكمية لازم تكون أكبر من صفر')
    expect(screen.queryByText('بالعلبة')).not.toBeInTheDocument()
  })
})
