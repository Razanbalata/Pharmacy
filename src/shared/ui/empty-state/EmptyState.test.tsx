import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from '@/shared/ui/button'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('says what is empty and offers the next step', () => {
    render(
      <EmptyState
        title="لسا ما في أصناف"
        description="استوردي من Excel أو ضيفي أول صنف."
        actions={<Button>استيراد</Button>}
      />,
    )
    expect(screen.getByText('لسا ما في أصناف')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'استيراد' })).toBeInTheDocument()
  })
})
