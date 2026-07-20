import { NavLink, useNavigate } from 'react-router-dom';
import { logoutAdmin } from '../firebase/auth';

const navItems = [
  { path: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { path: '/students', icon: 'group', label: 'Students' },
  { path: '/add-student', icon: 'person_add', label: 'Add Student' },
  { path: '/data-sync', icon: 'sync', label: 'Data Sync' },
  { path: '/reports', icon: 'assessment', label: 'Reports' },
];

const financialItems = [
  { path: '/financial-dashboard', icon: 'account_balance', label: 'Financial Overview' },
  { path: '/transactions', icon: 'receipt_long', label: 'Transactions' },
  { path: '/expenses', icon: 'receipt', label: 'Expenses' },
  { path: '/installments', icon: 'schedule', label: 'Installments' },
  { path: '/receipts', icon: 'print', label: 'Fee Receipts' },
];

const bottomItems = [
  { path: '/settings', icon: 'settings', label: 'Settings' },
];

export default function Sidebar({ collapsed, onToggle }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutAdmin();
    navigate('/login');
  };

  return (
    <>
      {!collapsed && (
        <div className="fixed inset-0 bg-black/20 z-30 lg:hidden" onClick={onToggle} />
      )}
      <aside className={`fixed left-0 top-0 h-screen w-[260px] bg-surface-container-lowest border-r border-outline-variant flex flex-col z-40 transition-transform duration-300 ${collapsed ? '-translate-x-full' : 'translate-x-0'} lg:translate-x-0`}>
        <div className="px-6 py-6 border-b border-outline-variant">
          <div className="flex items-center gap-4">
            <img src="/mp360-logo.png" alt="MarkPro 360 Logo" className="w-16 h-16 rounded-xl object-contain shadow-md" />
            <div>
              <h1 className="text-headline-sm text-on-surface">Bursar Office</h1>
              <p className="text-label-md text-on-surface-variant">MarkPro 360</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg font-label-md text-label-md transition-all duration-200 ${
                  isActive
                    ? 'sidebar-active'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`
              }
            >
              <span className="material-symbols-outlined text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          <div className="pt-4 pb-2">
            <p className="px-4 text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Finance</p>
          </div>

          {financialItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg font-label-md text-label-md transition-all duration-200 ${
                  isActive
                    ? 'sidebar-active'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`
              }
            >
              <span className="material-symbols-outlined text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          <div className="pt-4 pb-2">
            <p className="px-4 text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">System</p>
          </div>

          {bottomItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg font-label-md text-label-md transition-all duration-200 ${
                  isActive
                    ? 'sidebar-active'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`
              }
            >
              <span className="material-symbols-outlined text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-outline-variant space-y-2">
          <button
            onClick={() => navigate('/reports')}
            className="w-full flex items-center gap-3 px-4 py-2.5 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:brightness-110 transition-all shadow-md active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            Export Report
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-on-surface-variant hover:text-error hover:bg-error-container/30 rounded-lg font-label-md text-label-md transition-colors"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
