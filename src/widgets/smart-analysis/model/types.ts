/** A button under an answer. The app knows where each kind leads. */
export type AssistantAction =
  | { kind: 'order'; id: number; label: string }
  | { kind: 'report'; tab: 'sales' | 'profit' | 'stock' | 'debts' }
  | { kind: 'products'; tab: 'low' | 'soon' }
  | { kind: 'customer'; id: number; label: string }
  | { kind: 'customers' }

export type AnalysisTag = 'urgent' | 'week' | 'chance'

/** The smart analysis: an overall verdict, a few points, and a short summary. */
export interface Analysis {
  at: string
  status: 'good' | 'attention' | 'bad'
  headline: string
  items: { tag: AnalysisTag; title: string; text: string; action: AssistantAction }[]
  summary: string
}
