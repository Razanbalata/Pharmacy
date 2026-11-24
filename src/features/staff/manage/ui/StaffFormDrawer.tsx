import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  createStaff,
  staffQueries,
  TemporaryPasswordDialog,
  updateStaff,
  type StaffMember,
} from '@/entities/staff-member'
import { cn } from '@/shared/lib/cn'
import { applyServerErrors, useErrorText } from '@/shared/lib/forms'
import { Button } from '@/shared/ui/button'
import { Drawer } from '@/shared/ui/dialog'
import { Field, Input } from '@/shared/ui/field'
import { toast } from '@/shared/ui/toast'
import { staffSchema, type StaffFormInput, type StaffFormValues } from '../model/schema'

interface StaffFormDrawerProps {
  open: boolean
  onClose: () => void
  /** Editing this member; omitted to add a new one. */
  member?: StaffMember | null
}

function defaults(member?: StaffMember | null): StaffFormInput {
  return {
    name: member?.name ?? '',
    phone: member?.phone ?? '',
    email: member?.email ?? '',
    role: member && member.role !== 'manager' ? member.role : 'pharmacist',
    discountLimit: member?.discountLimit ?? 10,
    permissions: member?.permissions ?? {
      sellOnCredit: true,
      seePurchasePrice: false,
      approveCounts: true,
    },
  }
}

/** Add or edit a pharmacist or cashier. New members get a temporary password to send them. */
export function StaffFormDrawer({ open, onClose, member }: StaffFormDrawerProps) {
  const { t } = useTranslation()
  const errorText = useErrorText()
  const queryClient = useQueryClient()
  const [created, setCreated] = useState<{ name: string; phone: string; password: string } | null>(
    null,
  )
  const form = useForm<StaffFormInput, unknown, StaffFormValues>({
    resolver: zodResolver(staffSchema),
    values: defaults(member),
  })
  const { register, formState, control, handleSubmit, setError } = form
  const role = useWatch({ control, name: 'role' })

  const mutation = useMutation({
    mutationFn: async (values: StaffFormValues) => {
      if (member) {
        await updateStaff(member.id, values)
        return null
      }
      return createStaff(values)
    },
    onSuccess: async (result, values) => {
      await queryClient.invalidateQueries({ queryKey: staffQueries.all })
      toast.success(t('staff.form.saved', { name: values.name }))
      onClose()
      if (result)
        setCreated({ name: result.name, phone: result.phone, password: result.temporaryPassword })
    },
    onError: (error) => applyServerErrors(error, setError, { taken: 'validation.phoneTaken' }),
  })

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        title={member ? t('staff.form.editTitle', { name: member.name }) : t('staff.form.newTitle')}
        footer={
          <>
            <Button type="submit" form="staff-form" disabled={mutation.isPending}>
              {mutation.isPending ? t('staff.form.saving') : t('staff.form.save')}
            </Button>
            <Button variant="ghost" onClick={onClose}>
              {t('common.cancel')}
            </Button>
          </>
        }
      >
        <form
          id="staff-form"
          noValidate
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          className="flex flex-col gap-4"
        >
          <Field label={t('staff.form.name')} error={errorText(formState.errors.name?.message)}>
            {(field) => <Input {...field} {...register('name')} />}
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label={t('staff.form.phone')}
              hint={t('staff.form.phoneHint')}
              error={errorText(formState.errors.phone?.message)}
            >
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
              label={t('staff.form.email')}
              optional
              error={errorText(formState.errors.email?.message)}
            >
              {(field) => (
                <Input
                  {...field}
                  {...register('email')}
                  type="email"
                  dir="ltr"
                  className="text-start"
                />
              )}
            </Field>
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1.5 text-small font-semibold">{t('staff.form.role')}</legend>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {(['pharmacist', 'cashier'] as const).map((option) => (
                <label
                  key={option}
                  className={cn(
                    'flex cursor-pointer gap-2.5 rounded-lg border p-3 text-small',
                    role === option ? 'border-2 border-brand bg-brand-soft/40' : 'border-border',
                  )}
                >
                  <input
                    type="radio"
                    value={option}
                    {...register('role')}
                    className="mt-0.5 accent-brand"
                  />
                  <span>
                    <span className="block text-body-strong">{t(`role.${option}`)}</span>
                    <span className="text-ink-muted">{t(`staff.form.roleHints.${option}`)}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <Field label={t('staff.form.discount')} hint={t('staff.form.discountHint')}>
            {(field) => (
              <div className="flex items-center gap-2">
                <Input
                  {...field}
                  {...register('discountLimit')}
                  inputMode="numeric"
                  className="tabular w-24"
                />
                <span>%</span>
              </div>
            )}
          </Field>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1.5 text-small font-semibold">{t('staff.form.extra')}</legend>
            {(['sellOnCredit', 'seePurchasePrice', 'approveCounts'] as const).map((permission) => (
              <label key={permission} className="flex items-center gap-2 text-body">
                <input
                  type="checkbox"
                  {...register(`permissions.${permission}`)}
                  disabled={permission === 'approveCounts' && role === 'cashier'}
                  className="size-4.5 accent-brand"
                />
                {t(`staff.form.${permission}`)}
              </label>
            ))}
          </fieldset>
        </form>
      </Drawer>
      <TemporaryPasswordDialog
        member={created}
        password={created?.password ?? null}
        onClose={() => setCreated(null)}
      />
    </>
  )
}
