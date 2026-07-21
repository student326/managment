import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { useEffect, useState } from 'react';
import { refreshUser } from '../firebase/auth';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const [emailVerified, setEmailVerified] = useState(null);

  useEffect(() => {
    if (user && !loading) {
      if (user.emailVerified === false && user.emailVerified !== undefined) {
        refreshUser().then((refreshed) => {
          setEmailVerified(refreshed?.emailVerified ?? false);
        }).catch(() => {
          setEmailVerified(false);
        });
      } else {
        setEmailVerified(true);
      }
    }
  }, [user, loading]);

  if (loading || (user && emailVerified === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (emailVerified === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface p-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 shadow-elevated max-w-md w-full text-center space-y-4">
          <span className="material-symbols-outlined text-5xl text-amber-500">mark_email_unread</span>
          <h2 className="text-headline-md text-on-surface">Email Verification Required</h2>
          <p className="text-body-md text-on-surface-variant">
            Please verify your email address before accessing the dashboard. Check your inbox for a verification link.
          </p>
          <button
            onClick={() => refreshUser().then((u) => setEmailVerified(u?.emailVerified ?? false))}
            className="px-6 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:brightness-110 transition-all shadow-md active:scale-95"
          >
            I verified my email
          </button>
          <button
            onClick={() => window.location.reload()}
            className="block w-full text-label-md text-primary hover:text-primary-container transition-colors"
          >
            Refresh page
          </button>
        </div>
      </div>
    );
  }

  return children;
}
