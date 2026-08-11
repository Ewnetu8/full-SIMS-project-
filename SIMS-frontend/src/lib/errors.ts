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
 * Helper to translate a single field's validation error message into human readable language.
 */

function translateSingleFieldError(field: string, rawMsg: string): string {
  const normalizedField = field.toLowerCase();
  const msgLower = rawMsg.toLowerCase();

  // Email translations
  if (normalizedField.includes('email')) {
    if (
      msgLower.includes('already exists') ||
      msgLower.includes('duplicate') ||
      msgLower.includes('taken')
    ) {
      return 'An account with this email already exists. Please use a different email address.';
    }
    return 'Please enter a valid email address.';
  }

  // Student identifier translations
  if (normalizedField.includes('student')) {
    if (msgLower.includes('required') || msgLower.includes('blank') || msgLower.includes('null')) {
      return "Please enter the student's ID before creating the account.";
    }
    if (msgLower.includes('exists') || msgLower.includes('duplicate')) {
      return 'A student with this ID already exists. Please use a different ID.';
    }
    return "Please enter a valid student ID.";
  }

  // Faculty / Lecturer identifier translations
  if (normalizedField.includes('faculty')) {
    if (msgLower.includes('required') || msgLower.includes('blank') || msgLower.includes('null')) {
      return "Please enter the lecturer's faculty ID before creating the account.";
    }
    if (msgLower.includes('exists') || msgLower.includes('duplicate')) {
      return 'A faculty ID with this number already exists. Please use a different faculty ID.';
    }
    return "Please enter a valid faculty ID.";
  }

  // Department ID translations
  if (normalizedField.includes('department')) {
    if (msgLower.includes('required') || msgLower.includes('blank') || msgLower.includes('null') || msgLower.includes('select')) {
      return 'Please select a department before creating the account.';
    }
    return 'Please select a valid department.';
  }

  // Password translations
  if (normalizedField.includes('password')) {
    return 'Please choose a stronger password that meets the required password rules.';
  }

  // First Name
  if (normalizedField === 'first_name' || normalizedField === 'firstname') {
    return 'Please enter the first name.';
  }

  // Last Name
  if (normalizedField === 'last_name' || normalizedField === 'lastname') {
    return 'Please enter the last name.';
  }

  // Generic Field Fallback (cleaning up technical jargon if any)
  if (msgLower.includes('required') || msgLower.includes('blank')) {
    const formattedFieldName = field
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .toLowerCase();
    return `Please provide a valid ${formattedFieldName}.`;
  }

  return rawMsg;
}

/**
 * Extracts and parses raw field validation errors into user-friendly natural-language error messages.
 */
export function parseFieldErrors(error: unknown): Record<string, string> {
  const result: Record<string, string> = {};
  let rawErrors: Record<string, string[] | string> | undefined = undefined;

  if (error instanceof ApiError && error.errors) {
    rawErrors = error.errors;
  } else if (typeof error === 'object' && error !== null) {
    const errObj = error as any;
    if (errObj.errors) {
      rawErrors = errObj.errors;
    } else if (errObj.response?.data?.errors) {
      rawErrors = errObj.response.data.errors;
    } else if (errObj.response?.data && typeof errObj.response.data === 'object' && !Array.isArray(errObj.response.data)) {
      rawErrors = errObj.response.data;
    }
  }

  if (rawErrors && typeof rawErrors === 'object') {
    Object.entries(rawErrors).forEach(([fieldKey, val]) => {
      // Ignore non-field metadata
      if (['message', 'detail', 'statusCode', 'timestamp', 'status'].includes(fieldKey)) return;

      const rawMsg = Array.isArray(val) ? val.join(' ') : String(val);
      const friendlyMsg = translateSingleFieldError(fieldKey, rawMsg);

      result[fieldKey] = friendlyMsg;

      // Also map camelCase variants for UI form handlers
      if (fieldKey === 'student_identifier') result.studentIdentifier = friendlyMsg;
      if (fieldKey === 'faculty_identifier') result.facultyIdentifier = friendlyMsg;
      if (fieldKey === 'department_id') result.departmentId = friendlyMsg;
      if (fieldKey === 'first_name') result.firstName = friendlyMsg;
      if (fieldKey === 'last_name') result.lastName = friendlyMsg;
    });
  }

  return result;
}

/**
 * Converts any API or runtime error into a human-readable natural language message.
 * Preserves developer console logs while preventing technical details from reaching the UI.
 */
