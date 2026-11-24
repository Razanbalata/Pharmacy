/** Validation messages from Laravel: field name → list of messages. */
export type FieldErrors = Record<string, string[]>

/** Every failed request becomes this, so screens handle errors one way. */
export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: FieldErrors

  constructor(status: number, message: string, fieldErrors: FieldErrors = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }

  /** Not signed in, or the session ended. */
  get isUnauthenticated(): boolean {
    return this.status === 401 || this.status === 419
  }

  /** Signed in but this role may not do it. */
  get isForbidden(): boolean {
    return this.status === 403
  }

  /** The form has mistakes; fieldErrors says which. */
  get isValidation(): boolean {
    return this.status === 422
  }

  /** The request never reached the server. */
  get isNetwork(): boolean {
    return this.status === 0
  }
}
