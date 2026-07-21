import { supabase } from './config';
import { logSecurityEvent, SecurityEvent } from '../services/logger';
import { checkRateLimit, resetRateLimit } from '../services/securityService';

const LOGIN_RATE_LIMIT = 5;
const LOGIN_WINDOW_MS = 900000;

export const loginAdmin = async (email, password) => {
  const rateCheck = checkRateLimit('login', LOGIN_RATE_LIMIT, LOGIN_WINDOW_MS);
  if (!rateCheck.allowed) {
    const msg = `Too many login attempts. Try again in ${rateCheck.retryAfter} seconds.`;
    logSecurityEvent(SecurityEvent.RATE_LIMIT_HIT, { email, retryAfter: rateCheck.retryAfter });
    const error = new Error(msg);
    error.code = 'auth/too-many-requests';
    error.retryAfter = rateCheck.retryAfter;
    throw error;
  }

  logSecurityEvent(SecurityEvent.LOGIN_ATTEMPT, { email });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    logSecurityEvent(SecurityEvent.LOGIN_FAILURE, {
      email,
      code: error.code,
      attempts: LOGIN_RATE_LIMIT - rateCheck.remaining,
    });
    throw error;
  }

  resetRateLimit('login');
  logSecurityEvent(SecurityEvent.LOGIN_SUCCESS, { uid: data.user.id });
  return data.user;
};

export const logoutAdmin = async () => {
  logSecurityEvent(SecurityEvent.LOGOUT);
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const resetPassword = async (email) => {
  logSecurityEvent(SecurityEvent.PASSWORD_RESET, { email });
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/login',
  });
  if (error) throw error;
};

export const onAuthChange = (callback) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
  return () => subscription.unsubscribe();
};
