import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useId, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { categoryQueries } from '@/entities/category'
import { ingredientQueries } from '@/entities/ingredient'
import {
  IMPORT_FIELDS,
  REQUIRED_IMPORT_FIELDS,
  previewImport,
  productQueries,
  runImport,
  undoImport,
  type DuplicateChoice,
  type ImportField,
  type ImportIssue,
  type ImportResult,
  type ImportRow,
} from '@/entities/product'
import { ApiError } from '@/shared/api'
import { cn } from '@/shared/lib/cn'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/field'
import { Steps } from '@/shared/ui/steps'
import { toast } from '@/shared/ui/toast'
import { guessMapping, normaliseDate, toImportRows, type ColumnTarget } from '../model/columns'
import { readTable, TableReadError, toCsv, type Table, type TableError } from '../model/table'

const LATER_KINDS = [
  ['opening', 5],
  ['categories', 3],
  ['ingredients', 3],
  ['customers', 7],
  ['suppliers', 4],
  ['invoice', 4],
] as const

const TEMPLATE_HEADERS: ImportField[] = [
  'name',
  'ingredient',
  'category',
  'barcode',
  'price',
  'quantity',
  'expiry',
  'cost',
]

function download(name: string, rows: string[][]) {
  const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

interface ImportWizardProps {
  /** Link to the product list after a successful import. */
  productsLink: ReactNode
}

/** Upload → match columns → check and fix → done (with undo). One step on screen at a time. */
export function ImportWizard({ productsLink }: ImportWizardProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const fileId = useId()
  const [table, setTable] = useState<Table | null>(null)
  const [readError, setReadError] = useState<TableError | null>(null)
  const [reading, setReading] = useState(false)
  const [mapping, setMapping] = useState<(ColumnTarget | null)[]>([])
  const [guessed, setGuessed] = useState<(ColumnTarget | null)[]>([])
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0)
  const [fixes, setFixes] = useState<Record<number, Partial<Record<ImportField, string>>>>({})
  const [duplicates, setDuplicates] = useState<Record<number, DuplicateChoice>>({})
  const [result, setResult] = useState<ImportResult | null>(null)

  const field = (name: ImportField) => t(`products.import.fields.${name}`)

  async function pick(file: File | undefined) {
    if (!file) return
    setReadError(null)
    setReading(true)
    try {
      const read = await readTable(file)
      const guess = guessMapping(read.headers)
      setTable(read)
      setMapping(guess)
      setGuessed(guess)
      setFixes({})
      setDuplicates({})
      setStep(1)
    } catch (error) {
      setReadError(error instanceof TableReadError ? error.reason : 'unreadable')
    } finally {
      setReading(false)
    }
  }

  // Step 2: what is wrong with the matching, if anything.
  const chosen = mapping.filter((target): target is ImportField => !!target && target !== 'ignore')
  const twice = chosen.find((target, index) => chosen.indexOf(target) !== index)
  const mappingProblem = mapping.some((target) => target === null)
    ? t('products.import.needAll')
    : twice
      ? t('products.import.usedTwice', { field: field(twice) })
      : REQUIRED_IMPORT_FIELDS.some((required) => !chosen.includes(required))
        ? t('products.import.needRequired')
        : null

  // Step 3: the rows with the person's fixes on top, checked by the server as they change.
  const baseRows: ImportRow[] = table && step >= 2 ? toImportRows(table, mapping) : []
  const rows = baseRows.map((row) => ({ ...row, ...fixes[row.line] }))
  const request = { rows, duplicates }
  const check = useQuery({
    queryKey: ['import-preview', request],
    queryFn: () => previewImport(request),
    enabled: step === 2,
    placeholderData: keepPreviousData,
  })
  const preview = check.data
  const blocking = preview?.issues.filter((issue) => issue.problem !== 'duplicate') ?? []

  const run = useMutation({
    mutationFn: () => runImport(request),
    onSuccess: async (done) => {
      setResult(done)
      setStep(3)
      await queryClient.invalidateQueries({ queryKey: productQueries.all })
      await queryClient.invalidateQueries({ queryKey: categoryQueries.all })
      await queryClient.invalidateQueries({ queryKey: ingredientQueries.all })
    },
    onError: () => toast.error(t('validation.serverError')),
  })

  const undo = useMutation({
    mutationFn: () => undoImport(result?.id ?? 0),
    onSuccess: async () => {
      toast.success(t('products.import.undone'))
      await queryClient.invalidateQueries({ queryKey: productQueries.all })
      await queryClient.invalidateQueries({ queryKey: categoryQueries.all })
      await queryClient.invalidateQueries({ queryKey: ingredientQueries.all })
      reset()
    },
    onError: (error) =>
      toast.error(
        error instanceof ApiError && error.status === 409
          ? t('products.import.undoRefused')
          : t('validation.serverError'),
      ),
  })

  function reset() {
    setTable(null)
    setMapping([])
    setResult(null)
    setStep(0)
  }

  function fix(issue: ImportIssue, value: string) {
    if (!issue.field) return
    const target = issue.field
    setFixes((current) => ({
      ...current,
      [issue.line]: {
        ...current[issue.line],
        [target]: target === 'expiry' ? normaliseDate(value) : value,
      },
    }))
  }

  function downloadProblems() {
    if (!table || !preview) return
    const lines = new Set(blocking.map((issue) => issue.line))
    download('import-problems.csv', [
      [t('products.import.line'), ...table.headers, t('products.import.problem')],
      ...table.rows.flatMap((cells, index) => {
        const issue = blocking.find((item) => item.line === index + 2)
        return lines.has(index + 2) && issue
          ? [[String(index + 2), ...cells, t(`products.import.problems.${issue.problem}`)]]
          : []
      }),
    ])
  }

  const matched = guessed.filter((target) => target !== null).length

  return (
    <div className="flex flex-col gap-5">
      <div className="overflow-x-auto rounded-lg border border-border bg-surface-100 shadow-card px-4 py-3">
        <Steps
          current={step}
          steps={[
            t('products.import.stepKind'),
            t('products.import.stepMap'),
            t('products.import.stepCheck'),
            t('products.import.stepDone'),
          ]}
        />
      </div>

      {step === 0 && (
        <section className="flex flex-col gap-4 rounded-lg border border-border bg-surface-100 shadow-card p-5">
          <h2 className="font-display text-title">{t('products.import.stepKind')}</h2>
          <fieldset className="flex flex-wrap gap-2">
            <legend className="sr-only">{t('products.import.stepKind')}</legend>
            <label className="flex items-center gap-2 rounded-md border-2 border-brand bg-brand-soft px-3 py-2 font-semibold text-brand-strong">
              <input type="radio" name="kind" checked readOnly className="accent-brand" />
              {t('products.import.kinds.products')}
            </label>
            {LATER_KINDS.map(([kind, module]) => (
              <label
                key={kind}
                className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-ink-muted"
              >
                <input type="radio" name="kind" disabled />
                {t(`products.import.kinds.${kind}`)}
                <span className="text-caption">· {t('products.import.kindLater', { module })}</span>
              </label>
            ))}
          </fieldset>

          {/* Dropping a file is an extra; the file input inside works with the keyboard. */}
          {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
          <label
            htmlFor={fileId}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault()
              void pick(event.dataTransfer.files[0])
            }}
            className="flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border-2 border-dashed border-border-strong px-6 py-10 text-center hover:border-brand hover:bg-brand-soft/40"
          >
            <span aria-hidden className="text-display text-brand">
              ⇪
            </span>
            <span className="font-semibold">
              {reading ? t('products.import.reading') : t('products.import.drop')}
            </span>
            <span className="text-small text-ink-muted">{t('products.import.dropHint')}</span>
            <input
              id={fileId}
              type="file"
              accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="sr-only"
              onChange={(event) => {
                void pick(event.target.files?.[0])
                event.target.value = ''
              }}
            />
          </label>
          {readError && (
            <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-small text-danger">
              {t(`products.import.errors.${readError}`)}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 text-small text-ink-muted">
            <span>{t('products.import.anyColumns')}</span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                download('pharmasmart-products.csv', [
                  TEMPLATE_HEADERS.map(field),
                  [
                    'Panadol Extra 24 Tablets',
                    'Paracetamol + Caffeine',
                    'مسكنات',
                    '6281100030011',
                    '21',
                    '120',
                    '2028-03-31',
                    '14',
                  ],
                ])
              }
            >
              {t('products.import.template')}
            </Button>
          </div>
        </section>
      )}

      {step === 1 && table && (
        <section className="flex flex-col gap-4 rounded-lg border border-border bg-surface-100 shadow-card p-5">
          <div>
            <h2 className="font-display text-title">{t('products.import.stepMap')}</h2>
            <p className="mt-0.5 text-small text-ink-muted">
              {t('products.import.fileSummary', {
                name: table.fileName,
                rows: table.rows.length,
                matched,
                columns: table.headers.length,
              })}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-body">
              <caption className="sr-only">{t('products.import.stepMap')}</caption>
              <thead>
                <tr className="border-b border-border text-small text-ink-muted">
                  <th className="px-2 py-2 text-start font-semibold">
                    {t('products.import.column')}
                  </th>
                  <th className="px-2 py-2 text-start font-semibold">
                    {t('products.import.example')}
                  </th>
                  <th className="px-2 py-2 text-start font-semibold">
                    {t('products.import.goesTo')}
                  </th>
                  <th className="px-2 py-2">
                    <span className="sr-only">{t('products.import.problem')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {table.headers.map((header, column) => {
                  const target = mapping[column] ?? null
                  const auto = guessed[column] !== null && guessed[column] === target
                  const state =
                    target === null
                      ? { label: t('products.import.needsChoice'), tone: 'warning' as const }
                      : target === 'ignore'
                        ? { label: t('products.import.ignored'), tone: 'neutral' as const }
                        : auto
                          ? { label: t('products.import.auto'), tone: 'success' as const }
                          : { label: t('products.import.chosen'), tone: 'brand' as const }
                  return (
                    // Columns are fixed by the file; their position is their identity.
                    // oxlint-disable-next-line react/no-array-index-key
                    <tr key={column} className="border-b border-border last:border-0">
                      <th scope="row" className="px-2 py-2.5 text-start font-semibold">
                        <bdi>{header || '—'}</bdi>
                      </th>
                      <td className="px-2 py-2.5 text-ink-muted">
                        <bdi>{table.rows[0]?.[column] ?? ''}</bdi>
                      </td>
                      <td className="px-2 py-2.5">
                        <select
                          aria-label={t('products.import.targetFor', { column: header })}
                          value={target ?? ''}
                          onChange={(event) => {
                            const next = [...mapping]
                            next[column] = (event.target.value || null) as ColumnTarget | null
                            setMapping(next)
                          }}
                          className={cn(
                            'h-9 rounded-md border bg-surface-100 px-2 text-small',
                            target === null ? 'border-warning' : 'border-border-strong',
                          )}
                        >
                          <option value="">{t('products.import.choose')}</option>
                          {IMPORT_FIELDS.map((option) => (
                            <option key={option} value={option}>
                              {field(option)}
                            </option>
                          ))}
                          <option value="ignore">{t('products.import.ignore')}</option>
                        </select>
                      </td>
                      <td className="px-2 py-2.5">
                        <Badge tone={state.tone}>{state.label}</Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {mappingProblem && <p className="text-small text-warning">{mappingProblem}</p>}
          <div className="flex gap-2">
            <Button disabled={mappingProblem !== null} onClick={() => setStep(2)}>
              {t('common.next')}
            </Button>
            <Button variant="ghost" onClick={reset}>
              {t('products.import.changeFile')}
            </Button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="flex flex-col gap-4 rounded-lg border border-border bg-surface-100 shadow-card p-5">
          <h2 className="font-display text-title">{t('products.import.stepCheck')}</h2>
          {!preview ? (
            <p className="text-small text-ink-muted">{t('products.import.checking')}</p>
          ) : (
            <>
              <ul className="flex flex-wrap gap-2" aria-live="polite">
                <li>
                  <Badge tone="success">
                    {t('products.import.ready', { count: preview.ready })}
                  </Badge>
                </li>
                {blocking.length > 0 && (
                  <li>
                    <Badge tone="warning">
                      {t('products.import.toFix', { count: blocking.length })}
                    </Badge>
                  </li>
                )}
                {preview.newCategories.length > 0 && (
                  <li>
                    <Badge tone="info">
                      {t('products.import.newCategories', { count: preview.newCategories.length })}
                    </Badge>
                  </li>
                )}
                {preview.newIngredients.length > 0 && (
                  <li>
                    <Badge tone="info">
                      {t('products.import.newIngredients', {
                        count: preview.newIngredients.length,
                      })}
                    </Badge>
                  </li>
                )}
              </ul>

              {preview.issues.length > 0 && (
                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="w-full text-body">
                    <caption className="sr-only">{t('products.import.problem')}</caption>
                    <thead>
                      <tr className="border-b border-border text-small text-ink-muted">
                        <th className="px-3 py-2 text-start font-semibold">
                          {t('products.import.line')}
                        </th>
                        <th className="px-3 py-2 text-start font-semibold">
                          {t('products.import.product')}
                        </th>
                        <th className="px-3 py-2 text-start font-semibold">
                          {t('products.import.problem')}
                        </th>
                        <th className="px-3 py-2 text-start font-semibold">
                          {t('products.import.fix')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.issues.map((issue) => (
                        <tr key={issue.line} className="border-b border-border last:border-0">
                          <td className="tabular px-3 py-2">{issue.line}</td>
                          <th scope="row" className="px-3 py-2 text-start font-normal">
                            <bdi>{issue.name}</bdi>
                          </th>
                          <td
                            className={cn(
                              'px-3 py-2',
                              issue.problem === 'duplicate' ? 'text-info' : 'text-warning',
                            )}
                          >
                            {t(`products.import.problems.${issue.problem}`)}
                          </td>
                          <td className="px-3 py-2">
                            {issue.problem === 'duplicate' ? (
                              <select
                                aria-label={t('products.import.fixLabel', {
                                  field: field('barcode'),
                                  line: issue.line,
                                })}
                                value={duplicates[issue.line] ?? 'update'}
                                onChange={(event) =>
                                  setDuplicates({
                                    ...duplicates,
                                    [issue.line]: event.target.value as DuplicateChoice,
                                  })
                                }
                                className="h-9 rounded-lg border border-border bg-surface-100 px-2 text-small"
                              >
                                <option value="update">
                                  {t('products.import.duplicateUpdate')}
                                </option>
                                <option value="skip">{t('products.import.duplicateSkip')}</option>
                              </select>
                            ) : issue.field && issue.field !== 'name' ? (
                              <Input
                                key={`${issue.line}-${issue.problem}`}
                                type={issue.field === 'expiry' ? 'date' : 'text'}
                                aria-label={t('products.import.fixLabel', {
                                  field: field(issue.field),
                                  line: issue.line,
                                })}
                                defaultValue={fixes[issue.line]?.[issue.field] ?? ''}
                                onBlur={(event) => fix(issue, event.target.value)}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter') fix(issue, event.currentTarget.value)
                                }}
                                inputMode={issue.field === 'expiry' ? undefined : 'decimal'}
                                className="h-9 w-40"
                              />
                            ) : (
                              <span className="text-small text-ink-muted">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {blocking.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-small text-ink-muted">{t('products.import.skippedNote')}</p>
                  <Button size="sm" variant="secondary" onClick={downloadProblems}>
                    {t('products.import.downloadProblems')}
                  </Button>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  disabled={preview.ready === 0 || run.isPending || check.isFetching}
                  onClick={() => run.mutate()}
                >
                  {t('products.import.run', { count: preview.ready })}
                </Button>
                <Button variant="ghost" onClick={() => setStep(1)}>
                  {t('common.back')}
                </Button>
              </div>
            </>
          )}
        </section>
      )}

      {step === 3 && result && (
        <section className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface-100 shadow-card p-8 text-center">
          <span
            aria-hidden
            className="flex size-12 items-center justify-center rounded-pill bg-success-soft text-title text-success"
          >
            ✓
          </span>
          <h2 className="font-display text-title">
            {t('products.import.doneTitle', { count: result.added })}
          </h2>
          <p className="text-body text-ink-muted">
            {t('products.import.doneBody', {
              categories: result.newCategories,
              ingredients: result.newIngredients,
              updated: result.updated,
            })}
          </p>
          {result.skipped > 0 && (
            <p className="text-small text-warning">
              {t('products.import.skipped', { count: result.skipped })}
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-2">
            {productsLink}
            <Button variant="secondary" onClick={reset}>
              {t('products.import.again')}
            </Button>
            <Button variant="ghost" disabled={undo.isPending} onClick={() => undo.mutate()}>
              {t('products.import.undo')}
            </Button>
          </div>
          <p className="text-caption text-ink-muted">{t('products.import.undoNote')}</p>
        </section>
      )}
    </div>
  )
}
