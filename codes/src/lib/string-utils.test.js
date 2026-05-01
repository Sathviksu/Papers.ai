import { formatDate, truncateText, slugify, isValidEmail } from './string-utils';

describe('string-utils', () => {
  describe('formatDate', () => {
    it('should format a valid date string', () => {
      expect(formatDate('2023-10-27')).toBe('Oct 27, 2023');
    });

    it('should return "N/A" for null or undefined', () => {
      expect(formatDate(null)).toBe('N/A');
      expect(formatDate(undefined)).toBe('N/A');
    });

    it('should return "Invalid Date" for invalid date strings', () => {
      expect(formatDate('not-a-date')).toBe('Invalid Date');
    });
  });

  describe('truncateText', () => {
    it('should truncate text longer than the limit', () => {
      const text = 'This is a long sentence that should be truncated eventually.';
      expect(truncateText(text, 10)).toBe('This is a...');
    });

    it('should not truncate text shorter than the limit', () => {
      const text = 'Short';
      expect(truncateText(text, 10)).toBe('Short');
    });

    it('should return an empty string for null or undefined', () => {
      expect(truncateText(null)).toBe('');
    });
  });

  describe('slugify', () => {
    it('should convert text to a URL-friendly slug', () => {
      expect(slugify('Hello World')).toBe('hello-world');
      expect(slugify('Papers.ai Project!')).toBe('papersai-project');
    });

    it('should handle multiple spaces and special characters', () => {
      expect(slugify('  Too Many   Spaces  ')).toBe('too-many-spaces');
    });
  });

  describe('isValidEmail', () => {
    it('should return true for valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(isValidEmail('test@example')).toBe(false);
      expect(isValidEmail('testexample.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail(null)).toBe(false);
    });
  });
});
