import { APIError } from '@/lib/api'

export class ValidationError extends Error {
  constructor(
    public field: string,
    message: string
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof APIError) {
    return error.message
  }
  if (error instanceof ValidationError) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'An unknown error occurred'
}

export function getErrorCode(error: unknown): string {
  if (error instanceof APIError) {
    return error.code || 'UNKNOWN_ERROR'
  }
  if (error instanceof ValidationError) {
    return 'VALIDATION_ERROR'
  }
  return 'UNKNOWN_ERROR'
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof APIError) {
    return error.isServerError()
  }
  return error instanceof TypeError && error.message.includes('fetch')
}

export function isAuthError(error: unknown): boolean {
  if (error instanceof APIError) {
    return error.isUnauthorized() || error.isForbidden()
  }
  return false
}

export function isValidationError(error: unknown): boolean {
  return error instanceof ValidationError || (error instanceof APIError && error.isValidationError())
}

export function isNotFoundError(error: unknown): boolean {
  if (error instanceof APIError) {
    return error.isNotFound()
  }
  return false
}

export interface ErrorResponse {
  type: 'validation' | 'auth' | 'not-found' | 'network' | 'unknown'
  message: string
  code: string
  field?: string
}

export function parseError(error: unknown): ErrorResponse {
  if (error instanceof APIError) {
    if (error.isUnauthorized()) {
      return {
        type: 'auth',
        message: 'Your session has expired. Please log in again.',
        code: error.code || 'UNAUTHORIZED',
      }
    }
    if (error.isForbidden()) {
      return {
        type: 'auth',
        message: 'You do not have permission to perform this action.',
        code: error.code || 'FORBIDDEN',
      }
    }
    if (error.isNotFound()) {
      return {
        type: 'not-found',
        message: 'The requested resource was not found.',
        code: error.code || 'NOT_FOUND',
      }
    }
    if (error.isValidationError()) {
      return {
        type: 'validation',
        message: error.message,
        code: error.code || 'VALIDATION_ERROR',
      }
    }
    if (error.isServerError()) {
      return {
        type: 'network',
        message: 'A server error occurred. Please try again later.',
        code: error.code || 'SERVER_ERROR',
      }
    }
  }

  if (error instanceof ValidationError) {
    return {
      type: 'validation',
      message: error.message,
      code: 'VALIDATION_ERROR',
      field: error.field,
    }
  }

  if (isNetworkError(error)) {
    return {
      type: 'network',
      message: 'Network error. Please check your connection.',
      code: 'NETWORK_ERROR',
    }
  }

  return {
    type: 'unknown',
    message: getErrorMessage(error),
    code: getErrorCode(error),
  }
}
