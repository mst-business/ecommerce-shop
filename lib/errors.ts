/**
 * Error handling utilities
 */

/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public statusCode: number = 400,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Error codes for categorizing errors
 */
export const ErrorCode = {
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_FIELD: 'MISSING_FIELD',
  
  // Authentication errors
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  
  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',
  
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  SERVER_ERROR: 'SERVER_ERROR',
  
  // Business logic errors
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  CART_EMPTY: 'CART_EMPTY',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  
  // Unknown
  UNKNOWN: 'UNKNOWN',
} as const;

export type ErrorCode = typeof ErrorCode[keyof typeof ErrorCode];

/**
 * User-friendly error messages
 * Maps technical errors to human-readable messages
 */
const ERROR_MESSAGES: Record<string, string> = {
  // Authentication
  'Invalid credentials': 'Incorrect username or password. Please try again.',
  'Invalid password': 'Incorrect password. Please try again.',
  'User not found': 'No account found with this username.',
  'Email already exists': 'An account with this email already exists.',
  'Username already exists': 'This username is already taken.',
  'Authentication required': 'Please log in to continue.',
  'Admin access required': 'You don\'t have permission to access this area.',
  'Session expired': 'Your session has expired. Please log in again.',
  
  // Network
  'Failed to fetch': 'Unable to connect to the server. Please check your internet connection.',
  'Network Error': 'Network error. Please check your connection and try again.',
  'Request timed out': 'The request took too long. Please try again.',
  'The operation was aborted': 'Request was cancelled. Please try again.',
  
  // Products
  'Product not found': 'This product is no longer available.',
  'Out of stock': 'Sorry, this item is currently out of stock.',
  'Insufficient stock': 'Sorry, we don\'t have enough of this item in stock.',
  
  // Cart
  'Cart is empty': 'Your cart is empty. Add some items before checking out.',
  'Invalid quantity': 'Please enter a valid quantity.',
  
  // Orders
  'Order not found': 'We couldn\'t find this order.',
  'Order cannot be cancelled': 'This order can no longer be cancelled.',
  
  // Payment
  'Payment failed': 'Payment was unsuccessful. Please try again or use a different payment method.',
  'Invalid card': 'The card information is invalid. Please check and try again.',
  
  // Generic
  'Internal server error': 'Something went wrong on our end. Please try again later.',
  'Bad request': 'Invalid request. Please check your information and try again.',
};

/**
 * Get a user-friendly error message
 */
export function getUserFriendlyError(error: unknown): string {
  // Handle Error objects
  if (error instanceof Error) {
    const message = error.message;
    
    // Check for exact match
    if (ERROR_MESSAGES[message]) {
      return ERROR_MESSAGES[message];
    }
    
    // Check for partial matches
    for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
      if (message.toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }
    
    // Return the original message if it seems user-friendly
    if (isUserFriendlyMessage(message)) {
      return message;
    }
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    if (ERROR_MESSAGES[error]) {
      return ERROR_MESSAGES[error];
    }
    if (isUserFriendlyMessage(error)) {
      return error;
    }
  }
  
  // Default fallback
  return 'Something went wrong. Please try again.';
}

/**
 * Check if a message is user-friendly (not technical)
 */
function isUserFriendlyMessage(message: string): boolean {
  const technicalPatterns = [
    /^[A-Z_]+$/, // All caps with underscores (error codes)
    /^Error:/, // Starts with "Error:"
    /\d{3}/, // Contains status codes
    /undefined|null|NaN/, // Technical values
    /TypeError|ReferenceError|SyntaxError/, // JS errors
    /at\s+\w+\s+\(/, // Stack trace patterns
  ];
  
  return !technicalPatterns.some(pattern => pattern.test(message));
}

/**
 * Parse API error response
 */
export function parseApiError(response: { error?: string; message?: string } | string): string {
  if (typeof response === 'string') {
    return getUserFriendlyError(response);
  }
  
  const errorMessage = response.error || response.message;
  if (errorMessage) {
    return getUserFriendlyError(errorMessage);
  }
  
  return 'Something went wrong. Please try again.';
}

/**
 * Get error code from error message
 */
export function getErrorCode(error: unknown): ErrorCode {
  const message = error instanceof Error ? error.message : String(error);
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
    return ErrorCode.NETWORK_ERROR;
  }
  if (lowerMessage.includes('timeout') || lowerMessage.includes('aborted')) {
    return ErrorCode.TIMEOUT;
  }
  if (lowerMessage.includes('not found')) {
    return ErrorCode.NOT_FOUND;
  }
  if (lowerMessage.includes('already exists') || lowerMessage.includes('duplicate')) {
    return ErrorCode.ALREADY_EXISTS;
  }
  if (lowerMessage.includes('permission') || lowerMessage.includes('access')) {
    return ErrorCode.PERMISSION_DENIED;
  }
  if (lowerMessage.includes('credential') || lowerMessage.includes('password')) {
    return ErrorCode.INVALID_CREDENTIALS;
  }
  if (lowerMessage.includes('auth') || lowerMessage.includes('login')) {
    return ErrorCode.AUTH_REQUIRED;
  }
  if (lowerMessage.includes('validation') || lowerMessage.includes('invalid')) {
    return ErrorCode.VALIDATION_ERROR;
  }
  if (lowerMessage.includes('stock')) {
    return ErrorCode.OUT_OF_STOCK;
  }
  
  return ErrorCode.UNKNOWN;
}

/**
 * Log error for debugging (only in development)
 */
export function logError(error: unknown, context?: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[Error${context ? ` in ${context}` : ''}]:`, error);
  }
}


