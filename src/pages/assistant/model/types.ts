/** A button under an answer. The app knows where each kind leads. */
export type AssistantAction =
  | { kind: 'order'; id: number; label: string }
  | { kind: 'report'; tab: 'sales' | 'profit' | 'stock' | 'debts' }
  | { kind: 'products'; tab: 'low' | 'soon' }
  | { kind: 'customer'; id: number; label: string }
  | { kind: 'customers' }

/** An answer is a few blocks: text, a small table, bars to compare, and buttons. */
export type AssistantBlock =
  | { type: 'text'; text: string }
  | { type: 'table'; columns: string[]; rows: (string | number)[][] }
  | { type: 'bars'; items: { label: string; value: number }[] }
  | { type: 'actions'; items: AssistantAction[] }

export interface AssistantMessage {
  id: number
  role: 'user' | 'assistant'
  at: string
  /** The user's question; an answer has blocks instead. */
  text?: string
  blocks?: AssistantBlock[]
}

export interface ConversationSummary {
  id: number
  title: string
  at: string
}

export interface Conversation extends ConversationSummary {
  messages: AssistantMessage[]
}

export type AnalysisTag = 'urgent' | 'week' | 'chance'

/** The smart analysis: an overall verdict, a few points, and a short summary. */
export interface Analysis {
  at: string
  status: 'good' | 'attention' | 'bad'
  headline: string
  items: { tag: AnalysisTag; title: string; text: string; action: AssistantAction }[]
  summary: string
}
