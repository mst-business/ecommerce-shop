/**
 * Form validation utilities
 */

// Validation error type
export interface ValidationError {
  field: string;
  message: string;
}

// Validation result
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Helper to safely convert unknown to string
const asString = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  return String(value);
};

/**
 * Individual field validators
 * All validators accept `unknown` to work with validateForm, but internally handle strings
 */
export const validators = {
  /**
   * Validate required field
   */
  required: (value: unknown, fieldName: string = 'This field'): string | null => {
    if (value === undefined || value === null || value === '') {
      return `${fieldName} is required`;
    }
    if (typeof value === 'string' && !value.trim()) {
      return `${fieldName} is required`;
    }
    return null;
  },

  /**
   * Validate email format
   */
  email: (value: unknown): string | null => {
    const str = asString(value);
    if (!str) return 'Email is required';
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(str)) return 'Please enter a valid email address';
    return null;
  },

  /**
   * Validate password strength
   */
  password: (value: unknown, minLength: number = 6): string | null => {
    const str = asString(value);
    if (!str) return 'Password is required';
    if (str.length < minLength) {
      return `Password must be at least ${minLength} characters`;
    }
    return null;
  },

  /**
   * Validate password with strength requirements
   */
  strongPassword: (value: unknown): string | null => {
    const str = asString(value);
    if (!str) return 'Password is required';
    if (str.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(str)) return 'Password must contain an uppercase letter';
    if (!/[a-z]/.test(str)) return 'Password must contain a lowercase letter';
    if (!/[0-9]/.test(str)) return 'Password must contain a number';
    return null;
  },

  /**
   * Validate phone number
   */
  phone: (value: unknown, required: boolean = false): string | null => {
    const str = asString(value);
    if (!str) {
      return required ? 'Phone number is required' : null;
    }
    // Accepts formats: +1234567890, 123-456-7890, (123) 456-7890, etc.
    const regex = /^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    if (!regex.test(str.replace(/\s/g, ''))) {
      return 'Please enter a valid phone number';
    }
    return null;
  },

  /**
   * Validate US zip code
   */
  zipCode: (value: unknown): string | null => {
    const str = asString(value);
    if (!str) return 'Zip code is required';
    // US zip code: 12345 or 12345-6789
    const regex = /^\d{5}(-\d{4})?$/;
    if (!regex.test(str)) {
      return 'Please enter a valid zip code (e.g., 12345)';
    }
    return null;
  },

  /**
   * Validate minimum length
   */
  minLength: (value: unknown, min: number, fieldName: string = 'This field'): string | null => {
    const str = asString(value);
    if (!str) return null;
    if (str.length < min) {
      return `${fieldName} must be at least ${min} characters`;
    }
    return null;
  },

  /**
   * Validate maximum length
   */
  maxLength: (value: unknown, max: number, fieldName: string = 'This field'): string | null => {
    const str = asString(value);
    if (!str) return null;
    if (str.length > max) {
      return `${fieldName} must be no more than ${max} characters`;
    }
    return null;
  },

  /**
   * Validate number range
   */
  numberRange: (value: unknown, min: number, max: number, fieldName: string = 'Value'): string | null => {
    const num = typeof value === 'number' ? value : Number(value);
    if (num < min || num > max) {
      return `${fieldName} must be between ${min} and ${max}`;
    }
    return null;
  },

  /**
   * Validate positive number
   */
  positiveNumber: (value: unknown, fieldName: string = 'Value'): string | null => {
    const num = typeof value === 'number' ? value : Number(value);
    if (isNaN(num) || num <= 0) {
      return `${fieldName} must be a positive number`;
    }
    return null;
  },

  /**
   * Validate username (alphanumeric with underscores)
   */
  username: (value: unknown): string | null => {
    const str = asString(value);
    if (!str) return 'Username is required';
    if (str.length < 3) return 'Username must be at least 3 characters';
    if (str.length > 20) return 'Username must be no more than 20 characters';
    const regex = /^[a-zA-Z0-9_]+$/;
    if (!regex.test(str)) {
      return 'Username can only contain letters, numbers, and underscores';
    }
    return null;
  },

  /**
   * Validate credit card number (basic Luhn check)
   */
  creditCard: (value: unknown): string | null => {
    const str = asString(value);
    if (!str) return 'Card number is required';
    const cleaned = str.replace(/\s|-/g, '');
    if (!/^\d{13,19}$/.test(cleaned)) {
      return 'Please enter a valid card number';
    }
    // Luhn algorithm
    let sum = 0;
    let isEven = false;
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i], 10);
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      isEven = !isEven;
    }
    if (sum % 10 !== 0) {
      return 'Please enter a valid card number';
    }
    return null;
  },

  /**
   * Match two fields (e.g., password confirmation)
   */
  matches: (value: unknown, compareValue: unknown, fieldName: string = 'Fields'): string | null => {
    if (asString(value) !== asString(compareValue)) {
      return `${fieldName} do not match`;
    }
    return null;
  },
};

/**
 * Validate a form with multiple fields
 */
export function validateForm<T extends Record<string, unknown>>(
  values: T,
  rules: Partial<Record<keyof T, (value: unknown) => string | null>>
): ValidationResult {
  const errors: Record<string, string> = {};
  let isValid = true;

  for (const [field, validator] of Object.entries(rules)) {
    if (validator) {
      const error = validator(values[field]);
      if (error) {
        errors[field] = error;
        isValid = false;
      }
    }
  }

  return { isValid, errors };
}

/**
 * Sanitize string input (remove HTML tags, trim)
 */
export function sanitizeInput(value: string): string {
  if (!value) return '';
  return value
    .trim()
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>]/g, ''); // Remove < and > characters
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return value;
}

/**
 * Format credit card number for display
 */
export function formatCreditCard(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  const groups = cleaned.match(/.{1,4}/g);
  return groups ? groups.join(' ') : cleaned;
}

