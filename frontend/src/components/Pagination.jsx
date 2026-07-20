export default function Pagination({ currentPage, totalPages, totalItems, onPageChange }) {
  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-surface-container-lowest border-t border-outline-variant gap-2">
      <p className="text-label-sm sm:text-label-md text-on-surface-variant text-center sm:text-left">
        Page {currentPage}/{totalPages} ({totalItems} records)
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <span className="material-symbols-outlined text-lg">chevron_left</span>
        </button>
        {getPages().map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-8 h-8 rounded-lg text-label-md font-medium transition-colors ${
              page === currentPage
                ? 'bg-primary text-on-primary'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <span className="material-symbols-outlined text-lg">chevron_right</span>
        </button>
      </div>
    </div>
  );
}
