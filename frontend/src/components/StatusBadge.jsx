export default function StatusBadge({ status }) {
  const statusMap = {
    paid: { class: 'status-paid', label: 'Paid' },
    partial: { class: 'status-partial', label: 'Partial' },
    unpaid: { class: 'status-unpaid', label: 'Unpaid' },
    pending: { class: 'status-unpaid', label: 'Pending' },
    waived: { class: 'bg-purple-50 text-purple-700 rounded-full px-3 py-1 text-status-badge', label: 'Waived' },
  };

  const s = statusMap[status?.toLowerCase()] || statusMap.unpaid;

  return <span className={s.class}>{s.label}</span>;
}
