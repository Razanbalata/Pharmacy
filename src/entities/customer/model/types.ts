/** Enough of a customer to sell on credit. Module 7 adds the account, payments and history. */
export interface CustomerOption {
  id: number
  name: string
  phone: string
  /** What the customer owes now. */
  debt: number
  /** The most they may owe; selling beyond it needs the manager. */
  debtLimit: number
}
