import { Sparkles } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/field'
import { SkeletonRows } from '@/shared/ui/skeleton'
import { toast } from '@/shared/ui/toast'
import { ask, assistantQueries, startConversation } from '../api/assistant-api'
import type { AssistantMessage, Conversation } from '../model/types'
import { AnalysisDrawer } from '@/widgets/smart-analysis'
import { Answer } from './Answer'

const DAY_MS = 86_400_000

/**
 * Ask about the pharmacy in plain words. Conversations are kept on the side; the analysis
 * opens beside them (also from "?view=analysis", as the dashboard links it).
 */
export function AssistantPage() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const [params, setParams] = useSearchParams()
  const [text, setText] = useState('')
  const [asking, setAsking] = useState<string | null>(null)
  const { data: list = [], isPending: listPending } = useQuery(assistantQueries.list())
  const chosen = Number(params.get('c')) || list[0]?.id || null
  const { data: conversation } = useQuery({
    ...assistantQueries.conversation(chosen ?? 0, i18n.language),
    enabled: chosen !== null,
  })
  const analysisOpen = params.get('view') === 'analysis'
  const [today] = useState(() => Date.now())

  const setQuery = (next: Record<string, string | null>) => {
    const query = new URLSearchParams(params)
    for (const [key, value] of Object.entries(next)) {
      if (value === null) query.delete(key)
      else query.set(key, value)
    }
    setParams(query, { replace: true })
  }

  const start = useMutation({
    mutationFn: startConversation,
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: assistantQueries.list().queryKey })
      setQuery({ c: String(created.id) })
    },
  })

  const send = useMutation({
    mutationFn: async (question: string) => {
      const id = chosen ?? (await startConversation()).id
      if (chosen === null) setQuery({ c: String(id) })
      return { id, reply: await ask(id, question, i18n.language) }
    },
    onMutate: (question) => setAsking(question),
    onSuccess: async ({ id }) => {
      await queryClient.invalidateQueries({
        queryKey: assistantQueries.conversation(id, i18n.language).queryKey,
      })
      await queryClient.invalidateQueries({ queryKey: assistantQueries.list().queryKey })
      setText('')
    },
    onError: () => toast.error(t('assistant.failed')),
    onSettled: () => setAsking(null),
  })

  function submit(event?: FormEvent) {
    event?.preventDefault()
    const question = text.trim()
    if (question && !send.isPending) send.mutate(question)
  }

  const groups = [
    { key: 'today', items: list.filter((item) => today - Date.parse(item.at) < DAY_MS * 2) },
    { key: 'earlier', items: list.filter((item) => today - Date.parse(item.at) >= DAY_MS * 2) },
  ] as const
  const suggested = t('assistant.suggested', { returnObjects: true }) as string[]
  const messages: AssistantMessage[] = conversation?.messages ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-display">{t('assistant.title')}</h1>
        <Button variant="secondary" onClick={() => setQuery({ view: 'analysis' })}>
          <Sparkles aria-hidden className="size-4" />
          {t('assistant.analysis.open')}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
        <nav aria-label={t('assistant.conversations')} className="flex flex-col gap-3">
          <Button variant="secondary" onClick={() => start.mutate()} disabled={start.isPending}>
            {t('assistant.newChat')}
          </Button>
          {listPending && <SkeletonRows rows={4} />}
          {groups.map(
            ({ key, items }) =>
              items.length > 0 && (
                <div key={key} className="flex flex-col gap-1">
                  <span className="px-2 text-caption text-ink-muted">{t(`assistant.${key}`)}</span>
                  {items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      aria-current={item.id === chosen ? 'page' : undefined}
                      onClick={() => setQuery({ c: String(item.id) })}
                      className={cn(
                        'truncate rounded-md px-2 py-1.5 text-start text-small hover:bg-surface-200',
                        item.id === chosen && 'bg-brand-soft font-semibold text-brand-strong',
                      )}
                    >
                      {item.title || t('assistant.untitled')}
                    </button>
                  ))}
                </div>
              ),
          )}
        </nav>

        <section
          aria-label={conversation?.title || t('assistant.untitled')}
          className="flex min-h-[32rem] flex-col rounded-lg border border-border bg-surface-100 shadow-card"
        >
          <details className="border-b border-border px-4 py-2.5 text-small text-ink-muted">
            <summary className="cursor-pointer">
              {t('assistant.privacy')}{' '}
              <span className="text-brand-strong underline">{t('assistant.privacyMore')}</span>
            </summary>
            <p className="mt-2">{t('assistant.privacyDetail')}</p>
          </details>

          <ol aria-live="polite" className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
            {messages.length === 0 && !asking && (
              <li className="m-auto max-w-md text-center text-ink-muted">{t('assistant.empty')}</li>
            )}
            {messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
            {asking && (
              <>
                <Message message={{ id: -1, role: 'user', at: '', text: asking }} />
                <li className="flex flex-col gap-2 self-start">
                  <span className="flex items-center gap-1.5 text-caption text-ink-muted">
                    <Sparkles aria-hidden className="size-3.5 text-brand" />
                    {t('assistant.thinking')}
                  </span>
                  <SkeletonRows rows={2} />
                </li>
              </>
            )}
            {/* A new key each time something is added, so the list scrolls to it. */}
            <li
              key={`end-${messages.length}-${asking ?? ''}`}
              aria-hidden
              ref={(node) => node?.scrollIntoView?.({ block: 'end' })}
            />
          </ol>

          <div className="flex flex-col gap-2 border-t border-border p-3">
            <ul aria-label={t('assistant.suggestions')} className="flex flex-wrap gap-2">
              {suggested.map((question) => (
                <li key={question}>
                  <button
                    type="button"
                    disabled={send.isPending}
                    onClick={() => send.mutate(question)}
                    className="rounded-pill border border-border px-3 py-1 text-small hover:border-brand hover:text-brand-strong"
                  >
                    {question}
                  </button>
                </li>
              ))}
            </ul>
            <form onSubmit={submit} className="flex gap-2">
              <Input
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder={t('assistant.input')}
                aria-label={t('assistant.input')}
                className="flex-1"
              />
              <Button type="submit" disabled={!text.trim() || send.isPending}>
                {t('assistant.send')}
              </Button>
            </form>
          </div>
        </section>
      </div>

      <AnalysisDrawer open={analysisOpen} onClose={() => setQuery({ view: null })} />
    </div>
  )
}

function Message({ message }: { message: AssistantMessage | Conversation['messages'][number] }) {
  const { t } = useTranslation()
  if (message.role === 'user') {
    return (
      <li className="max-w-[80%] self-end rounded-lg rounded-ee-sm bg-brand px-3.5 py-2.5 text-on-brand">
        <span className="sr-only">{t('assistant.you')}: </span>
        {message.text}
      </li>
    )
  }
  return (
    <li className="flex max-w-[90%] gap-2 self-start">
      <span
        aria-hidden
        className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-pill bg-brand-soft text-brand-strong"
      >
        <Sparkles className="size-4" />
      </span>
      <div className="rounded-lg rounded-es-sm border border-border bg-surface-0 px-3.5 py-2.5">
        <span className="sr-only">{t('assistant.bot')}: </span>
        <Answer blocks={message.blocks ?? []} />
      </div>
    </li>
  )
}
