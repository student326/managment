import { useState, useMemo, useRef, useEffect } from 'react';
import { useExcel } from '../hooks/useExcel';
import { getTransactions, generateReceiptNumber } from '../services/financialService';
import LoadingSpinner from '../components/LoadingSpinner';

export default function FeeReceipts() {
  const { students, loading } = useExcel();
  const [txList, setTxList] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedTx, setSelectedTx] = useState(null);
  const receiptRef = useRef();

  useEffect(() => {
    if (!loading) {
      getTransactions()
        .then((txs) => setTxList(txs.filter((t) => t.type === 'Fee Payment' || t.type === 'Installment')))
        .catch(() => setTxList([]));
    }
  }, [loading]);

  const filtered = useMemo(() => {
    if (!search) return txList;
    const q = search.toLowerCase();
    return txList.filter((t) => (t.studentId || '').toLowerCase().includes(q) || (t.studentName || '').toLowerCase().includes(q) || (t.receiptNo || '').toLowerCase().includes(q));
  }, [txList, search]);

  const handlePrint = () => {
    const content = receiptRef.current;
    if (!content) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>Fee Receipt</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
        .receipt { max-width: 500px; margin: 0 auto; border: 2px solid #00236f; padding: 24px; }
        .header { text-align: center; border-bottom: 2px solid #00236f; padding-bottom: 12px; margin-bottom: 16px; }
        .header h1 { font-size: 20px; color: #00236f; margin: 0; }
        .header p { font-size: 12px; color: #666; margin: 4px 0 0; }
        .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dotted #ddd; }
        .row .label { font-size: 13px; color: #666; }
        .row .value { font-size: 13px; font-weight: bold; }
        .total { text-align: center; font-size: 22px; font-weight: bold; color: #00236f; padding: 16px 0; border-top: 2px solid #00236f; margin-top: 12px; }
        .footer { text-align: center; font-size: 11px; color: #999; margin-top: 16px; }
      </style></head><body>
      ${content.innerHTML}
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" text="Loading receipts..." /></div>;

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-headline-md text-on-surface">Fee Receipts</h1>
          <p className="text-body-md text-on-surface-variant mt-1">View and print payment receipts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        <div className="lg:col-span-5">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl">
            <div className="px-4 sm:px-6 py-4 border-b border-outline-variant">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
                <input type="search" placeholder="Search receipts..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-full text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
              </div>
            </div>
            {filtered.length === 0 ? (
              <div className="p-12 text-center">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-3">receipt_long</span>
                <p className="text-body-md text-on-surface-variant">No payment receipts available</p>
              </div>
            ) : (
              <div className="divide-y divide-outline-variant max-h-[600px] overflow-y-auto custom-scrollbar">
                {filtered.map((tx) => (
                  <button
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className={`w-full px-6 py-4 text-left hover:bg-surface-container-low transition-colors ${selectedTx?.id === tx.id ? 'bg-primary-fixed' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-body-md font-medium text-on-surface">{tx.studentName || 'N/A'}</p>
                        <p className="text-label-md text-on-surface-variant">{tx.date} | {tx.method}</p>
                      </div>
                      <p className="text-body-md font-mono font-semibold text-emerald-600">PKR {(parseFloat(tx.amount) || 0).toLocaleString()}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-7">
          {selectedTx ? (
            <div className="space-y-4">
              <div className="flex items-center justify-end">
                <button onClick={handlePrint} className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:brightness-110 transition-all shadow-md active:scale-95 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">print</span>
                  Print Receipt
                </button>
              </div>
              <div ref={receiptRef}>
                <div className="receipt" style={{ maxWidth: 500, margin: '0 auto', border: '2px solid #00236f', padding: 24, fontFamily: 'Arial, sans-serif' }}>
                  <div style={{ textAlign: 'center', borderBottom: '2px solid #00236f', paddingBottom: 12, marginBottom: 16 }}>
                    <h1 style={{ fontSize: 20, color: '#00236f', margin: 0 }}>MarkPro 360 Office</h1>
                    <p style={{ fontSize: 12, color: '#666', margin: '4px 0 0' }}>Fee Payment Receipt</p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dotted #ddd' }}>
                    <span style={{ fontSize: 13, color: '#666' }}>Receipt No:</span>
                    <span style={{ fontSize: 13, fontWeight: 'bold' }}>{selectedTx.receiptNo || generateReceiptNumber()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dotted #ddd' }}>
                    <span style={{ fontSize: 13, color: '#666' }}>Date:</span>
                    <span style={{ fontSize: 13, fontWeight: 'bold' }}>{selectedTx.date}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dotted #ddd' }}>
                    <span style={{ fontSize: 13, color: '#666' }}>Student ID:</span>
                    <span style={{ fontSize: 13, fontWeight: 'bold' }}>{selectedTx.studentId || '-'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dotted #ddd' }}>
                    <span style={{ fontSize: 13, color: '#666' }}>Student Name:</span>
                    <span style={{ fontSize: 13, fontWeight: 'bold' }}>{selectedTx.studentName || '-'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dotted #ddd' }}>
                    <span style={{ fontSize: 13, color: '#666' }}>Payment Type:</span>
                    <span style={{ fontSize: 13, fontWeight: 'bold' }}>{selectedTx.type}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dotted #ddd' }}>
                    <span style={{ fontSize: 13, color: '#666' }}>Payment Method:</span>
                    <span style={{ fontSize: 13, fontWeight: 'bold' }}>{selectedTx.method}</span>
                  </div>
                  {selectedTx.description && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dotted #ddd' }}>
                      <span style={{ fontSize: 13, color: '#666' }}>Description:</span>
                      <span style={{ fontSize: 13, fontWeight: 'bold' }}>{selectedTx.description}</span>
                    </div>
                  )}
                  <div style={{ textAlign: 'center', fontSize: 22, fontWeight: 'bold', color: '#00236f', padding: '16px 0', borderTop: '2px solid #00236f', marginTop: 12 }}>
                    PKR {(parseFloat(selectedTx.amount) || 0).toLocaleString()}
                  </div>
                  <p style={{ textAlign: 'center', fontSize: 11, color: '#999', marginTop: 16 }}>This is a computer-generated receipt. No signature required.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-12 text-center">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-3">receipt_long</span>
              <p className="text-headline-sm text-on-surface">Select a receipt to preview</p>
              <p className="text-body-md text-on-surface-variant mt-1">Choose a payment from the list to view and print its receipt</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
