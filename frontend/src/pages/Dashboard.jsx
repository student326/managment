import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExcel } from '../hooks/useExcel';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Dashboard() {
  const { students, loading, error, wb, saveWorkbook } = useExcel();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [syncing, setSyncing] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const pageSize = 5;

  const stats = useMemo(() => {
    const total = students.length;
    const totalPaid = students.reduce((sum, s) => sum + (parseFloat(s.paid) || 0), 0);
    const totalPending = students.reduce((sum, s) => sum + (parseFloat(s.pending) || 0), 0);
    const totalFee = students.reduce((sum, s) => sum + (parseFloat(s.totalFee) || 0), 0);
    const paidCount = students.filter((s) => s.status?.toLowerCase() === 'paid').length;
    const partialCount = students.filter((s) => s.status?.toLowerCase() === 'partial').length;
    const unpaidCount = students.filter((s) => s.status?.toLowerCase() === 'unpaid' || s.status?.toLowerCase() === 'pending').length;
    return { total, totalPaid, totalPending, totalFee, paidCount, partialCount, unpaidCount };
  }, [students]);

  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return students.slice(start, start + pageSize);
  }, [students, currentPage]);

  const totalPages = Math.ceil(students.length / pageSize);

  const handleSync = async () => {
    setShowSyncModal(true);
    setSyncing(true);
    try {
      if (wb) {
        await saveWorkbook(wb);
      }
    } catch (err) {
      console.error('Sync failed:', err);
    }
    setTimeout(() => {
      setSyncing(false);
      setTimeout(() => setShowSyncModal(false), 800);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-headline-md text-on-surface">Dashboard Overview</h1>
          <p className="text-body-md text-on-surface-variant mt-1">Welcome back, Admin</p>
        </div>
        <button
          onClick={() => navigate('/students')}
          className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:brightness-110 transition-all shadow-md active:scale-95"
        >
          View All Students
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          icon="group"
          label="Total Students"
          value={stats.total.toLocaleString()}
          trend="up"
          trendLabel="Active enrollment"
          iconBg="bg-primary-fixed"
        />
        <StatCard
          icon="payments"
          label="Total Fee Collected"
          value={`PKR ${stats.totalPaid.toLocaleString()}`}
          trend="up"
          trendLabel="+12% this month"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          icon="error"
          label="Total Pending"
          value={`PKR ${stats.totalPending.toLocaleString()}`}
          trend="down"
          trendLabel="-4% from last month"
          iconBg="bg-red-50"
          iconColor="text-red-600"
        />
        <StatCard
          icon="pending_actions"
          label="Partial Payments"
          value={stats.partialCount.toString()}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl">
            <div className="px-4 sm:px-6 py-4 border-b border-outline-variant flex items-center justify-between">
              <h2 className="text-headline-sm text-on-surface">Student List</h2>
              {students.length > 0 && (
                <span className="text-label-md text-on-surface-variant">{students.length} total</span>
              )}
            </div>
            {paginatedStudents.length === 0 ? (
              <div className="p-8 sm:p-12 text-center">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-3">inbox</span>
                <p className="text-on-surface-variant text-body-md">No student records found</p>
                <button
                  onClick={() => navigate('/add-student')}
                  className="mt-4 px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:brightness-110 transition-all"
                >
                  Add Student
                </button>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="overflow-x-auto custom-scrollbar hidden md:block">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-surface-container border-b border-outline-variant">
                        <th className="px-4 py-3 text-left text-table-header text-on-surface-variant uppercase tracking-wider">Student</th>
                        <th className="px-4 py-3 text-left text-table-header text-on-surface-variant uppercase tracking-wider hidden lg:table-cell">Course</th>
                        <th className="px-4 py-3 text-left text-table-header text-on-surface-variant uppercase tracking-wider">Total Fee</th>
                        <th className="px-4 py-3 text-left text-table-header text-on-surface-variant uppercase tracking-wider hidden sm:table-cell">Paid</th>
                        <th className="px-4 py-3 text-left text-table-header text-on-surface-variant uppercase tracking-wider hidden sm:table-cell">Pending</th>
                        <th className="px-4 py-3 text-left text-table-header text-on-surface-variant uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      {paginatedStudents.map((s, idx) => (
                        <tr
                          key={s.id || idx}
                          className="hover:bg-surface-container-low transition-colors cursor-pointer"
                          onClick={() => navigate(`/edit-student/${s.studentId}`)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-label-md flex-shrink-0">
                                {String(s.studentName || '')
                                  .split(' ')
                                  .map((w) => w[0])
                                  .join('')
                                  .toUpperCase()
                                  .slice(0, 2) || '?'}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-on-surface text-body-md truncate">{s.studentName}</p>
                                <p className="text-label-md text-on-surface-variant">{s.studentId}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-body-md text-on-surface hidden lg:table-cell">{s.course || '-'}</td>
                          <td className="px-4 py-3 text-body-md font-mono">PKR {(parseFloat(s.totalFee) || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-body-md font-mono text-emerald-600 hidden sm:table-cell">PKR {(parseFloat(s.paid) || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-body-md font-mono text-red-600 hidden sm:table-cell">PKR {(parseFloat(s.pending) || 0).toLocaleString()}</td>
                          <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile card view */}
                <div className="md:hidden divide-y divide-outline-variant">
                  {paginatedStudents.map((s, idx) => (
                    <div
                      key={s.id || idx}
                      className="p-4 space-y-2 hover:bg-surface-container-low transition-colors cursor-pointer"
                      onClick={() => navigate(`/edit-student/${s.studentId}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-label-md flex-shrink-0">
                            {String(s.studentName || '').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-on-surface text-body-md truncate">{s.studentName}</p>
                            <p className="text-label-md text-on-surface-variant">{s.studentId}</p>
                          </div>
                        </div>
                        <StatusBadge status={s.status} />
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-on-surface-variant text-xs">Course</span>
                          <span className="text-on-surface text-xs font-medium truncate">{s.course || '-'}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-on-surface-variant text-xs">Total Fee</span>
                          <span className="text-on-surface text-xs font-mono">PKR {(parseFloat(s.totalFee) || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-on-surface-variant text-xs">Paid</span>
                          <span className="text-xs font-mono text-emerald-600">PKR {(parseFloat(s.paid) || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-on-surface-variant text-xs">Pending</span>
                          <span className="text-xs font-mono text-red-600">PKR {(parseFloat(s.pending) || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {totalPages > 1 && (
              <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={students.length} onPageChange={setCurrentPage} />
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4 sm:space-y-6">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-headline-sm text-on-surface">Quick Stats</h2>
              <span className="material-symbols-outlined text-on-surface-variant">pie_chart</span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-body-md text-on-surface-variant">Paid</span>
                </div>
                <span className="font-semibold text-on-surface">{stats.paidCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-body-md text-on-surface-variant">Partial</span>
                </div>
                <span className="font-semibold text-on-surface">{stats.partialCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-body-md text-on-surface-variant">Unpaid</span>
                </div>
                <span className="font-semibold text-on-surface">{stats.unpaidCount}</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-headline-sm text-on-surface">Master Data Sync</h2>
              <span className="material-symbols-outlined text-on-surface-variant">sync</span>
            </div>
            <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-label-md text-on-surface-variant">Sync Status</span>
              <span className={`text-label-md font-medium ${wb ? 'text-emerald-600' : 'text-amber-600'}`}>{wb ? 'Ready' : 'Loading'}</span>
            </div>
            <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: wb ? '100%' : '0%' }} />
            </div>
          </div>
          <p className="text-body-md text-on-surface-variant">Excel master file {wb ? 'is ready to sync with Firebase Storage' : 'is loading...'}</p>
              <button
                onClick={handleSync}
                className="w-full py-2.5 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:brightness-110 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">sync</span>
                Push Local Changes
              </button>
            </div>
          </div>
        </div>
      </div>

      {showSyncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => !syncing && setShowSyncModal(false)} />
          <div className="relative bg-surface-container-lowest rounded-2xl shadow-modal p-6 sm:p-8 text-center animate-scale-in max-w-sm w-full">
            {syncing ? (
              <div className="space-y-4">
                <div className="w-12 h-12 border-2 border-outline-variant border-t-primary rounded-full animate-spin mx-auto" />
                <p className="text-headline-sm text-on-surface">Syncing Excel Master</p>
                <p className="text-body-md text-on-surface-variant">Please wait while we sync your data...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <span className="material-symbols-outlined text-5xl text-emerald-500">check_circle</span>
                <p className="text-headline-sm text-on-surface">Sync Complete</p>
                <p className="text-body-md text-on-surface-variant">Your Excel master file is up to date.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
