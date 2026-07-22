import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExcel } from '../hooks/useExcel';
import DataTable from '../components/DataTable';
import FilterChips from '../components/FilterChips';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Students() {
  const { students, loading, deleteStudent } = useExcel();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleting, setDeleting] = useState(null);
  const [actionError, setActionError] = useState('');
  const pageSize = 10;

  const filtered = useMemo(() => {
    let data = students;
    if (filter !== 'All') {
      data = data.filter((s) => s.status?.toLowerCase() === filter.toLowerCase());
    }
    const q = (search).toLowerCase();
    if (q) {
      data = data.filter(
        (s) =>
          (s.studentName || '').toLowerCase().includes(q) ||
          (s.studentId || '').toLowerCase().includes(q) ||
          (s.course || '').toLowerCase().includes(q) ||
          (s.batch || '').toLowerCase().includes(q) ||
          (s.phone || '').toLowerCase().includes(q) ||
          (s.email || '').toLowerCase().includes(q)
      );
    }
    return data;
  }, [students, filter, search]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  const handleDelete = async (e, student) => {
    e.stopPropagation();
    const id = student.studentId || student.id;
    if (!window.confirm(`Delete student ${student.studentName || id}?`)) return;
    setDeleting(id);
    setActionError('');
    try {
      await deleteStudent(id);
    } catch (err) {
      console.error('Delete failed:', err);
      setActionError('Failed to delete. Check your connection.');
    } finally {
      setDeleting(null);
    }
  };

  const columns = [
    { key: 'name', label: 'Student' },
    { key: 'studentId', label: 'ID' },
    { key: 'course', label: 'Course' },
    { key: 'batch', label: 'Batch' },
    { key: 'totalFee', label: 'Total Fee', type: 'currency' },
    { key: 'paid', label: 'Paid', type: 'currency' },
    { key: 'pending', label: 'Pending', type: 'currency' },
    { key: 'status', label: 'Status' },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/edit-student/${row.studentId}`); }}
            className="p-1 text-on-surface-variant hover:text-primary transition-colors"
            title="Edit"
          >
            <span className="material-symbols-outlined text-lg">edit</span>
          </button>
          <button
            onClick={(e) => handleDelete(e, row)}
            disabled={deleting === (row.studentId || row.id)}
            className="p-1 text-on-surface-variant hover:text-error transition-colors disabled:opacity-50"
            title="Delete"
          >
            {deleting === (row.studentId || row.id) ? <LoadingSpinner size="sm" /> : <span className="material-symbols-outlined text-lg">delete</span>}
          </button>
        </>
      ),
    },
  ];

  if (loading) return <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" text="Loading students..." /></div>;

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-headline-md text-on-surface">Student Records</h1>
          <p className="text-body-md text-on-surface-variant mt-1">{students.length} total students</p>
        </div>
        <button onClick={() => navigate('/add-student')} className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:brightness-110 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-lg">person_add</span>Add Student
        </button>
      </div>
      {actionError && (
        <div className="p-3 rounded-lg bg-error-container text-on-error-container text-body-md flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">error</span>{actionError}
          <button onClick={() => setActionError('')} className="ml-auto"><span className="material-symbols-outlined text-lg">close</span></button>
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative w-full sm:w-auto">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
          <input type="search" placeholder="Search students..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} maxLength={100} className="w-full sm:w-64 pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-full text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
        </div>
        <FilterChips options={['All', 'Paid', 'Partial', 'Unpaid']} active={filter} onChange={(val) => { setFilter(val); setCurrentPage(1); }} />
      </div>
      <DataTable columns={columns} data={paginated} emptyMessage="No students found" />
      {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filtered.length} onPageChange={setCurrentPage} />}
    </div>
  );
}
