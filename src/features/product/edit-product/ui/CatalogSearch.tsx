import { useQuery } from '@tanstack/react-query'
import { useDeferredValue, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { productQueries, type CatalogEntry } from '@/entities/product'
import { Input } from '@/shared/ui/field'

interface CatalogSearchProps {
  onPick: (entry: CatalogEntry) => void
}

/**
 * Search the shared drug list. Picking a drug fills the form, so most products are added
 * in a few seconds: check the details, set the price, save.
 */
export function CatalogSearch({ onPick }: CatalogSearchProps) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const deferred = useDeferredValue(search)
  const { data: results = [], isFetching, isSuccess } = useQuery(productQueries.catalog(deferred))
  const searching = deferred.trim().length >= 2

  return (
    <section className="rounded-lg border border-brand bg-brand-soft p-4">
      <label htmlFor="catalog-search" className="text-small font-semibold text-brand-strong">
        {t('products.form.catalogHint')}
      </label>
      <Input
        id="catalog-search"
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={t('products.form.catalogSearch')}
        className="mt-2 bg-surface-100"
        autoComplete="off"
      />
      {searching && isSuccess && !isFetching && results.length === 0 && (
        <p className="mt-2 text-small text-ink-muted">{t('products.form.catalogEmpty')}</p>
      )}
      {searching && results.length > 0 && (
        <ul className="mt-2 flex flex-col overflow-hidden rounded-md border border-border bg-surface-100">
          {results.map((entry) => (
            <li key={entry.id} className="border-b border-border last:border-0">
              <button
                type="button"
                onClick={() => {
                  onPick(entry)
                  setSearch('')
                }}
                className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-start hover:bg-surface-200"
              >
                <span className="flex flex-col">
                  <bdi className="font-semibold">{entry.name}</bdi>
                  <bdi className="text-caption text-ink-muted">{entry.ingredientName}</bdi>
                </span>
                <span className="text-caption text-ink-muted">{entry.manufacturer}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
