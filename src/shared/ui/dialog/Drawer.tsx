import { ModalBase, type ModalBaseProps } from './ModalBase'

/**
 * Side panel for quick add and edit (new customer, new staff member, return...).
 * It sits on the end side: the left in Arabic, the right in English.
 */
export function Drawer(props: ModalBaseProps) {
  return (
    <ModalBase
      {...props}
      className="m-0 ms-auto h-dvh max-h-none w-[min(460px,100vw)] rounded-none"
    />
  )
}
