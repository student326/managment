import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAdmin, resetPassword } from '../firebase/auth';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginAdmin(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!email) {
      setError('Please enter your email first');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (err) {
      setError(getErrorMessage(err.code));
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
            <h1 className="text-headline-md text-on-surface">Bursar Office</h1>
            <p className="text-body-md text-on-surface-variant mt-1">MarkPro 360 - Admin Login</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-error-container text-on-error-container text-body-md flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">error</span>
                {error}
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
                className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#00236f] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
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
    'auth/wrong-password': 'Invalid password',
    'auth/invalid-credential': 'Invalid email or password',
    'auth/invalid-email': 'Invalid email address',
    'auth/too-many-requests': 'Too many attempts. Try again later',
    'auth/user-disabled': 'This account has been disabled',
  };
  return messages[code] || 'An error occurred. Please try again';
}
