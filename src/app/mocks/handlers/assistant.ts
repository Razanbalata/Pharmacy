import { http, HttpResponse } from 'msw'
import type { AssistantBlock, AssistantMessage } from '@/pages/assistant'
import type { Analysis } from '@/widgets/smart-analysis'
import { normalizeArabic } from '@/shared/lib/arabic-search'
import { formatMoney, roundMoney } from '@/shared/lib/money'
import { apiUrl } from '../api-url'
import { db } from '../db'
import { quantityOf } from './catalog'
import { debtsReport, profitReport, salesReport, stockReport } from './reports'

/**
 * A stand-in for the real assistant. The backend sends the question and the pharmacy's numbers
 * to the language model; here the common questions are answered straight from the data, in the
 * same shape, so the screen can be built and tested.
 */
type Lang = 'ar' | 'en'
const DAY_MS = 86_400_000
const money = (value: number) => formatMoney(value)

function draftWith(productId: number) {
  return db.orders.find(
    (order) => order.status === 'draft' && order.lines.some((line) => line.productId === productId),
  )
}

/** Units sold a day over the last 30 days, from the sale movements. */
function dailyRate(productId: number): number {
  const product = db.products.find((item) => item.id === productId)
  const since = new Date(Date.parse(`${db.today}T00:00:00Z`) - 30 * DAY_MS).toISOString()
  const sold = (product?.movements ?? [])
    .filter((movement) => movement.kind === 'sale' && movement.at >= since)
    .reduce((sum, movement) => sum - movement.delta, 0)
  return Math.round((sold / 30) * 10) / 10
}

function restock(lang: Lang): AssistantBlock[] {
  const short = db.products
    .filter((product) => product.active && quantityOf(product) <= product.minStock)
    .sort((a, b) => quantityOf(a) / a.minStock - quantityOf(b) / b.minStock)
    .slice(0, 5)
  const rows = short.map((product) => {
    const quantity = quantityOf(product)
    const rate = dailyRate(product.id)
    const unit = product.units[0]?.name ?? ''
    const days = rate > 0 ? Math.floor(quantity / rate) : null
    const left =
      quantity === 0
        ? lang === 'ar'
          ? 'خلص'
          : 'out'
        : days === null
          ? '—'
          : lang === 'ar'
            ? `${days} يوم`
            : `${days} days`
    return [
      product.name,
      quantity,
      rate > 0 ? rate : '—',
      left,
      `${Math.max(1, product.minStock * 2 - quantity)} ${unit}`,
    ]
  })
  const drafts = short
    .map((product) => draftWith(product.id))
    .filter((order) => order !== undefined)
  const draft = drafts[0]
  const onDraft = short.filter((product) => draft && draftWith(product.id)?.id === draft.id).length
  return [
    {
      type: 'text',
      text:
        lang === 'ar'
          ? `في ${short.length} أصناف تحت الحد الأدنى أو قربت تخلص. رتبتهم من الأعجل:`
          : `${short.length} products are below their minimum or about to run out, most urgent first:`,
    },
    {
      type: 'table',
      columns:
        lang === 'ar'
          ? ['الصنف', 'المتوفر', 'بيع يومي', 'بيخلص خلال', 'اقتراح']
          : ['Product', 'In stock', 'Sold a day', 'Runs out in', 'Suggest'],
      rows,
    },
    ...(draft
      ? [
          {
            type: 'text' as const,
            text:
              lang === 'ar'
                ? `${onDraft === 1 ? 'صنف منهم موجود' : `${onDraft} منهم موجودين`} بطلب ${draft.number} المسودة، فما في داعي تعملي طلب جديد إلهم.`
                : `${onDraft} of them ${onDraft === 1 ? 'is' : 'are'} already on draft ${draft.number}; no need for a new order.`,
          },
        ]
      : []),
    {
      type: 'actions',
      items: [
        ...(draft ? [{ kind: 'order' as const, id: draft.id, label: draft.number }] : []),
        { kind: 'products', tab: 'low' },
      ],
    },
  ]
}

