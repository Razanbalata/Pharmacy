import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmDialog } from './ConfirmDialog'
import { Drawer } from './Drawer'

describe('Drawer', () => {
  it('is named by its title and shows its content when open', () => {
    render(
      <Drawer open onClose={() => {}} title="موظف جديد">
        <p>النموذج</p>
      </Drawer>,
    )
    expect(screen.getByRole('dialog', { name: 'موظف جديد' })).toBeVisible()
    expect(screen.getByText('النموذج')).toBeInTheDocument()
  })

  it('asks to close from the close button', async () => {
    const onClose = vi.fn<() => void>()
    render(<Drawer open onClose={onClose} title="زبون جديد" />)
    await userEvent.click(screen.getByRole('button', { name: 'إغلاق' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('closes on a click outside the panel, not on a click inside it', () => {
    const onClose = vi.fn<() => void>()
    render(
      <Drawer open onClose={onClose} title="زبون جديد">
        <p>النموذج</p>
      </Drawer>,
    )
    const dialog = screen.getByRole('dialog', { name: 'زبون جديد' })
    // jsdom gives the box a zero size, so any point away from 0,0 is "outside".
    fireEvent.mouseDown(screen.getByText('النموذج'), { clientX: 0, clientY: 0 })
    fireEvent.click(screen.getByText('النموذج'), { clientX: 0, clientY: 0 })
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.mouseDown(dialog, { clientX: 900, clientY: 300 })
    fireEvent.click(dialog, { clientX: 900, clientY: 300 })
    expect(onClose).toHaveBeenCalledOnce()
  })
})

describe('ConfirmDialog', () => {
  it('reads the message and runs the action on confirm', async () => {
    const onConfirm = vi.fn<() => void>()
    render(
      <ConfirmDialog
        open
        onClose={() => {}}
        onConfirm={onConfirm}
        title="تأكيد الفاتورة؟"
        message="بعد التأكيد ما بتتعدل. أي تصحيح بيصير بمرتجع."
      />,
    )
    expect(screen.getByRole('dialog', { name: 'تأكيد الفاتورة؟' })).toHaveAccessibleDescription(
      'بعد التأكيد ما بتتعدل. أي تصحيح بيصير بمرتجع.',
    )
    await userEvent.click(screen.getByRole('button', { name: 'تأكيد' }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })
})
