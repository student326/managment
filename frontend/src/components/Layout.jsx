import { useState, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/students': 'Student Records',
  '/add-student': 'Add Student',
  '/data-sync': 'Data Sync',
  '/reports': 'Reports',
  '/settings': 'Settings',
  '/profile': 'Profile',
  '/financial-dashboard': 'Financial Overview',
  '/transactions': 'Transaction Log',
  '/expenses': 'Expense Tracking',
  '/installments': 'Installment Plans',
  '/receipts': 'Fee Receipts',
  '/courses': 'Courses',
  '/batches': 'Batches',
};

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [globalSearch, setGlobalSearch] = useState('');
  const location = useLocation();

  const currentPageTitle = pageTitles[location.pathname] || 'Dashboard';
  const isSearchPage = ['/students', '/transactions', '/expenses', '/installments', '/receipts'].includes(location.pathname);

  const handleSearch = useCallback((value) => {
    setGlobalSearch(value);
  }, []);

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="lg:ml-[260px] min-h-screen flex flex-col">
        <TopNav
          title={currentPageTitle}
          searchPlaceholder={isSearchPage ? 'Search records...' : false}
          onSearch={isSearchPage ? handleSearch : undefined}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet context={{ globalSearch }} />
        </main>
      </div>
    </div>
  );
}
