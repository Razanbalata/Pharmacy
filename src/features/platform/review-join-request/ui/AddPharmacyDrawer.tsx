import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { addPharmacyManually, joinRequestQueries } from '@/entities/platform/join-request'
import { CityPicker } from '@/entities/pharmacy'
import { applyServerErrors, useErrorText } from '@/shared/lib/forms'
import { isMobileNumber, normalizePhone } from '@/shared/lib/validation'
import { Button } from '@/shared/ui/button'
import { Drawer } from '@/shared/ui/dialog'
import { Field, Input } from '@/shared/ui/field'
import { toast } from '@/shared/ui/toast'

const required = z.string().trim().min(1, 'validation.required')
const schema = z.object({
  pharmacyName: required,
  ownerName: required,
  city: required,
  phone: z.string().refine(isMobileNumber, 'validation.phone').transform(normalizePhone),
  licenseNumber: required,
})
type Input = z.input<typeof schema>
type Output = z.output<typeof schema>

/** For a pharmacy that called instead of filling the form. It is approved at once. */
export function AddPharmacyDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const errorText = useErrorText()
  const queryClient = useQueryClient()
  const form = useForm<Input, unknown, Output>({
    resolver: zodResolver(schema),
    defaultValues: { pharmacyName: '', ownerName: '', city: '', phone: '', licenseNumber: '' },
  })
  const mutation = useMutation({
    mutationFn: addPharmacyManually,
    onSuccess: async (created) => {
      toast.success(t('platform.requests.added', { pharmacy: created.pharmacyName }))
      await queryClient.invalidateQueries({ queryKey: joinRequestQueries.all })
      form.reset()
      onClose()
    },
    onError: (error) => applyServerErrors(error, form.setError, { taken: 'validation.phoneTaken' }),
  })
  const { register, formState, control } = form

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t('platform.requests.addTitle')}
      footer={
        <>
          <Button type="submit" form="add-pharmacy" disabled={mutation.isPending}>
            {t('platform.requests.addSubmit')}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
        </>
      }
    >
      <form
        id="add-pharmacy"
        noValidate
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        className="flex flex-col gap-4"
      >
        <Field
          label={t('auth.join.pharmacyName')}
          error={errorText(formState.errors.pharmacyName?.message)}
        >
          {(field) => <Input {...field} {...register('pharmacyName')} />}
        </Field>
        <Field
          label={t('auth.join.ownerName')}
          error={errorText(formState.errors.ownerName?.message)}
        >
          {(field) => <Input {...field} {...register('ownerName')} />}
        </Field>
        <Field label={t('auth.join.city')} error={errorText(formState.errors.city?.message)}>
          {(field) => (
            <Controller
              control={control}
              name="city"
              render={({ field: { value, onChange } }) => (
                <CityPicker {...field} value={value} onChange={onChange} />
              )}
            />
          )}
        </Field>
        <Field label={t('auth.join.phone')} error={errorText(formState.errors.phone?.message)}>
          {(field) => (
            <Input
              {...field}
              {...register('phone')}
              inputMode="tel"
              dir="ltr"
              className="text-start"
            />
          )}
        </Field>
        <Field
          label={t('auth.join.license')}
          error={errorText(formState.errors.licenseNumber?.message)}
        >
          {(field) => (
            <Input {...field} {...register('licenseNumber')} dir="ltr" className="text-start" />
          )}
        </Field>
      </form>
    </Drawer>
  )
}
