/**
 * Formats a date string into a more readable format.
 * @param {string|Date} date - The date to format.
 * @returns {string} - The formatted date string.
 */
export function formatDate(date) {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid Date';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Truncates a string to a specific length and adds an ellipsis.
 * @param {string} text - The text to truncate.
 * @param {number} length - The maximum length.
 * @returns {string} - The truncated string.
 */
export function truncateText(text, length = 100) {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length).trim() + '...';
}

/**
 * Converts a string into a URL-friendly slug.
 * @param {string} text - The text to slugify.
 * @returns {string} - The slugified string.
 */
export function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w-]+/g, '')  // Remove all non-word chars
    .replace(/--+/g, '-');    // Replace multiple - with single -
}

/**
 * Validates if a string is a valid email address.
 * @param {string} email - The email to validate.
 * @returns {boolean} - True if valid, false otherwise.
 */
export function isValidEmail(email) {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}
