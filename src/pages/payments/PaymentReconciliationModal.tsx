import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Modal } from '../../components/common/Modal';
import { Payment } from '../../types';
import {
  analyzePaymentLedger,
  exportPaymentsJSON,
  exportPaymentsCSV,
  ReconciliationSummary
} from '../../lib/reconciliationUtils';
import {
  ShieldAlert, ShieldCheck, AlertTriangle, FileSpreadsheet, FileJson,
  RefreshCw, CheckCircle2, Trash2, HelpCircle, AlertCircle, Info, Lock
} from 'lucide-react';

interface PaymentReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentReconciliationModal: React.FC<PaymentReconciliationModalProps> = ({
  isOpen,
  onClose
}) => {
  const { payments, invoices, reconcileAndCleanupPayments } = useData();

  const [activeTab, setActiveTab] = useState<'duplicates' | 'unlinked' | 'all'>('duplicates');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [reviewPaymentItem, setReviewPaymentItem] = useState<any | null>(null);

  // Perform dry-run ledger analysis
  const summary: ReconciliationSummary = useMemo(() => {
    return analyzePaymentLedger(payments, invoices);
  }, [payments, invoices]);

  // Pre-select candidate duplicates on initial modal open or summary calculation
  React.useEffect(() => {
    if (isOpen) {
      const candidateIds = summary.analysisItems
        .filter(i => i.isCandidateDuplicate)
        .map(i => i.payment.id);
      setSelectedIds(new Set(candidateIds));
    }
  }, [isOpen, summary]);

  // Filter items based on active tab and search query
  const filteredItems = useMemo(() => {
    return summary.analysisItems.filter(item => {
      const p = item.payment;
      const matchesSearch =
        p.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.referenceNumber && p.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (activeTab === 'duplicates') return item.isCandidateDuplicate;
      if (activeTab === 'unlinked') return item.isUnlinked;
      return true;
    });
  }, [summary, activeTab, searchQuery]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    const allFilteredIds = filteredItems.map(i => i.payment.id);
    const allSelected = allFilteredIds.every(id => selectedIds.has(id));

    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        allFilteredIds.forEach(id => next.delete(id));
      } else {
        allFilteredIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const handleExportJSON = () => {
    const selectedList = payments.filter(p => selectedIds.has(p.id));
    if (selectedList.length === 0) {
      alert('Please select at least one payment record to export.');
      return;
    }
    exportPaymentsJSON(selectedList);
  };

  const handleExportCSV = () => {
    const selectedList = payments.filter(p => selectedIds.has(p.id));
    if (selectedList.length === 0) {
      alert('Please select at least one payment record to export.');
      return;
    }
    exportPaymentsCSV(selectedList);
  };

  const handleExecuteCleanup = async () => {
    const idsArray = Array.from(selectedIds);
    if (idsArray.length === 0) return;

    setIsProcessing(true);

    const auditReasons: Record<string, string> = {};
    summary.analysisItems.forEach(item => {
      if (idsArray.includes(item.payment.id)) {
        auditReasons[item.payment.id] = item.evidenceReason;
      }
    });

    try {
      await reconcileAndCleanupPayments(idsArray, auditReasons);
      setIsProcessing(false);
      setShowConfirmModal(false);
      setSelectedIds(new Set());
      alert(`Cleanup Complete! ${idsArray.length} payment records reconciled.`);
      onClose();
    } catch (err: any) {
      setIsProcessing(false);
      alert(`Cleanup failed: ${err.message || 'Unknown error'}`);
    }
  };

  const selectedPaymentList = useMemo(() => {
    return payments.filter(p => selectedIds.has(p.id));
  }, [payments, selectedIds]);

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Payment Ledger Reconciliation & Duplicate Cleanup" maxWidth="2xl">
        <div className="space-y-5 text-xs font-sans">
          {/* Dry-Run Header Banner */}
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-amber-900 dark:text-amber-200 text-xs">Dry-Run Analysis Active</span>
                  <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-extrabold bg-amber-200 text-amber-900 rounded-md">
                    Analyze Only
                  </span>
                </div>
                <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                  Scanning ledger using multi-attribute evidence matching. No data will be deleted until explicitly confirmed.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 self-end sm:self-auto">
              <button
                onClick={handleExportJSON}
                disabled={selectedIds.size === 0}
                className="px-3 py-1.5 bg-white dark:bg-[#252525] border border-gray-200 dark:border-[#333] hover:bg-gray-50 text-gray-700 dark:text-gray-300 font-bold rounded-xl flex items-center space-x-1.5 disabled:opacity-50"
              >
                <FileJson className="w-3.5 h-3.5 text-blue-600" />
                <span>JSON</span>
              </button>

              <button
                onClick={handleExportCSV}
                disabled={selectedIds.size === 0}
                className="px-3 py-1.5 bg-white dark:bg-[#252525] border border-gray-200 dark:border-[#333] hover:bg-gray-50 text-gray-700 dark:text-gray-300 font-bold rounded-xl flex items-center space-x-1.5 disabled:opacity-50"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-xl text-center">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Scanned</span>
              <p className="text-base font-black text-gray-900 dark:text-gray-100">{summary.totalPayments}</p>
            </div>

            <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-center">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Legitimate</span>
              <p className="text-base font-black text-emerald-600 dark:text-emerald-400">{summary.legitimateCount}</p>
            </div>

            <div className="p-3 bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl text-center">
              <span className="text-[10px] text-red-600 dark:text-red-400 font-bold uppercase tracking-wider">Duplicates</span>
              <p className="text-base font-black text-[#E31B23]">{summary.candidateDuplicatesCount}</p>
            </div>

            <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl text-center">
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">Unlinked</span>
              <p className="text-base font-black text-amber-600 dark:text-amber-400">{summary.unlinkedCount}</p>
            </div>

            <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">Affected Invoices</span>
              <p className="text-base font-black text-blue-600 dark:text-blue-400">{summary.affectedInvoicesCount}</p>
            </div>
          </div>

          {/* Navigation Filter Tabs & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-[#2A2A2A] pb-3">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveTab('duplicates')}
                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1.5 ${
                  activeTab === 'duplicates'
                    ? 'bg-[#E31B23] text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-[#252525] text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Duplicates ({summary.candidateDuplicatesCount})</span>
              </button>

              <button
                onClick={() => setActiveTab('unlinked')}
                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1.5 ${
                  activeTab === 'unlinked'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-[#252525] text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Unlinked ({summary.unlinkedCount})</span>
              </button>

              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${
                  activeTab === 'all'
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-xs'
                    : 'bg-gray-100 dark:bg-[#252525] text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                <span>All Payments ({summary.totalPayments})</span>
              </button>
            </div>

            <input
              type="text"
              placeholder="Search record by client, invoice, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl text-xs w-full sm:w-64"
            />
          </div>

          {/* Ledger Analysis Table */}
          <div className="border border-gray-200 dark:border-[#2A2A2A] rounded-2xl overflow-hidden shadow-xs max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-[#222] text-gray-400 uppercase text-[10px] font-bold sticky top-0 border-b border-gray-100 dark:border-[#2A2A2A] z-10">
                <tr>
                  <th className="py-2.5 px-3 w-8">
                    <input
                      type="checkbox"
                      checked={filteredItems.length > 0 && filteredItems.every(i => selectedIds.has(i.payment.id))}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-[#E31B23]"
                    />
                  </th>
                  <th className="py-2.5 px-3">Payment ID</th>
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Client</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Method / Ref</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3">Evidence Reason</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#2A2A2A]">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-gray-400 font-medium">
                      No records match the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const p = item.payment;
                    const isSelected = selectedIds.has(p.id);

                    return (
                      <tr
                        key={p.id}
                        className={`hover:bg-gray-50/80 dark:hover:bg-[#252525] transition ${
                          isSelected ? 'bg-red-50/40 dark:bg-red-950/20' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(p.id)}
                            className="rounded border-gray-300 text-[#E31B23]"
                          />
                        </td>

                        <td className="py-2.5 px-3 font-mono text-[10px] text-gray-500 font-bold">
                          {p.id.slice(-10)}
                        </td>

                        <td className="py-2.5 px-3">
                          {item.isUnlinked ? (
                            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold text-[10px] rounded-md">
                              UNLINKED
                            </span>
                          ) : (
                            <span className="font-bold text-gray-900 dark:text-gray-100">
                              {item.invoiceNumber}
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 truncate max-w-[130px] font-semibold text-gray-700 dark:text-gray-300">
                          {p.clientName}
                        </td>

                        <td className="py-2.5 px-3 text-gray-500 font-mono text-[11px]">
                          {p.paymentDate}
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-gray-800 dark:text-gray-200">{p.paymentMethod}</div>
                          <div className="text-[10px] text-gray-400 font-mono">{p.referenceNumber || 'No Ref'}</div>
                        </td>

                        <td className="py-2.5 px-3 text-right font-black text-emerald-600">
                          ₹{p.amount.toLocaleString('en-IN')}
                        </td>

                        <td className="py-2.5 px-3 max-w-[180px]">
                          {item.isCandidateDuplicate ? (
                            <span className="px-2 py-0.5 bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-[10px] font-bold rounded-md block truncate">
                              {item.evidenceReason}
                            </span>
                          ) : item.isUnlinked ? (
                            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[10px] font-bold rounded-md block truncate">
                              {item.evidenceReason}
                            </span>
                          ) : (
                            <span className="text-emerald-600 text-[10px] font-bold flex items-center space-x-1">
                              <ShieldCheck className="w-3 h-3" />
                              <span>Valid Record</span>
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => toggleSelect(p.id)}
                              className={`px-2 py-1 rounded-md text-[10px] font-bold transition ${
                                isSelected
                                  ? 'bg-red-600 text-white'
                                  : 'bg-gray-100 dark:bg-[#333] text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                              }`}
                            >
                              {isSelected ? 'Marked Dup' : 'Keep'}
                            </button>

                            <button
                              onClick={() => setReviewPaymentItem(item)}
                              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                              title="Review Details"
                            >
                              <Info className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Modal Footer Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-[#2A2A2A]">
            <div className="text-xs text-gray-500 font-semibold">
              Selected for Cleanup: <span className="font-extrabold text-[#E31B23]">{selectedIds.size} records</span>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 dark:bg-[#252525] text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={selectedIds.size === 0}
                onClick={() => setShowConfirmModal(true)}
                className="px-5 py-2 bg-[#E31B23] hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition flex items-center space-x-2 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clean Up Selected Records ({selectedIds.size})</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Review Item Inspection Modal */}
      {reviewPaymentItem && (
        <Modal isOpen={Boolean(reviewPaymentItem)} onClose={() => setReviewPaymentItem(null)} title="Payment Evidence Details" maxWidth="sm">
          <div className="space-y-4 text-xs font-sans">
            <div className="p-3 bg-gray-50 dark:bg-[#222] rounded-xl space-y-2">
              <div className="flex justify-between border-b border-gray-200 dark:border-[#333] pb-1.5">
                <span className="text-gray-400 font-bold">Payment ID:</span>
                <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{reviewPaymentItem.payment.id}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 dark:border-[#333] pb-1.5">
                <span className="text-gray-400 font-bold">Invoice #:</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">{reviewPaymentItem.invoiceNumber}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 dark:border-[#333] pb-1.5">
                <span className="text-gray-400 font-bold">Client Name:</span>
                <span className="font-semibold text-gray-700 dark:text-gray-300">{reviewPaymentItem.payment.clientName}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 dark:border-[#333] pb-1.5">
                <span className="text-gray-400 font-bold">Amount:</span>
                <span className="font-black text-emerald-600 text-sm">₹{reviewPaymentItem.payment.amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 dark:border-[#333] pb-1.5">
                <span className="text-gray-400 font-bold">Payment Date:</span>
                <span className="font-mono text-gray-700 dark:text-gray-300">{reviewPaymentItem.payment.paymentDate}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 dark:border-[#333] pb-1.5">
                <span className="text-gray-400 font-bold">Method & Ref:</span>
                <span className="font-mono text-gray-700 dark:text-gray-300">{reviewPaymentItem.payment.paymentMethod} ({reviewPaymentItem.payment.referenceNumber || 'N/A'})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-bold">Created Timestamp:</span>
                <span className="font-mono text-gray-700 dark:text-gray-300">{reviewPaymentItem.payment.createdAt}</span>
              </div>
            </div>

            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl space-y-1">
              <span className="font-bold text-[#E31B23]">Evidence Finding:</span>
              <p className="text-gray-700 dark:text-gray-300 font-medium">{reviewPaymentItem.evidenceReason}</p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setReviewPaymentItem(null)}
                className="px-4 py-2 bg-gray-100 dark:bg-[#252525] text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200"
              >
                Close Review
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Explicit Confirmation Danger Modal */}
      {showConfirmModal && (
        <Modal isOpen={showConfirmModal} onClose={() => !isProcessing && setShowConfirmModal(false)} title="Confirm Payment Record Cleanup" maxWidth="md">
          <div className="space-y-4 text-xs font-sans">
            <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-2xl flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-[#E31B23] flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-extrabold text-red-900 dark:text-red-200 text-sm">Permanent Deletion Warning</h3>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1 leading-relaxed">
                  This will permanently delete the <strong>{selectedIds.size} selected payment records</strong> from Firestore and recalculate all affected invoice balances and payment statuses.
                </p>
              </div>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-xl max-h-48 overflow-y-auto space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Records Selected for Deletion:</span>
              {selectedPaymentList.map((p, i) => (
                <div key={p.id} className="flex justify-between items-center text-[11px] border-b border-gray-200/60 dark:border-[#333] pb-1">
                  <span className="font-bold text-gray-800 dark:text-gray-200">{i+1}. {p.invoiceNumber} — {p.clientName}</span>
                  <span className="font-black text-[#E31B23]">₹{p.amount.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100 dark:border-[#2A2A2A]">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-[#252525] text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={handleExecuteCleanup}
                className="px-5 py-2 bg-[#E31B23] hover:bg-red-700 text-white font-bold rounded-xl shadow-lg transition flex items-center space-x-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Deleting & Recalculating...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Confirm & Execute Cleanup</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