function profit(lang: Lang): AssistantBlock[] {
  const now = profitReport('month')
  const before = profitReport('lastMonth')
  const blocks: AssistantBlock[] = [
    {
      type: 'text',
      text:
        lang === 'ar'
          ? `صافي الربح هالشهر لحد اليوم ${money(now.net)} ₪، يعني ${now.netMargin}% من المبيعات. الربح الإجمالي ${money(now.gross)} ₪، وانطرح منه ${money(now.expenses)} ₪ مصاريف و${money(now.damage)} ₪ تالف.`
          : `Net profit this month so far is ${money(now.net)} ₪, ${now.netMargin}% of sales. Gross profit was ${money(now.gross)} ₪, less ${money(now.expenses)} ₪ of expenses and ${money(now.damage)} ₪ of damage.`,
    },
  ]
  if (before.sales > 0) {
    blocks.push({
      type: 'bars',
      items: [
        { label: lang === 'ar' ? 'هالشهر' : 'This month', value: now.net },
        { label: lang === 'ar' ? 'الشهر الماضي' : 'Last month', value: before.net },
      ],
    })
  } else {
    blocks.push({
      type: 'text',
      text:
        lang === 'ar'
          ? 'الشهر الماضي ما في مبيعات مسجلة بالنظام، فما بقدر أقارن. المقارنة بتصير دقيقة من الشهر الجاي.'
          : 'Last month has no sales on the system, so there is nothing to compare yet.',
    })
  }
  blocks.push({ type: 'actions', items: [{ kind: 'report', tab: 'profit' }] })
  return blocks
}

