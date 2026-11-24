import {
  useFieldArray,
  useWatch,
  type Control,
  type UseFormRegister,
  type FieldErrors,
} from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useErrorText } from '@/shared/lib/forms'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/field'
import { Switch } from '@/shared/ui/switch'
import type { ProductFormInput } from '../model/schema'

interface UnitsEditorProps {
  control: Control<ProductFormInput>
  register: UseFormRegister<ProductFormInput>
  errors: FieldErrors<ProductFormInput>['units']
}

const cell = 'px-2 py-2 align-top'

/**
 * Box → strip → tablet. Each row says how many fit in the row above and its own price,
 * and whether it can be sold that way.
 */
export function UnitsEditor({ control, register, errors }: UnitsEditorProps) {
  const { t } = useTranslation()
  const errorText = useErrorText()
  const { fields, append, remove } = useFieldArray({ control, name: 'units' })
  const units = useWatch({ control, name: 'units' })

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <table className="w-full text-body">
          <caption className="sr-only">{t('products.form.units')}</caption>
          <thead>
            <tr className="text-small text-ink-muted">
              <th className={`${cell} text-start font-semibold`}>{t('products.form.unitName')}</th>
              <th className={`${cell} text-start font-semibold`}>{t('products.form.perParent')}</th>
              <th className={`${cell} text-start font-semibold`}>{t('products.form.unitPrice')}</th>
              <th className={`${cell} text-start font-semibold`}>
                {t('products.form.unitEnabled')}
              </th>
              <th className={cell}>
                <span className="sr-only">{t('products.form.removeUnit')}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => {
              const name = units[index]?.name || t('products.form.unitName')
              const parent = units[index - 1]?.name ?? ''
              const rowErrors = errors?.[index]
              return (
                <tr key={field.id} className="border-t border-border">
                  <td className={cell}>
                    <Input
                      aria-label={`${t('products.form.unitName')} ${index + 1}`}
                      {...register(`units.${index}.name`)}
                      className="w-28"
                    />
                  </td>
                  <td className={cell}>
                    {index === 0 ? (
                      <span className="inline-block pt-2 text-small text-ink-muted">
                        {t('products.form.baseUnit')}
                      </span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-2">
                          <Input
                            aria-label={`${t('products.form.perParent')}: ${name}`}
                            {...register(`units.${index}.perParent`)}
                            inputMode="numeric"
                            aria-invalid={rowErrors?.perParent ? true : undefined}
                            className="tabular w-20"
                          />
                          <span className="text-small text-ink-muted">
                            {t('products.form.inParent', { unit: parent })}
                          </span>
                        </span>
                        {rowErrors?.perParent && (
                          <span className="text-small text-danger">
                            {errorText(rowErrors.perParent.message)}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className={cell}>
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-2">
                        <Input
                          aria-label={`${t('products.form.unitPrice')}: ${name}`}
                          {...register(`units.${index}.price`)}
                          inputMode="decimal"
                          aria-invalid={rowErrors?.price ? true : undefined}
                          className="tabular w-24"
                        />
                        <span className="text-small text-ink-muted">₪</span>
                      </span>
                      {rowErrors?.price && (
                        <span className="text-small text-danger">
                          {errorText(rowErrors.price.message)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={cell}>
                    <div className="flex flex-col gap-1 pt-2">
                      <Switch
                        aria-label={`${t('products.form.unitEnabled')}: ${name}`}
                        {...register(`units.${index}.enabled`)}
                      />
                      {rowErrors?.enabled && (
                        <span className="text-small text-danger">
                          {errorText(rowErrors.enabled.message)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={cell}>
                    {index > 0 && index === fields.length - 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`${t('products.form.removeUnit')}: ${name}`}
                        onClick={() => remove(index)}
                      >
                        ✕
                      </Button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {fields.length < 3 && (
        <Button
          size="sm"
          variant="secondary"
          className="self-start"
          onClick={() => append({ name: '', perParent: '', price: '', enabled: true })}
        >
          + {t('products.form.addUnit')}
        </Button>
      )}
    </div>
  )
}
