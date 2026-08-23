// ─── String Formatting Utilities ──────────────────────────────────────────────

/**
 * Capitalises the first character of a string.
 *
 * @example
 * capitalize('hello world') // "Hello world"
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Converts a string to Title Case.
 *
 * @example
 * toTitleCase('hello world') // "Hello World"
 */
export function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(capitalize)
    .join(' ');
}

/**
 * Converts a camelCase or PascalCase string to a readable label.
 *
 * @example
 * camelToLabel('firstName') // "First Name"
 */
export function camelToLabel(str: string): string {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

/**
 * Converts a string to a URL-safe slug.
 *
 * @example
 * slugify('Hello World!') // "hello-world"
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Truncates a string to `maxLength` and appends an ellipsis if needed.
 *
 * @example
 * truncate('Hello, World!', 8) // "Hello, W..."
 */
export function truncate(str: string, maxLength: number, suffix = '...'): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Returns the user's initials from a name string.
 *
 * @example
 * getInitials('John Doe') // "JD"
 * getInitials('Alice') // "A"
 */
export function getInitials(name: string, maxChars = 2): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, maxChars)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * Masks a string, showing only the last `visibleChars` characters.
 *
 * @example
 * maskString('mySecretToken', 4) // "*********oken"
 */
export function maskString(str: string, visibleChars = 4, maskChar = '*'): string {
  if (str.length <= visibleChars) return str;
  const masked = maskChar.repeat(str.length - visibleChars);
  return masked + str.slice(-visibleChars);
}

/**
 * Pluralises a word based on the given count.
 *
 * @example
 * pluralise(1, 'student') // "student"
 * pluralise(3, 'student') // "students"
 */
export function pluralise(count: number, singular: string, plural?: string): string {
  if (count === 1) return singular;
  return plural ?? `${singular}s`;
}

/**
 * Safely formats a user's display name, handling backend/frontend naming differences.
 * Fallbacks to email or "User" if names are not available.
 */
export function getUserDisplayName(user: any): string {
  if (!user) return 'User';

  const displayName =
    user.full_name ||
    user.fullName ||
    `${user.firstName ?? user.first_name ?? ''} ${user.lastName ?? user.last_name ?? ''}`.trim() ||
    user.email ||
    'User';

  return displayName;
}
