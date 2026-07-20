export default function FilterChips({ options, active, onChange }) {
  const dotColors = {
    Paid: 'bg-emerald-500',
    paid: 'bg-emerald-500',
    Partial: 'bg-amber-500',
    partial: 'bg-amber-500',
    Unpaid: 'bg-red-500',
    unpaid: 'bg-red-500',
    Pending: 'bg-red-500',
    pending: 'bg-red-500',
    All: 'bg-primary',
    all: 'bg-primary',
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-label-md transition-all ${
            active === opt
              ? 'bg-primary text-on-primary border-primary'
              : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:bg-surface-container-low'
          }`}
        >
          {dotColors[opt] && !(active === opt) && (
            <span className={`w-2 h-2 rounded-full ${dotColors[opt]}`} />
          )}
          {opt}
        </button>
      ))}
    </div>
  );
}