function stagnant(lang: Lang): AssistantBlock[] {
  const report = stockReport()
  const since = new Date(Date.parse(`${db.today}T00:00:00Z`) - 60 * DAY_MS).toISOString()
  const list = db.products
    .filter(
      (product) =>
        product.active &&
        quantityOf(product) > 0 &&
        !product.movements.some((movement) => movement.kind === 'sale' && movement.at >= since),
    )
    .map((product) => ({
      name: product.name,
      quantity: quantityOf(product),
      value: roundMoney(
        product.batches.reduce((sum, batch) => sum + batch.quantity * batch.cost, 0),
      ),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
  return [
    {
      type: 'text',
      text:
        lang === 'ar'
          ? `في ${report.stagnant.count} صنف ما انباع منهم ولا حبة من 60 يوم، قيمتهم ${money(report.stagnant.value)} ₪ بسعر الشراء. أكبرهم قيمة:`
          : `${report.stagnant.count} products have not sold in 60 days, worth ${money(report.stagnant.value)} ₪ at cost. The largest:`,
    },
    {
      type: 'table',
      columns: lang === 'ar' ? ['الصنف', 'الكمية', 'القيمة'] : ['Product', 'Quantity', 'Value'],
      rows: list.map((item) => [item.name, item.quantity, money(item.value)]),
    },
    {
      type: 'text',
      text:
        lang === 'ar'
          ? 'بتقدري توقفي طلبهم، أو ترجعي اللي بيقبله المورد.'
          : 'You could stop ordering them, or return what the supplier will take back.',
    },
    { type: 'actions', items: [{ kind: 'report', tab: 'stock' }] },
  ]
}

function debtor(lang: Lang): AssistantBlock[] {
  const report = debtsReport()
  // The most late is the one who has owed the longest.
  const late = report.top.filter((item) => item.late).sort((a, b) => b.days - a.days)
  const first = late[0] ?? report.top[0]
  if (!first) {
    return [
      {
        type: 'text',
        text: lang === 'ar' ? 'ما في ولا زبون عليه دين.' : 'No customer owes anything.',
      },
    ]
  }
  return [
    {
      type: 'text',
      text:
        lang === 'ar'
          ? `أكتر زبون متأخر ${first.name}: عليه ${money(first.debt)} ₪، وأقدم دين عليه من ${first.days} يوم. مجموع المتأخر أكتر من 30 يوم ${money(report.customers.late)} ₪ على ${late.length} زبائن.`
          : `${first.name} is the latest: ${money(first.debt)} ₪, the oldest debt ${first.days} days old. In all, ${money(report.customers.late)} ₪ is over 30 days late, across ${late.length} customers.`,
    },
    {
      type: 'actions',
      items: [
        { kind: 'customer', id: first.customerId, label: first.name },
        { kind: 'report', tab: 'debts' },
      ],
    },
  ]
}

function staff(lang: Lang): AssistantBlock[] {
  const report = salesReport('month')
  return [
    {
      type: 'text',
      text:
        lang === 'ar' ? 'مبيعات كل موظف هالشهر لحد اليوم:' : 'Sales by staff this month so far:',
    },
    {
      type: 'table',
      columns:
        lang === 'ar'
          ? ['الموظف', 'المبيعات', 'الفواتير', 'متوسط الفاتورة']
          : ['Staff', 'Sales', 'Invoices', 'Average'],
      rows: report.byStaff.map((member) => [
        member.name,
        money(member.total),
        member.invoices,
        money(member.invoices ? member.total / member.invoices : 0),
      ]),
    },
    {
      type: 'text',
      text:
        lang === 'ar'
          ? 'الفرق بالمجموع غالباً من عدد الورديات، فقارني متوسط الفاتورة كمان.'
          : 'Totals mostly follow the number of shifts, so compare the average invoice too.',
    },
    { type: 'actions', items: [{ kind: 'report', tab: 'sales' }] },
  ]
}

function expiring(lang: Lang): AssistantBlock[] {
  const [year, month] = db.today.split('-').map(Number) as [number, number]
  const next = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 7)
  const list = db.products
    .filter((product) => product.active)
    .flatMap((product) =>
      product.batches
        .filter((batch) => batch.quantity > 0 && batch.expiry.slice(0, 7) === next)
        .map(
          (batch) =>
            [product.name, batch.code, batch.expiry, batch.quantity] as (string | number)[],
        ),
    )
  if (list.length === 0) {
    return [
      {
        type: 'text',
        text: lang === 'ar' ? 'ما في ولا دفعة بتنتهي الشهر الجاي.' : 'Nothing expires next month.',
      },
      { type: 'actions', items: [{ kind: 'products', tab: 'soon' }] },
    ]
  }
  return [
    {
      type: 'text',
      text:
        lang === 'ar'
          ? `${list.length === 1 ? 'دفعة وحدة بتنتهي' : `${list.length} دفعات بتنتهي`} الشهر الجاي:`
          : `${list.length} ${list.length === 1 ? 'batch expires' : 'batches expire'} next month:`,
    },
    {
      type: 'table',
      columns:
        lang === 'ar'
          ? ['الصنف', 'الدفعة', 'تنتهي', 'الكمية']
          : ['Product', 'Batch', 'Expires', 'Quantity'],
      rows: list,
    },
    {
      type: 'actions',
      items: [
        { kind: 'products', tab: 'soon' },
        { kind: 'report', tab: 'stock' },
      ],
    },
  ]
}

const INTENTS: [string[], (lang: Lang) => AssistantBlock[]][] = [
  [
    ['اطلب', 'طلبيه', 'طلبيات', 'نواقص', 'يخلص', 'ناقص', 'order', 'restock', 'running out'],
    restock,
  ],
  [['ربح', 'ارباح', 'profit'], profit],
  [['راكد', 'stagnant', 'not selling', 'slow'], stagnant],
  [['مديون', 'متاخر', 'دين', 'ديون', 'debt', 'owes', 'late'], debtor],
  [['قارن', 'موظف', 'محمد', 'ساره', 'staff', 'compare'], staff],
  [['ينتهي', 'بينتهي', 'انتهاء', 'صلاحيه', 'expir'], expiring],
]

export function answer(question: string, lang: Lang): AssistantBlock[] {
  const text = normalizeArabic(question.toLowerCase())
  const found = INTENTS.find(([words]) =>
    words.some((word) => text.includes(normalizeArabic(word))),
  )
  if (found) return found[1](lang)
  return [
    {
      type: 'text',
      text:
        lang === 'ar'
          ? 'ما فهمت السؤال منيح. بقدر أجاوب عن: شو لازم تطلبي، الربح، الأصناف الراكدة، الديون، مبيعات الموظفين، وشو بينتهي قريباً.'
          : 'I did not quite get that. I can answer about what to order, profit, slow movers, debts, staff sales, and what expires soon.',
    },
  ]
}

function analysis(lang: Lang): Analysis {
  const sales = salesReport('month')
  const money30 = stockReport().within30
  const debts = debtsReport()
  const month = profitReport('month')
  const urgent = db.products
    .filter(
      (product) =>
        product.active && quantityOf(product) > 0 && quantityOf(product) <= product.minStock,
    )
    .sort((a, b) => quantityOf(a) / a.minStock - quantityOf(b) / b.minStock)[0]
  const draft = urgent ? draftWith(urgent.id) : undefined
  const best = month.byCategory
    .filter((row) => !row.archived && row.sales > 0)
    .sort((a, b) => b.profit / b.sales - a.profit / a.sales)[0]
  const items: Analysis['items'] = []
  if (urgent) {
    items.push({
      tag: 'urgent',
      title: lang === 'ar' ? `${urgent.name} قرب يخلص` : `${urgent.name} is running out`,
      text:
        lang === 'ar'
          ? `باقي ${quantityOf(urgent)} من حد أدنى ${urgent.minStock}.${draft ? ` هو موجود بطلب ${draft.number} المسودة، بس الطلب لسا ما انبعت.` : ''}`
          : `${quantityOf(urgent)} left of a ${urgent.minStock} minimum.${draft ? ` It is on draft ${draft.number}, not sent yet.` : ''}`,
      action: draft
        ? { kind: 'order', id: draft.id, label: draft.number }
        : { kind: 'products', tab: 'low' },
    })
  }
  if (money30.count > 0) {
    items.push({
      tag: 'week',
      title:
        lang === 'ar'
          ? `${money30.count} أصناف بينتهوا خلال 30 يوم`
          : `${money30.count} products expire within 30 days`,
      text:
        lang === 'ar'
          ? `قيمتهم ${money(money30.value)} ₪ بسعر الشراء. بيعيهم أول، أو خصم بسيط.`
          : `Worth ${money(money30.value)} ₪ at cost. Sell them first, or a small discount.`,
      action: { kind: 'report', tab: 'stock' },
    })
  }
  if (debts.customers.late > 0) {
    items.push({
      tag: 'week',
      title:
        lang === 'ar'
          ? `ديون متأخرة ${money(debts.customers.late)} ₪`
          : `Late debts ${money(debts.customers.late)} ₪`,
      text:
        lang === 'ar'
          ? `${debts.reminders.length} زبائن صار عليهم أكتر من 30 يوم.`
          : `${debts.reminders.length} customers have owed for over 30 days.`,
      action: { kind: 'report', tab: 'debts' },
    })
  }
  if (best) {
    const margin = Math.round((best.profit / best.sales) * 100)
    items.push({
      tag: 'chance',
      title: lang === 'ar' ? `${best.name} أعلى هامش` : `${best.name} has the best margin`,
      text:
        lang === 'ar'
          ? `هامشها ${margin}% هالشهر. انتبهي إن مخزونها يضل كافي.`
          : `A ${margin}% margin this month. Keep it in stock.`,
      action: { kind: 'report', tab: 'profit' },
    })
  }
  const peak = sales.series.points.reduce((top, point) => (point.total > top.total ? point : top), {
    date: '',
    total: 0,
  })
  const urgentCount = items.filter((item) => item.tag === 'urgent').length
  return {
    at: new Date().toISOString(),
    status: urgentCount > 1 ? 'bad' : urgentCount === 1 || items.length > 2 ? 'attention' : 'good',
    headline:
      lang === 'ar'
        ? `جيد، مع ${items.length - (best ? 1 : 0)} نقاط بدها انتباه`
        : `Good, with ${items.length - (best ? 1 : 0)} points to watch`,
    items,
    summary:
      lang === 'ar'
        ? `المبيعات هالشهر لحد اليوم ${money(sales.sales)} ₪، وصافي الربح ${money(month.net)} ₪. أعلى يوم كان ${peak.date.slice(8)}/${peak.date.slice(5, 7)} بـ ${money(peak.total)} ₪.`
        : `Sales this month so far are ${money(sales.sales)} ₪, net profit ${money(month.net)} ₪. The best day was ${peak.date.slice(8)}/${peak.date.slice(5, 7)} with ${money(peak.total)} ₪.`,
  }
}

const langOf = (value: string | null | undefined): Lang => (value === 'en' ? 'en' : 'ar')

/** Works out the stored questions the first time a conversation is opened. */
function settle(id: number, lang: Lang) {
  const conversation = db.conversations.find((item) => item.id === id)
  if (!conversation) return undefined
  for (const question of conversation.pending) {
    const at = conversation.at
    const next = () =>
      Math.max(0, ...db.conversations.flatMap((item) => item.messages.map((m) => m.id))) + 1
    conversation.messages.push({ id: next(), role: 'user', at, text: question })
    conversation.messages.push({
      id: next(),
      role: 'assistant',
      at,
      blocks: answer(question, lang),
    })
  }
  conversation.pending = []
  return conversation
}

export const assistantHandlers = [
  http.get(apiUrl('/api/assistant/conversations'), () =>
    HttpResponse.json({
      data: [...db.conversations]
        .sort((a, b) => b.at.localeCompare(a.at))
        .map(({ id, title, at }) => ({ id, title, at })),
    }),
  ),
  http.post(apiUrl('/api/assistant/conversations'), () => {
    const conversation = {
      id: Math.max(0, ...db.conversations.map((item) => item.id)) + 1,
      title: '',
      at: new Date().toISOString(),
      messages: [] as AssistantMessage[],
      pending: [] as string[],
    }
    db.conversations.push(conversation)
    return HttpResponse.json({ data: conversation }, { status: 201 })
  }),
  http.get(apiUrl('/api/assistant/conversations/:id'), ({ params, request }) => {
    const conversation = settle(
      Number(params.id),
      langOf(new URL(request.url).searchParams.get('language')),
    )
    if (!conversation) return HttpResponse.json({ message: 'Not found.' }, { status: 404 })
    const { pending: _pending, ...data } = conversation
    return HttpResponse.json({ data })
  }),
  http.post(apiUrl('/api/assistant/conversations/:id/messages'), async ({ params, request }) => {
    const conversation = db.conversations.find((item) => item.id === Number(params.id))
    if (!conversation) return HttpResponse.json({ message: 'Not found.' }, { status: 404 })
    const input = (await request.json()) as { text: string; language?: string }
    const text = input.text.trim()
    if (!text) {
      return HttpResponse.json(
        { message: 'The given data was invalid.', errors: { text: ['required'] } },
        { status: 422 },
      )
    }
    const at = new Date().toISOString()
    const next = () =>
      Math.max(0, ...db.conversations.flatMap((item) => item.messages.map((m) => m.id))) + 1
    conversation.messages.push({ id: next(), role: 'user', at, text })
    const reply: AssistantMessage = {
      id: next(),
      role: 'assistant',
      at,
      blocks: answer(text, langOf(input.language)),
    }
    conversation.messages.push(reply)
    if (!conversation.title) conversation.title = text.length > 40 ? `${text.slice(0, 40)}…` : text
    conversation.at = at
    return HttpResponse.json({ data: reply }, { status: 201 })
  }),
  http.get(apiUrl('/api/assistant/analysis'), ({ request }) =>
    HttpResponse.json({
      data: analysis(langOf(new URL(request.url).searchParams.get('language'))),
    }),
  ),
]
