/**
 * CSRF Token Utility for Django REST Framework integration.
 * Reads the non-HttpOnly `csrftoken` cookie set by Django and returns its string value.
 */
export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;

  const name = 'csrftoken';
  const cookies = document.cookie.split(';');

  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i]?.trim();
    if (cookie && cookie.startsWith(`${name}=`)) {
      return decodeURIComponent(cookie.substring(name.length + 1));
    }
  }

  return null;
}
