import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { ApiError } from '@/shared/api'
import type { TranslationKey } from '@/shared/i18n'

/**
 * Puts Laravel's 422 field errors under the right fields.
 * The server sends short codes (e.g. "taken"); `codes` turns each into a message key.
 * Returns the message key for anything that is not a field error, to show above the form.
 */
export function applyServerErrors<Values extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<Values>,
  codes: Record<string, TranslationKey> = {},
): TranslationKey | null {
  if (!(error instanceof ApiError)) return 'validation.serverError'
  if (error.isNetwork) return 'validation.offline'
  if (!error.isValidation) return 'validation.serverError'
  for (const [field, messages] of Object.entries(error.fieldErrors)) {
    const code = messages[0] ?? ''
    setError(field as Path<Values>, { type: 'server', message: codes[code] ?? code })
  }
  return null
}
