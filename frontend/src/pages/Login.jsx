import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAdmin, resetPassword } from '../supabase/auth';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { validateInput, sanitizeInput } from '../services/securityService';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const emailValidation = validateInput(email, 'email', { required: true });
    if (!emailValidation.valid) {
      setError(emailValidation.error);
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await loginAdmin(email.trim().toLowerCase(), password);
      navigate('/dashboard');
    } catch (err) {
      if (err.retryAfter) {
        setRetryAfter(err.retryAfter);
        const timer = setInterval(() => {
          setRetryAfter((prev) => {
            if (prev <= 1) { clearInterval(timer); return 0; }
            return prev - 1;
          });
        }, 1000);
      }
      const raw = err.code || err.message || String(err);
      setError(getErrorMessage(raw));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!email) {
      setError('Please enter your email first');
      return;
    }
    const emailValidation = validateInput(email, 'email', { required: true });
    if (!emailValidation.valid) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await resetPassword(email.trim().toLowerCase());
      setResetSent(true);
    } catch (err) {
      setError(getErrorMessage(err.code || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 shadow-elevated animate-fade-in">
          <div className="text-center mb-8">
            <img src="/mp360-logo.png" alt="MarkPro 360 Logo" className="w-24 h-24 rounded-2xl object-contain mx-auto mb-4 shadow-lg" />
            <h1 className="text-headline-md text-on-surface">MarkPro 360 Office</h1>
            <p className="text-body-md text-on-surface-variant mt-1">MarkPro 360 - Admin Login</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-error-container text-on-error-container text-body-md flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">error</span>
                {error}
              </div>
            )}
            {retryAfter > 0 && (
              <div className="p-3 rounded-lg bg-amber-50 text-amber-700 text-body-md flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">timer</span>
                Too many attempts. Please wait {retryAfter} seconds.
              </div>
            )}
            {resetSent && (
              <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 text-body-md flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">check_circle</span>
                Password reset email sent. Check your inbox.
              </div>
            )}

            <div>
              <label className="block text-label-md text-on-surface-variant mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@markpro360.com"
                required
                autoComplete="email"
                maxLength={254}
                className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors"
              />
            </div>

            <div>
              <label className="block text-label-md text-on-surface-variant mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                maxLength={128}
                className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading || retryAfter > 0}
              className="w-full py-2.5 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:brightness-110 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <LoadingSpinner size="sm" /> : null}
              Sign In
            </button>

            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="w-full text-center text-label-md text-primary hover:text-primary-container transition-colors"
            >
              Forgot password?
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function getErrorMessage(code) {
  const messages = {
    'auth/user-not-found': 'No account found with this email',
    'auth/invalid-credential': 'Invalid email or password',
    'auth/wrong-password': 'Invalid password',
    'auth/invalid-email': 'Invalid email address',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment before trying again.',
    'auth/user-disabled': 'This account has been disabled',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/missing-email': 'Please enter your email address',
    'auth/operation-not-allowed': 'Email/password sign-in is not enabled for this account',
    'Invalid login credentials': 'Invalid email or password. Make sure you have created a user in Supabase Auth.',
    'Email not confirmed': 'Please confirm your email address before signing in.',
    'over_request_rate_limit': 'Too many requests. Please wait and try again.',
    'AuthException: Invalid login credentials': 'Invalid email or password. Make sure you have created a user in Supabase Auth.',
  };
  const msg = messages[code];
  if (msg) return msg;
  if (code && code.includes('Invalid login')) return 'Invalid email or password. Make sure you have created a user in Supabase Auth.';
  return `Error: ${code || 'An error occurred. Please try again'}`;
}
