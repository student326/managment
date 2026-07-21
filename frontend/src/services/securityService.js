import { logSecurityEvent, SecurityEvent } from './logger';

const RATE_LIMIT_STORE = 'rate_limits';

const getRateLimitStore = () => {
  try {
    return JSON.parse(localStorage.getItem(RATE_LIMIT_STORE)) || {};
  } catch {
    return {};
  }
};

const saveRateLimitStore = (store) => {
  try {
    localStorage.setItem(RATE_LIMIT_STORE, JSON.stringify(store));
  } catch { /* noop */ }
};

const cleanupExpiredEntries = (store) => {
  const now = Date.now();
  const cleaned = {};
  for (const [key, entry] of Object.entries(store)) {
    if (entry.windowStart && now - entry.windowStart < 86400000) {
      cleaned[key] = entry;
    }
  }
  return cleaned;
};

export const checkRateLimit = (action, maxAttempts, windowMs) => {
  const store = cleanupExpiredEntries(getRateLimitStore());
  const now = Date.now();
  const key = `rl_${action}`;

  if (!store[key] || now - store[key].windowStart > windowMs) {
    store[key] = { count: 1, windowStart: now };
    saveRateLimitStore(store);
    return { allowed: true, remaining: maxAttempts - 1, retryAfter: 0 };
  }

  store[key].count += 1;
  saveRateLimitStore(store);

  if (store[key].count > maxAttempts) {
    const retryAfter = Math.ceil((windowMs - (now - store[key].windowStart)) / 1000);
    logSecurityEvent(SecurityEvent.RATE_LIMIT_HIT, { action, attempts: store[key].count });
    return { allowed: false, remaining: 0, retryAfter };
  }

  return { allowed: true, remaining: maxAttempts - store[key].count, retryAfter: 0 };
};

export const resetRateLimit = (action) => {
  const store = getRateLimitStore();
  delete store[`rl_${action}`];
  saveRateLimitStore(store);
};

const ALLOWED_TEXT_PATTERN = /^[a-zA-Z0-9\s@.\-_,+()/'":\u0600-\u06FF\u00C0-\u024F]+$/;
const DANGEROUS_PATTERNS = [
  /<script[\s>]/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /<iframe/i,
  /<object/i,
  /<embed/i,
  /<form/i,
  /document\./i,
  /window\./i,
  /eval\(/i,
  /expression\(/i,
  /<img[^>]+onerror/i,
  /<svg[^>]+onload/i,
  /data:text\/html/i,
  /base64/i,
];

const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|WHERE)\b)/i,
  /(;\s*(DROP|DELETE|INSERT|UPDATE|SELECT))/i,
  /(' OR '1'='1)/i,
  /(1\s*=\s*1\s*OR)/i,
  /(\bOR\b\s+\b\d+\b\s*=\s*\b\d+\b)/i,
  /(\bAND\b\s+\b\d+\b\s*=\s*\b\d+\b)/i,
  /(UNION\s+ALL\s+SELECT)/i,
  /(\/\*.*\*\/)/,
  /(-{2}\s)/,
];

const COMMAND_INJECTION_PATTERNS = [
  /[;&|`$]/,
  /\$\(/,
  /\|\|/,
  /&&/,
  /\$\{/,
];

export const sanitizeInput = (input, options = {}) => {
  if (typeof input !== 'string') return input;

  let cleaned = input;

  cleaned = cleaned
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  if (options.trim !== false) {
    cleaned = cleaned.trim();
  }

  if (options.maxLength && cleaned.length > options.maxLength) {
    cleaned = cleaned.slice(0, options.maxLength);
  }

  return cleaned;
};

export const validateInput = (input, type = 'text', options = {}) => {
  if (typeof input !== 'string') {
    return { valid: false, error: 'Input must be a string' };
  }

  const trimmed = input.trim();

  if (options.required && !trimmed) {
    return { valid: false, error: 'This field is required' };
  }

  if (options.minLength && trimmed.length < options.minLength) {
    return { valid: false, error: `Minimum ${options.minLength} characters required` };
  }

  if (options.maxLength && trimmed.length > options.maxLength) {
    return { valid: false, error: `Maximum ${options.maxLength} characters allowed` };
  }

  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(trimmed)) {
      logSecurityEvent(SecurityEvent.XSS_ATTEMPT, { input: trimmed.slice(0, 50), type });
      return { valid: false, error: 'Input contains disallowed content' };
    }
  }

  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      logSecurityEvent(SecurityEvent.INJECTION_ATTEMPT, { input: trimmed.slice(0, 50), type: 'sql' });
      return { valid: false, error: 'Input contains invalid characters' };
    }
  }

  for (const pattern of COMMAND_INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      logSecurityEvent(SecurityEvent.INJECTION_ATTEMPT, { input: trimmed.slice(0, 50), type: 'command' });
      return { valid: false, error: 'Input contains invalid characters' };
    }
  }

  switch (type) {
    case 'email': {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(trimmed)) {
        return { valid: false, error: 'Invalid email address' };
      }
      if (trimmed.length > 254) {
        return { valid: false, error: 'Email address is too long' };
      }
      break;
    }
    case 'phone': {
      const phoneRegex = /^[0-9+\-\s()]{7,20}$/;
      if (trimmed && !phoneRegex.test(trimmed)) {
        return { valid: false, error: 'Invalid phone number format' };
      }
      break;
    }
    case 'number': {
      const num = Number(trimmed);
      if (trimmed && (isNaN(num) || !isFinite(num))) {
        return { valid: false, error: 'Must be a valid number' };
      }
      if (options.min !== undefined && num < options.min) {
        return { valid: false, error: `Minimum value is ${options.min}` };
      }
      if (options.max !== undefined && num > options.max) {
        return { valid: false, error: `Maximum value is ${options.max}` };
      }
      break;
    }
    case 'name': {
      if (trimmed.length > 100) {
        return { valid: false, error: 'Name is too long (max 100 characters)' };
      }
      break;
    }
    case 'text': {
      if (!ALLOWED_TEXT_PATTERN.test(trimmed) && trimmed.length > 0) {
        logSecurityEvent(SecurityEvent.SUSPICIOUS_INPUT, { input: trimmed.slice(0, 50) });
      }
      break;
    }
  }

  return { valid: true, value: trimmed };
};

export const validateExcelFile = (file) => {
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ];
  const allowedExtensions = ['.xlsx', '.xls'];
  const maxSize = 10 * 1024 * 1024;

  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  const ext = '.' + file.name.split('.').pop().toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return { valid: false, error: 'Only .xlsx and .xls files are allowed' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be under 10MB' };
  }

  return { valid: true };
};

export const sanitizeFileName = (name) => {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, 100);
};

export const sanitizeHtml = (str) => {
  if (typeof str !== 'string') return '';
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
};

export const validateFormFields = (fields) => {
  const errors = {};
  for (const [name, config] of Object.entries(fields)) {
    const result = validateInput(config.value, config.type, config.options);
    if (!result.valid) {
      errors[name] = result.error;
    }
  }
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};
