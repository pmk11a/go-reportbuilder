import { formatAPIError } from '@/shared/utils/errorMapper'

export class APIError extends Error {
  public rawMsg: string;

  constructor(
    public status: number,
    public data: any,
    public code?: string
  ) {
    super();
    Object.setPrototypeOf(this, APIError.prototype);

    const rawMsg = data?.message || data?.data?.error || data?.error || '';
    this.name = 'APIError';
    this.rawMsg = rawMsg;
    this.code = data?.error || data?.data?.error || `HTTP_${status}`;

    Object.defineProperty(this, 'message', {
      get: () => formatAPIError(this.status, this.rawMsg),
      enumerable: true,
      configurable: true
    });
  }

  isUnauthorized(): boolean { return this.status === 401 }
  isForbidden(): boolean { return this.status === 403 }
  isNotFound(): boolean { return this.status === 404 }
  isValidationError(): boolean { return this.status === 400 }
  isServerError(): boolean { return this.status >= 500 }
}

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
