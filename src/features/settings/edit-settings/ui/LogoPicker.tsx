import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ImageUp } from 'lucide-react'
import { pharmacyQueries, uploadPharmacyLogo, type PharmacyProfile } from '@/entities/pharmacy'
import { ApiError } from '@/shared/api'
import { buttonVariants } from '@/shared/ui/button'
import { toast } from '@/shared/ui/toast'
import { LOGO_MAX_BYTES, LOGO_TYPES } from '../model/logo'

/**
 * The pharmacy logo with a "change" button. A picked image is checked here first
 * (type and size), then saved at once: it does not wait for the settings save button.
 */
export function LogoPicker({ profile }: { profile: PharmacyProfile }) {
  const { t } = useTranslation()
  const inputId = useId()
  const hintId = useId()
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: uploadPharmacyLogo,
    onSuccess: (saved) => {
      queryClient.setQueryData(pharmacyQueries.profile().queryKey, saved)
      toast.success(t('settings.logoSaved'))
    },
    onError: (failure) => {
      const code = failure instanceof ApiError ? failure.fieldErrors['logo']?.[0] : undefined
      setError(code === 'logoSize' ? t('settings.logoSize') : t('settings.logoType'))
    },
  })

  function onPick(file: File | undefined) {
    if (input.current) input.current.value = ''
    if (!file) return
    if (!LOGO_TYPES.includes(file.type)) return setError(t('settings.logoType'))
    if (file.size > LOGO_MAX_BYTES) return setError(t('settings.logoSize'))
    setError(null)
    mutation.mutate(file)
  }

  return (
    <div className="flex items-center gap-4">
      <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-brand-soft font-display text-heading font-bold text-brand-strong">
        {profile.logoUrl ? (
          <img
            src={profile.logoUrl}
            alt={t('settings.logoAlt')}
            className="size-full object-cover"
          />
        ) : (
          <span aria-hidden>
            {profile.name
              .replace(/^صيدلية\s+/, '')
              .replace(/^ال/, '')
              .slice(0, 1)}
          </span>
        )}
      </span>
      <div className="flex flex-col items-start gap-1.5">
        <label
          htmlFor={inputId}
          className={buttonVariants({
            variant: 'secondary',
            size: 'sm',
            className: 'cursor-pointer has-focus-visible:outline-3 has-focus-visible:outline-focus',
          })}
        >
          <ImageUp aria-hidden className="size-4" />
          {mutation.isPending ? t('settings.logoUploading') : t('settings.logo')}
          <input
            ref={input}
            id={inputId}
            type="file"
            accept={LOGO_TYPES.join(',')}
            aria-describedby={hintId}
            disabled={mutation.isPending}
            onChange={(event) => onPick(event.target.files?.[0])}
            className="sr-only"
          />
        </label>
        <p id={hintId} className="text-caption text-ink-muted">
          {t('settings.logoHint')}
        </p>
        {error && (
          <p role="alert" className="text-caption font-medium text-danger">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
