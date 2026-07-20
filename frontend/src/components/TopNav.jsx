import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function TopNav({ title, searchPlaceholder, onSearch, onToggleSidebar }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');

  const handleChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    if (onSearch) onSearch(value);
  };

  const getInitials = (email) => {
    if (!email) return 'A';
    return email.charAt(0).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-20 bg-surface-bright border-b border-outline-variant">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 -ml-2 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <img src="/mp360-logo.png" alt="Logo" className="w-10 h-10 rounded-lg object-contain lg:hidden" />
          <h1 className="text-display-lg text-on-surface hidden sm:block">{title}</h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {searchPlaceholder !== false && (
            <div className="relative hidden sm:block">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
              <input
                type="search"
                placeholder={searchPlaceholder || 'Search...'}
                value={searchValue}
                onChange={handleChange}
                className="w-40 sm:w-56 lg:w-80 pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-full text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          )}

          <button onClick={() => navigate('/profile')} className="flex items-center gap-2 sm:gap-3 sm:pl-4 sm:border-l border-outline-variant hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary text-label-md font-bold">
              {getInitials(user?.email)}
            </div>
            <div className="hidden md:block">
              <p className="text-label-md text-on-surface font-medium truncate max-w-[120px]">
                {user?.email || 'Admin'}
              </p>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
