/**
 * AI Utility functions for Genkit flows.
 */

/**
 * Robustly extracts the raw AI generated text from a Genkit error object.
 * Checks multiple possible locations depending on whether it's a validation error, 
 * a plugin error, or a 429 rate limit.
 */
export function extractRawText(err) {
  // Check for Genkit 1.x detail structure
  const fromDetail = err.detail?.response?.output?.text || err.detail?.output?.text;
  if (fromDetail) return fromDetail;

  // Check for originalResponse (legacy or custom plugin)
  const fromOriginal = err.originalResponse?.output?.text;
  if (fromOriginal) return fromOriginal;

  // Attempt to extract the 'Provided data: {...}' JSON payload from validation errors
  if (typeof err.message === 'string') {
    // Regex matches 'Provided data: ' followed by anything starting with {, extracting to end of string or before 'Required JSON schema:'
    const providedMatch = err.message.match(/Provided data:\s*({.*?(?=Required JSON schema:|$))/s);
    if (providedMatch && providedMatch[1]) {
      return providedMatch[1].trim();
    }
    
    // Fallback: If it's a massive string but NOT a framework stack trace, it might be the raw output
    if (!err.message.includes('INVALID_ARGUMENT') && !err.message.includes('Schema validation failed')) {
      if (err.message.length > 50) return err.message;
    }
  }

  return null;
}

/**
 * Checks if an error is a rate limit error (429).
 */
export function isRateLimitError(err) {
  return err.status === 429 || 
         err.message?.includes('429') || 
         err.message?.toLowerCase().includes('rate limit');
}

/**
 * Checks if an error is a schema validation error.
 */
export function isValidationError(err) {
  return err.name === 'ZodError' || 
         err.message?.includes('validation');
}