export function getUserFriendlyErrorMessage(error: unknown, context?: string): string {
  // Always log complete technical details for developers
  console.error('[Admin API Error]', error);

  if (!error) {
    return 'An unexpected error occurred. Please try again.';
  }

  let statusCode: number | undefined = undefined;
  let rawMessage = '';
  let errorsDict: Record<string, string[] | string> | undefined = undefined;

  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    rawMessage = error.message;
    errorsDict = error.errors;
  } else if (typeof error === 'object' && error !== null) {
    const errObj = error as any;
    statusCode = errObj.statusCode || errObj.status || errObj.response?.status;
    rawMessage = errObj.message || errObj.response?.data?.message || errObj.response?.data?.detail || '';
    errorsDict = errObj.errors || errObj.response?.data?.errors;
    if (!errorsDict && errObj.response?.data && typeof errObj.response.data === 'object' && !Array.isArray(errObj.response.data)) {
      errorsDict = errObj.response.data;
    }
  } else if (typeof error === 'string') {
    rawMessage = error;
  }

  const rawMsgLower = rawMessage.toLowerCase();

  // Network / Connection Failures
  if (
    rawMsgLower.includes('network error') ||
    rawMsgLower.includes('failed to fetch') ||
    rawMsgLower.includes('econnrefused') ||
    rawMsgLower.includes('timeout')
  ) {
    return "We couldn't connect to the server. Please check your connection and try again.";
  }

  // CSRF Errors
  if (rawMsgLower.includes('csrf') || rawMsgLower.includes('csrftoken')) {
    return "We couldn't complete this action because your session security information has expired. Please refresh the page and try again.";
  }

  // 401 Unauthorized
  if (statusCode === 401 || rawMsgLower.includes('unauthorized') || rawMsgLower.includes('401')) {
    if (context === 'login' || rawMsgLower.includes('credential') || rawMsgLower.includes('login')) {
      return 'The email or password is incorrect. Please check your credentials and try again.';
    }
    return 'Your session has expired. Please sign in again.';
  }

  // 403 Forbidden
  if (statusCode === 403 || rawMsgLower.includes('forbidden') || rawMsgLower.includes('403')) {
    return "You don't have permission to perform this action.";
  }

  // 404 Not Found
  if (statusCode === 404 || rawMsgLower.includes('not found') || rawMsgLower.includes('404')) {
    return "We couldn't find the information you're looking for. It may have been removed or is no longer available.";
  }

  // 409 Conflict
  if (statusCode === 409 || rawMsgLower.includes('conflict') || rawMsgLower.includes('409')) {
    if (rawMessage && !rawMsgLower.includes('409') && !rawMsgLower.includes('conflict') && !rawMsgLower.includes('apierror')) {
      return rawMessage;
    }
    return 'This information already exists. Please use different information.';
  }

  // 500 Server Error
  if (statusCode === 500 || rawMsgLower.includes('internal server error') || rawMsgLower.includes('500') || rawMsgLower.includes('traceback')) {
    return 'Something went wrong on the server. Please try again in a moment. If the problem continues, contact the system administrator.';
  }

  // Field validation errors extraction
  const fieldErrors = parseFieldErrors(error);
  const fieldErrorKeys = Object.keys(fieldErrors);

  if (fieldErrorKeys.length > 0) {
    // Return the first specific natural language validation message
    const firstKey = fieldErrorKeys[0];
    if (firstKey && fieldErrors[firstKey]) {
      return fieldErrors[firstKey];
    }
  }

  // Check if rawMessage has specific useful non-technical explanation
  const isTechnical =
    rawMsgLower.includes('http') ||
    rawMsgLower.includes('status code') ||
    rawMsgLower.includes('axioserror') ||
    rawMsgLower.includes('apierror') ||
    rawMsgLower.includes('validationerror') ||
    rawMsgLower.includes('javascript') ||
    rawMsgLower.includes('stack') ||
    rawMsgLower.includes('request failed');

  if (rawMessage && !isTechnical) {
    return rawMessage;
  }

  // Default fallback for 400 Bad Request or unhandled
  if (statusCode === 400 || rawMsgLower.includes('bad request') || rawMsgLower.includes('400')) {
    return 'Some of the information you entered is not valid. Please check the form and try again.';
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Returns a human-readable error message from any thrown value.
 */
export function getErrorMessage(error: unknown): string {
  return getUserFriendlyErrorMessage(error);
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

