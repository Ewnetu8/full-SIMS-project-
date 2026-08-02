import { isApiError } from '@/lib/errors';
import { toast } from '@/components/feedback';

export function handleAuthError(error: unknown) {
  let message = 'An unexpected error occurred. Please try again.';

  if (isApiError(error)) {
    switch (error.statusCode) {
      case 401:
        message = 'Incorrect email or password.';
        break;
      case 400:
        // Use the primary validation message returned by the backend, if any.
        if (error.errors && Object.keys(error.errors).length > 0) {
          const firstKey = Object.keys(error.errors)[0];
          if (firstKey !== undefined) {
            const firstError = error.errors[firstKey];
            const extractedMessage = Array.isArray(firstError) ? firstError[0] : (firstError as unknown as string);
            message = extractedMessage || error.message || 'Invalid request.';
          } else {
            message = error.message || 'Invalid request.';
          }
        } else {
          message = error.message || 'Invalid request.';
        }
        break;
      case 403:
        message = 'You do not have permission to access this resource.';
        break;
      case 404:
        message = 'This service is not available yet. Please contact your system administrator.';
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        message = 'Something went wrong on the server. Please try again later.';
        break;
      default:
        message = error.message || message;
    }
  } else if (error instanceof Error) {
    if (error.message.toLowerCase().includes('timeout') || error.name === 'TimeoutError') {
      message = 'The request timed out. Please try again.';
    } else if (error.message.toLowerCase().includes('network') || error.message.toLowerCase().includes('internet')) {
      message = 'Unable to connect to the server. Please check your internet connection.';
    } else {
      message = error.message;
    }
  }

  // Prevent duplicate notifications using a static ID
  toast.error(message, { id: 'auth-error' });
  return message;
}
