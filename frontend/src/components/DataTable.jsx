import StatusBadge from './StatusBadge';

export default function DataTable({
  columns,
  data,
  onEdit,
  onDelete,
  emptyMessage = 'No records found',
}) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-12 text-center">
        <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-3">inbox</span>
        <p className="text-on-surface-variant text-body-md">{emptyMessage}</p>
      </div>
    );
  }

  const renderCell = (row, col) => {
    const value = row[col.key];

    if (col.key === 'status' || col.key === 'feeStatus') {
      return <StatusBadge status={value} />;
    }

    if (col.key === 'actions' && col.render) {
      const rowActions = typeof col.render === 'function' ? col.render(row) : null;
      return (
        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(row)}
              className="p-1 text-on-surface-variant hover:text-primary transition-colors"
              title="Edit"
            >
              <span className="material-symbols-outlined text-lg">edit</span>
            </button>
          )}
          {col.render && rowActions}
        </div>
      );
    }

    if (col.type === 'currency') {
      const num = parseFloat(value) || 0;
      return <span className="font-mono">PKR {num.toLocaleString()}</span>;
    }

    if (col.type === 'date') {
      if (!value) return <span className="text-on-surface-variant">-</span>;
      try {
        return new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      } catch {
        return value;
      }
    }

    if (col.key === 'name' || col.key === 'studentName') {
      const initials = String(value || '')
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
      return (
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-xs sm:text-label-md flex-shrink-0">
            {initials || '?'}
          </div>
          <span className="font-medium text-on-surface truncate">{value}</span>
        </div>
      );
    }

    return <span className="truncate block max-w-[150px]">{value ?? '-'}</span>;
  };

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
      {/* Desktop table */}
      <div className="overflow-x-auto custom-scrollbar hidden md:block">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-container border-b border-outline-variant">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-table-header text-on-surface-variant uppercase tracking-wider"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {data.map((row, idx) => (
              <tr
                key={row.id || idx}
                className="hover:bg-surface-container-low transition-colors"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-body-md">
                    {renderCell(row, col)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden divide-y divide-outline-variant">
        {data.map((row, idx) => (
          <div key={row.id || idx} className="p-4 space-y-2 hover:bg-surface-container-low transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {(() => {
                  const nameCol = columns.find((c) => c.key === 'studentName' || c.key === 'name');
                  return nameCol ? renderCell(row, nameCol) : null;
                })()}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                {columns.filter((c) => c.key === 'status' || c.key === 'feeStatus').map((col) => (
                  <StatusBadge key={col.key} status={row[col.key]} />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {columns
                .filter((c) => c.key !== 'studentName' && c.key !== 'name' && c.key !== 'status' && c.key !== 'feeStatus' && c.key !== 'actions')
                .slice(0, 6)
                .map((col) => (
                  <div key={col.key} className="flex items-center justify-between gap-2">
                    <span className="text-on-surface-variant text-xs truncate">{col.label}</span>
                    <span className="text-on-surface text-xs font-medium truncate">{renderCell(row, col)}</span>
                  </div>
                ))}
            </div>
            {columns.some((c) => c.key === 'actions') && (
              <div className="flex items-center justify-end gap-1 pt-1 border-t border-outline-variant/50">
                {columns.filter((c) => c.key === 'actions').map((col) => renderCell(row, col))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
