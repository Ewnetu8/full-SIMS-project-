import type { ApiErrorResponse } from '@/types';

// ─── Custom Error Classes ─────────────────────────────────────────────────────

/**
 * Base application error — all custom errors extend this.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'AppError';
    // Restore prototype chain (required when extending Error in TypeScript)
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when the API returns a non-2xx HTTP status.
 */
export class ApiError extends AppError {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly errors?: Record<string, string[]>,
  ) {
    super(message, `HTTP_${statusCode}`);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when authentication is required but not present.
 */
export class UnauthorizedError extends ApiError {
  constructor(message = 'You must be logged in to perform this action.') {
    super(message, 401);
    this.name = 'UnauthorizedError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when the user does not have sufficient permissions.
 */
export class ForbiddenError extends ApiError {
  constructor(message = 'You do not have permission to perform this action.') {
    super(message, 403);
    this.name = 'ForbiddenError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when a requested resource is not found.
 */
export class NotFoundError extends ApiError {
  constructor(message = 'The requested resource was not found.') {
    super(message, 404);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when the API returns validation errors (422 Unprocessable Entity).
 */
export class ValidationError extends ApiError {
  constructor(message: string, errors?: Record<string, string[]>) {
    super(message, 422, errors);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ─── Error Utilities ──────────────────────────────────────────────────────────

/**
 * Maps an HTTP status code to the appropriate custom error class.
 */
export function createApiError(response: ApiErrorResponse): ApiError {
  const { statusCode, message, errors } = response;

  switch (statusCode) {
    case 401:
      return new UnauthorizedError(message);
    case 403:
      return new ForbiddenError(message);
    case 404:
      return new NotFoundError(message);
    case 422:
      return new ValidationError(message, errors);
    default:
      return new ApiError(message, statusCode, errors);
  }
}

/**
 * Returns a human-readable error message from any thrown value.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Type guard — returns true if `error` is an ApiError.
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Type guard — returns true if `error` is an UnauthorizedError.
 */
export function isUnauthorized(error: unknown): error is UnauthorizedError {
  return error instanceof UnauthorizedError;
}
