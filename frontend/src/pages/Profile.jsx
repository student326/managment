import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { resetPassword } from '../supabase/auth';

export default function Profile() {
  const { user } = useAuth();
  const [resetSent, setResetSent] = useState(false);

  const handleReset = async () => {
    if (!user?.email) return;
    try {
      await resetPassword(user.email);
      setResetSent(true);
      setTimeout(() => setResetSent(false), 3000);
    } catch (err) {
      console.error('Reset failed:', err);
    }
  };

  const getInitials = (email) => {
    if (!email) return 'A';
    return email.charAt(0).toUpperCase();
  };

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <h1 className="text-headline-md text-on-surface">Profile</h1>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-on-primary text-display-lg font-bold mx-auto mb-4">
          {getInitials(user?.email)}
        </div>
        <h2 className="text-headline-sm text-on-surface">Admin User</h2>
        <p className="text-body-md text-on-surface-variant mt-1">{user?.email}</p>
        <p className="text-label-md text-on-surface-variant mt-1">
          Joined: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
        </p>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 sm:p-6">
        <h2 className="text-headline-sm text-on-surface mb-4">Account Settings</h2>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-surface-container-low rounded-lg">
            <div>
              <p className="text-body-md font-medium text-on-surface">Email Address</p>
              <p className="text-label-md text-on-surface-variant">{user?.email}</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-status-badge self-start sm:self-auto">
              Active
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-surface-container-low rounded-lg">
            <div>
              <p className="text-body-md font-medium text-on-surface">Password</p>
              <p className="text-label-md text-on-surface-variant">Change your password</p>
            </div>
            <button onClick={handleReset} className="px-4 py-2 border border-outline-variant rounded-lg text-label-md hover:bg-surface-container-low transition-colors">
              {resetSent ? 'Email Sent' : 'Reset Password'}
            </button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-surface-container-low rounded-lg">
            <div>
              <p className="text-body-md font-medium text-on-surface">Session Status</p>
              <p className="text-label-md text-on-surface-variant">Auto-logout after 30 minutes of inactivity</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-status-badge self-start sm:self-auto">Active</span>
          </div>
        </div>
        {resetSent && (
          <p className="mt-4 text-emerald-600 text-body-md flex items-center gap-1">
            <span className="material-symbols-outlined text-lg">check_circle</span>
            Password reset email sent to {user?.email}
          </p>
        )}
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
        <h2 className="text-headline-sm text-on-surface mb-4">About</h2>
        <div className="space-y-2 text-body-md text-on-surface-variant">
          <p>Student Fee Management System v1.0.0</p>
          <p>Built with React + Supabase + Tailwind CSS</p>
          <p>Data stored securely in Supabase PostgreSQL database</p>
        </div>
      </div>
    </div>
  );
}
