/** Validation messages from Laravel: field name → list of messages. */
export type FieldErrors = Record<string, string[]>

/** Every failed request becomes this, so screens handle errors one way. */
export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: FieldErrors
  /** The whole JSON body, for extra details some endpoints send (e.g. attemptsLeft). */
  readonly body: Record<string, unknown>

  constructor(
    status: number,
    message: string,
    fieldErrors: FieldErrors = {},
    body: Record<string, unknown> = {},
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
    this.body = body
  }

  /** Too many attempts; wait before trying again. */
  get isRateLimited(): boolean {
    return this.status === 429
  }

  /** The thing existed but is no longer valid, e.g. an expired link. */
  get isGone(): boolean {
    return this.status === 410
  }

  get isNotFound(): boolean {
    return this.status === 404
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
