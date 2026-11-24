export type PasswordStrength = 0 | 1 | 2 | 3 | 4

/** A simple strength score for the meter under password fields. */
export function passwordStrength(password: string): PasswordStrength {
  let score = 0
  if (password.length >= 8) score += 1
  if (/\d/.test(password)) score += 1
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1
  if (password.length >= 12 || /[^A-Za-z0-9]/.test(password)) score += 1
  return score as PasswordStrength
}

/** The rule the server applies too: at least 8 characters with a digit. */
export function isAcceptablePassword(password: string): boolean {
  return password.length >= 8 && /\d/.test(password)
}
