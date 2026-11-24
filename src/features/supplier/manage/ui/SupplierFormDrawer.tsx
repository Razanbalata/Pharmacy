import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { createSupplier, supplierQueries, updateSupplier, type Supplier } from '@/entities/supplier'
import { applyServerErrors, useErrorText } from '@/shared/lib/forms'
import { isPhoneNumber, normalizePhone } from '@/shared/lib/validation'
import { Button } from '@/shared/ui/button'
import { Drawer } from '@/shared/ui/dialog'
import { Field, Input, Textarea } from '@/shared/ui/field'
import { toast } from '@/shared/ui/toast'

const schema = z.object({
  name: z.string().trim().min(1, 'validation.required'),
  contactName: z.string().trim(),
  phone: z
    .string()
    .trim()
    .refine((value) => value === '' || isPhoneNumber(value), 'suppliers.form.phoneInvalid'),
  address: z.string().trim(),
  notes: z.string().trim(),
})
type Values = z.infer<typeof schema>

interface SupplierFormDrawerProps {
  open: boolean
  onClose: () => void
  /** Editing this supplier; omitted to add one. */
  supplier?: Supplier | null
  onSaved?: (supplier: Supplier) => void
}

export function SupplierFormDrawer({ open, onClose, supplier, onSaved }: SupplierFormDrawerProps) {
  const { t } = useTranslation()
  const errorText = useErrorText()
  const queryClient = useQueryClient()
  const { register, handleSubmit, formState, setError } = useForm<Values>({
    resolver: zodResolver(schema),
    values: {
      name: supplier?.name ?? '',
      contactName: supplier?.contactName ?? '',
      phone: supplier?.phone ?? '',
      address: supplier?.address ?? '',
      notes: supplier?.notes ?? '',
    },
  })

  const save = useMutation({
    mutationFn: (values: Values) => {
      const input = { ...values, phone: values.phone ? normalizePhone(values.phone) : '' }
      return supplier ? updateSupplier(supplier.id, input) : createSupplier(input)
    },
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: supplierQueries.all })
      toast.success(t('suppliers.form.saved', { name: saved.name }))
      onSaved?.(saved)
      onClose()
    },
    onError: (error) => {
      const message = applyServerErrors(error, setError, { taken: 'suppliers.form.nameTaken' })
      if (message) toast.error(t(message))
    },
  })

  const errors = formState.errors
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={
        supplier
          ? t('suppliers.form.editTitle', { name: supplier.name })
          : t('suppliers.form.newTitle')
      }
      footer={
        <>
          <Button type="submit" form="supplier-form" disabled={save.isPending}>
            {t('suppliers.form.save')}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
        </>
      }
    >
      <form
        id="supplier-form"
        noValidate
        onSubmit={handleSubmit((values) => save.mutate(values))}
        className="flex flex-col gap-4"
      >
        <Field label={t('suppliers.form.name')} error={errorText(errors.name?.message)}>
          {(field) => <Input {...field} {...register('name')} />}
        </Field>
        <Field
          label={t('suppliers.form.contactName')}
          hint={t('suppliers.form.contactHint')}
          optional
        >
          {(field) => <Input {...field} {...register('contactName')} />}
        </Field>
        <Field label={t('suppliers.form.phone')} error={errorText(errors.phone?.message)} optional>
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
        <Field label={t('suppliers.form.address')} optional>
          {(field) => <Input {...field} {...register('address')} />}
        </Field>
        <Field label={t('suppliers.form.notes')} optional>
          {(field) => <Textarea {...field} {...register('notes')} rows={3} />}
        </Field>
      </form>
    </Drawer>
  )
}
