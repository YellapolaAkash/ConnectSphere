/**
 * Network Resilience Utility
 * Handles exponential backoff, retries, and network error handling
 * Based on backend integration guide best practices
 */

/**
 * Exponential backoff configuration
 */
const BACKOFF_CONFIG = {
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  maxAttempts: 5,
  multiplier: 2,
};

/**
 * Retry an async operation with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {object} options - Retry configuration
 * @param {number} options.maxAttempts - Maximum retry attempts
 * @param {number} options.initialDelay - Initial delay in ms
 * @param {number} options.maxDelay - Maximum delay in ms
 * @param {number} options.multiplier - Backoff multiplier
 * @param {Function} options.onRetry - Called on each retry
 * @returns {Promise} Result of successful function call
 * 
 * @example
 * const data = await retryWithBackoff(
 *   () => fetchPosts(),
 *   { maxAttempts: 3, initialDelay: 1000 }
 * );
 */
export const retryWithBackoff = async (
  fn,
  options = {}
) => {
  const config = { ...BACKOFF_CONFIG, ...options };
  let lastError;
  let delay = config.initialDelay;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      console.log(`[Retry] Attempt ${attempt}/${config.maxAttempts}`);
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on 4xx errors (client errors)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error;
      }

      if (attempt < config.maxAttempts) {
        const actualDelay = Math.min(delay, config.maxDelay);
        console.warn(
          `[Retry] Attempt ${attempt} failed. Retrying in ${actualDelay}ms...`,
          error.message
        );

        if (config.onRetry) {
          config.onRetry({ attempt, delay: actualDelay, error });
        }

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, actualDelay));

        // Calculate next delay
        delay *= config.multiplier;
      }
    }
  }

  // All attempts failed
  console.error(`[Retry] All ${config.maxAttempts} attempts failed`);
  throw lastError;
};

/**
 * Check if error is network-related
 * @param {Error} error - Error to check
 * @returns {boolean} True if network error
 */
export const isNetworkError = (error) => {
  if (!error) return false;

  // Network errors don't have a response
  const isNoResponse = !error.response;
  
  // Server errors (5xx)
  const isServerError = error.response?.status >= 500;
  
  // Timeout
  const isTimeout = error.code === "ECONNABORTED";
  
  // Connection refused
  const isConnectionError = 
    error.code === "ECONNREFUSED" || 
    error.code === "EHOSTUNREACH" ||
    error.code === "ENETUNREACH";

  return isNoResponse || isServerError || isTimeout || isConnectionError;
};

/**
 * Check if error is rate limit (429)
 * @param {Error} error - Error to check
 * @returns {boolean} True if rate limit error
 */
export const isRateLimitError = (error) => {
  return error?.response?.status === 429;
};

/**
 * Get retry delay for rate limit
 * @param {Error} error - Network error
 * @returns {number} Delay in milliseconds
 */
export const getRateLimitDelay = (error) => {
  // Check for Retry-After header
  const retryAfter = error.response?.headers?.["retry-after"];
  
  if (retryAfter) {
    // Retry-After can be in seconds or HTTP date
    const delaySeconds = parseInt(retryAfter);
    if (!isNaN(delaySeconds)) {
      return delaySeconds * 1000;
    }
  }

  // Default: exponential backoff
  return 5000; // 5 seconds
};

/**
 * Create a resilient API call wrapper
 * Provides retries for network errors and rate limiting
 * @param {Function} apiCall - API call function
 * @param {object} options - Configuration
 * @returns {Promise} API response
 */
export const resilientApiCall = async (apiCall, options = {}) => {
  const {
    shouldRetry = isNetworkError,
    maxAttempts = 3,
    initialDelay = 1000,
    onRetry = null,
  } = options;

  let attempt = 0;
  let lastError;

  while (attempt < maxAttempts) {
    try {
      attempt++;
      console.log(`[API] Attempt ${attempt}/${maxAttempts}`);
      return await apiCall();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (attempt < maxAttempts && shouldRetry(error)) {
        let delay = initialDelay;

        // Handle rate limiting
        if (isRateLimitError(error)) {
          delay = getRateLimitDelay(error);
          console.warn(`[API] Rate limited. Retrying after ${delay}ms`);
        } else {
          delay = initialDelay * Math.pow(2, attempt - 1);
          console.warn(
            `[API] Attempt ${attempt} failed (${error.message}). Retrying in ${delay}ms...`
          );
        }

        if (onRetry) {
          onRetry({ attempt, delay, error });
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        // No more retries or shouldn't retry
        break;
      }
    }
  }

  throw lastError;
};

/**
 * Handle specific API errors with user-friendly messages
 * @param {Error} error - API error
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error) => {
  if (!error) return "An unknown error occurred.";

  // Network errors
  if (isNetworkError(error)) {
    return "Network error. Please check your connection and try again.";
  }

  // Rate limiting
  if (isRateLimitError(error)) {
    return "Too many requests. Please wait a moment and try again.";
  }

  // Server response errors
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  // User-friendly HTTP status messages
  const statusMessages = {
    400: "Invalid request. Please check your input.",
    401: "Session expired. Please log in again.",
    403: "You don't have permission for this action.",
    404: "Resource not found.",
    500: "Server error. Please try again later.",
    502: "Service temporarily unavailable.",
    503: "Service is under maintenance.",
  };

  if (error.response?.status in statusMessages) {
    return statusMessages[error.response.status];
  }

  // Default error message
  return error.message || "Something went wrong. Please try again.";
};

/**
 * Delay execution with cancellation support
 * @param {number} ms - Delay in milliseconds
 * @returns {object} Object with promise and cancel function
 */
export const createCancellableDelay = (ms) => {
  let timeoutId;
  let cancelled = false;

  const promise = new Promise((resolve) => {
    timeoutId = setTimeout(() => {
      if (!cancelled) {
        resolve();
      }
    }, ms);
  });

  const cancel = () => {
    cancelled = true;
    clearTimeout(timeoutId);
  };

  return { promise, cancel };
};

/**
 * Socket reconnection with exponential backoff
 * Used by socket service for auto-reconnect
 * @param {Function} connectFn - Connection function
 * @param {object} options - Retry options
 */
export const socketReconnect = async (connectFn, options = {}) => {
  const config = {
    maxAttempts: 5,
    initialDelay: 1000,
    maxDelay: 30000,
    ...options,
  };

  return retryWithBackoff(connectFn, config);
};
