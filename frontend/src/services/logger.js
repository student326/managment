const LOG_KEY = 'security_log';
const MAX_LOG_ENTRIES = 500;

const sanitizeLogEntry = (entry) => {
  const clean = { ...entry };
  if (clean.email) clean.email = clean.email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
  if (clean.ip) clean.ip = '***';
  return clean;
};

export const SecurityEvent = {
  LOGIN_ATTEMPT: 'LOGIN_ATTEMPT',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  PASSWORD_RESET: 'PASSWORD_RESET',
  RATE_LIMIT_HIT: 'RATE_LIMIT_HIT',
  SUSPICIOUS_INPUT: 'SUSPICIOUS_INPUT',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  DATA_MODIFIED: 'DATA_MODIFIED',
  FILE_UPLOAD: 'FILE_UPLOAD',
  XSS_ATTEMPT: 'XSS_ATTEMPT',
  INJECTION_ATTEMPT: 'INJECTION_ATTEMPT',
};

export const logSecurityEvent = (eventType, details = {}) => {
  try {
    const logs = getSecurityLogs();
    const entry = {
      id: `SEC-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: eventType,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent?.slice(0, 100),
      ...sanitizeLogEntry(details),
    };
    logs.push(entry);
    if (logs.length > MAX_LOG_ENTRIES) {
      logs.splice(0, logs.length - MAX_LOG_ENTRIES);
    }
    localStorage.setItem(LOG_KEY, JSON.stringify(logs));

    if (
      eventType === SecurityEvent.XSS_ATTEMPT ||
      eventType === SecurityEvent.INJECTION_ATTEMPT ||
      eventType === SecurityEvent.SUSPICIOUS_INPUT
    ) {
      console.warn(`[SECURITY] ${eventType}:`, details);
    }
  } catch {
    // Silently fail - logging should never break the app
  }
};

export const getSecurityLogs = () => {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY)) || [];
  } catch {
    return [];
  }
};

export const clearSecurityLogs = () => {
  localStorage.removeItem(LOG_KEY);
};

export const getRecentFailedLogins = (windowMs = 900000) => {
  const logs = getSecurityLogs();
  const cutoff = Date.now() - windowMs;
  return logs.filter(
    (l) =>
      l.type === SecurityEvent.LOGIN_FAILURE &&
      new Date(l.timestamp).getTime() > cutoff
  );
};
