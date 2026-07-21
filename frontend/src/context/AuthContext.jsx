import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { onAuthChange, logoutAdmin } from '../firebase/auth';
import { logSecurityEvent, SecurityEvent } from '../services/logger';

const AuthContext = createContext(null);

const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const ACTIVITY_CHECK_INTERVAL = 60 * 1000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const lastActivityRef = useRef(Date.now());
  const sessionTimerRef = useRef(null);
  const activityCheckRef = useRef(null);

  const handleSessionExpiry = useCallback(async () => {
    logSecurityEvent(SecurityEvent.SESSION_EXPIRED);
    try {
      await logoutAdmin();
    } catch { /* noop */ }
    setUser(null);
  }, []);

  const recordActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, recordActivity, { passive: true }));
    return () => {
      events.forEach((event) => window.removeEventListener(event, recordActivity));
    };
  }, [recordActivity]);

  useEffect(() => {
    if (!user) {
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
      if (activityCheckRef.current) clearInterval(activityCheckRef.current);
      return;
    }

    activityCheckRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed > SESSION_TIMEOUT_MS) {
        handleSessionExpiry();
      }
    }, ACTIVITY_CHECK_INTERVAL);

    return () => {
      if (activityCheckRef.current) clearInterval(activityCheckRef.current);
    };
  }, [user, handleSessionExpiry]);

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
      setLoading(false);
      if (user) {
        lastActivityRef.current = Date.now();
      }
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
