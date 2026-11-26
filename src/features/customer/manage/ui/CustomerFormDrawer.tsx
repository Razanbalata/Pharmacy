import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { createCustomer, customerQueries, updateCustomer, type Customer } from '@/entities/customer'
import { pharmacyQueries } from '@/entities/pharmacy'
import { useCurrentUser } from '@/entities/session'
import { applyServerErrors, useErrorText } from '@/shared/lib/forms'
import { formatMoney } from '@/shared/lib/money'
import { isPhoneNumber, normalizePhone } from '@/shared/lib/validation'
import { Button } from '@/shared/ui/button'
import { Drawer } from '@/shared/ui/dialog'
import { Field, Input, Textarea } from '@/shared/ui/field'
import { toast } from '@/shared/ui/toast'

const amount = z
  .string()
  .trim()
  .refine((value) => value === '' || Number(value) >= 0, 'customerForm.amountInvalid')

const schema = z
  .object({
    name: z.string().trim().min(1, 'validation.required'),
    phone: z
      .string()
      .trim()
      .refine((value) => value === '' || isPhoneNumber(value), 'customerForm.phoneInvalid'),
    creditAllowed: z.boolean(),
    debtLimit: amount,
    openingDebt: amount,
    notes: z.string().trim(),
  })
  .refine((values) => !values.creditAllowed || values.phone !== '', {
    path: ['phone'],
    message: 'customerForm.phoneRequired',
  })
type Values = z.infer<typeof schema>

interface CustomerFormDrawerProps {
  open: boolean
  onClose: () => void
  /** Editing this customer; omitted to add one. */
  customer?: Customer | null
  /** A name to start with, e.g. what was typed at the till. */
  initialName?: string
  onSaved?: (customer: Customer) => void
}

/**
 * Adds or edits a customer. A cashier sees the name and phone only: the debt limit and an old
 * notebook debt are the manager's to set.
 */
export function CustomerFormDrawer({
  open,
  onClose,
  customer,
  initialName = '',
  onSaved,
}: CustomerFormDrawerProps) {
  const { t } = useTranslation()
  const errorText = useErrorText()
  const queryClient = useQueryClient()
  const { data: user } = useCurrentUser()
  const quick = user?.role === 'cashier'
  const { data: settings } = useQuery({ ...pharmacyQueries.settings(), enabled: open && !quick })
  const defaultLimit = settings?.sale.defaultDebtLimit ?? 300
  const { register, handleSubmit, formState, setError, control } = useForm<Values>({
    resolver: zodResolver(schema),
    values: {
      name: customer?.name ?? initialName,
      phone: customer?.phone ?? '',
      creditAllowed: customer?.creditAllowed ?? true,
      debtLimit: String(customer?.debtLimit ?? defaultLimit),
      openingDebt: '',
      notes: customer?.notes ?? '',
    },
  })
  const creditAllowed = useWatch({ control, name: 'creditAllowed' })

  const save = useMutation({
    mutationFn: (values: Values) => {
      const input = {
        name: values.name,
        phone: values.phone ? normalizePhone(values.phone) : '',
        creditAllowed: quick ? values.phone !== '' : values.creditAllowed,
        debtLimit: values.creditAllowed ? Number(values.debtLimit || 0) : 0,
        notes: values.notes,
      }
      return customer
        ? updateCustomer(customer.id, input)
        : createCustomer({ ...input, openingDebt: Number(values.openingDebt || 0) })
    },
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: customerQueries.all })
      toast.success(t('customerForm.saved', { name: saved.name }))
      onSaved?.(saved)
      onClose()
    },
    onError: (error) => {
      const message = applyServerErrors(error, setError, {
        taken: 'customerForm.phoneTaken',
        invalid: 'customerForm.phoneInvalid',
        requiredForCredit: 'customerForm.phoneRequired',
      })
      if (message) toast.error(t(message))
    },
  })

  const errors = formState.errors
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={
        customer ? t('customerForm.editTitle', { name: customer.name }) : t('customerForm.newTitle')
      }
      footer={
        <>
          <Button type="submit" form="customer-form" disabled={save.isPending}>
            {t('customerForm.save')}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
        </>
      }
    >
      <form
        id="customer-form"
        noValidate
        onSubmit={handleSubmit((values) => save.mutate(values))}
        className="flex flex-col gap-4"
      >
        <Field label={t('customerForm.name')} error={errorText(errors.name?.message)}>
          {(field) => <Input {...field} {...register('name')} />}
        </Field>
        <Field
          label={t('customerForm.phone')}
          hint={t('customerForm.phoneHint')}
          error={errorText(errors.phone?.message)}
        >
          {(field) => (
            <Input
              {...field}
              {...register('phone')}
              dir="ltr"
              inputMode="tel"
              className="tabular text-start"
            />
          )}
        </Field>

        {quick ? (
          <p className="rounded-md bg-surface-200 px-3 py-2 text-small text-ink-muted">
            {t('customerForm.cashierNote')}
          </p>
        ) : (
          <>
            <label className="flex items-center gap-2 text-body">
              <input
                type="checkbox"
                {...register('creditAllowed')}
                className="size-4 accent-brand"
              />
              {t('customerForm.creditAllowed')}
            </label>
            {creditAllowed && (
              <Field
                label={t('customerForm.debtLimit')}
                hint={t('customerForm.debtLimitHint', { amount: formatMoney(defaultLimit) })}
                error={errorText(errors.debtLimit?.message)}
              >
                {(field) => (
                  <Input
                    {...field}
                    {...register('debtLimit')}
                    inputMode="decimal"
                    className="tabular w-36"
                  />
                )}
              </Field>
            )}
            {!customer && (
              <Field
                label={t('customerForm.openingDebt')}
                hint={t('customerForm.openingDebtHint')}
                error={errorText(errors.openingDebt?.message)}
                optional
              >
                {(field) => (
                  <Input
                    {...field}
                    {...register('openingDebt')}
                    inputMode="decimal"
                    className="tabular w-36"
                  />
                )}
              </Field>
            )}
            <Field label={t('customerForm.notes')} optional>
              {(field) => <Textarea {...field} {...register('notes')} rows={3} />}
            </Field>
          </>
        )}
      </form>
    </Drawer>
  )
}
