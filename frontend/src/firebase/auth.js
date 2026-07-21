import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from 'firebase/auth';
import { auth } from './config';
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

  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    resetRateLimit('login');
    logSecurityEvent(SecurityEvent.LOGIN_SUCCESS, { uid: result.user.uid });
    return result.user;
  } catch (err) {
    logSecurityEvent(SecurityEvent.LOGIN_FAILURE, {
      email,
      code: err.code,
      attempts: LOGIN_RATE_LIMIT - rateCheck.remaining,
    });
    throw err;
  }
};

export const logoutAdmin = async () => {
  logSecurityEvent(SecurityEvent.LOGOUT);
  await signOut(auth);
};

export const resetPassword = async (email) => {
  logSecurityEvent(SecurityEvent.PASSWORD_RESET, { email });
  const actionCodeSettings = {
    url: window.location.origin + '/login',
    handleCodeInApp: false,
  };
  await sendPasswordResetEmail(auth, email, actionCodeSettings);
};

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export const checkEmailVerified = () => {
  const user = auth.currentUser;
  if (!user) return false;
  return user.emailVerified === true;
};

export const refreshUser = async () => {
  const user = auth.currentUser;
  if (user) {
    await user.reload();
    return user;
  }
  return null;
};
