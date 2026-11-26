import { queryOptions } from '@tanstack/react-query'
import { http } from '@/shared/api'
import type { Analysis, AssistantMessage, Conversation, ConversationSummary } from '../model/types'

export async function startConversation(): Promise<Conversation> {
  return (await http.post<{ data: Conversation }>('/api/assistant/conversations')).data
}

/** Sends a question and returns the answer. `language` is the language to answer in. */
export async function ask(id: number, text: string, language: string): Promise<AssistantMessage> {
  return (
    await http.post<{ data: AssistantMessage }>(`/api/assistant/conversations/${id}/messages`, {
      text,
      language,
    })
  ).data
}

export const assistantQueries = {
  all: ['assistant'] as const,
  list: () =>
    queryOptions({
      queryKey: [...assistantQueries.all, 'list'],
      queryFn: async () =>
        (await http.get<{ data: ConversationSummary[] }>('/api/assistant/conversations')).data,
    }),
  conversation: (id: number, language: string) =>
    queryOptions({
      queryKey: [...assistantQueries.all, 'conversation', id],
      queryFn: async () =>
        (
          await http.get<{ data: Conversation }>(`/api/assistant/conversations/${id}`, {
            query: { language },
          })
        ).data,
    }),
  analysis: (language: string) =>
    queryOptions({
      queryKey: [...assistantQueries.all, 'analysis', language],
      queryFn: async () =>
        (await http.get<{ data: Analysis }>('/api/assistant/analysis', { query: { language } }))
          .data,
    }),
}
