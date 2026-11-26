import type { AssistantAction } from '@/widgets/smart-analysis'

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
