import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderApp } from '@test/render'

async function signIn(login: string, password: string) {
  await userEvent.type(await screen.findByLabelText('الجوال أو البريد'), login)
  await userEvent.type(screen.getByLabelText('كلمة المرور'), password)
  await userEvent.click(screen.getByRole('button', { name: 'دخول' }))
}

describe('LoginPage', () => {
  beforeEach(() => localStorage.setItem('mockRole', 'none'))

  it('asks for both fields before sending', async () => {
    await renderApp('/login')
    await userEvent.click(await screen.findByRole('button', { name: 'دخول' }))
    expect(screen.getAllByText('هالحقل مطلوب')).toHaveLength(2)
  })

  it('takes the cashier straight to the point of sale', async () => {
    const { router } = await renderApp('/login')
    await signIn('0597 640 118', 'Pharma2026x')
    expect(await screen.findByRole('heading', { level: 1, name: 'نقطة البيع' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/sales/pos')
  })

  it('takes the platform owner to the join requests', async () => {
    const { router } = await renderApp('/login')
    await signIn('0590000000', 'Pharma2026x')
    await screen.findByRole('heading', { level: 1, name: 'طلبات الانضمام' })
    expect(router.state.location.pathname).toBe('/platform/requests')
  })

  it('says the details are wrong and counts the attempts left', async () => {
    await renderApp('/login')
    await signIn('0599920307', 'wrong')
    expect(await screen.findByRole('alert')).toHaveTextContent('الجوال أو كلمة المرور مش صح.')
    for (let i = 0; i < 2; i += 1) {
      await userEvent.click(await screen.findByRole('button', { name: 'دخول' }))
    }
    expect(await screen.findByText(/باقيلك 2 محاولات/)).toBeInTheDocument()
  })

  it('locks sign-in after too many wrong attempts', async () => {
    await renderApp('/login')
    await signIn('0599920307', 'wrong')
    for (let i = 0; i < 5; i += 1) {
      await userEvent.click(await screen.findByRole('button', { name: 'دخول' }))
    }
    expect(await screen.findByText('محاولات كتير. جربي كمان 15 دقيقة.')).toBeInTheDocument()
  })

  it('skips the form for someone already signed in', async () => {
    localStorage.setItem('mockRole', 'pharmacist')
    const { router } = await renderApp('/login')
    await screen.findByRole('heading', { level: 1, name: /الخير يا/ })
    expect(router.state.location.pathname).toBe('/')
  })
})
