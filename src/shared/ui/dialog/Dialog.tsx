import { ModalBase, type ModalBaseProps } from './ModalBase'

/** Centred window. Only for decisions and short confirmations; forms go in a Drawer. */
export function Dialog(props: ModalBaseProps) {
  return <ModalBase {...props} className="m-auto w-[min(440px,calc(100vw-2rem))] rounded-lg" />
}
