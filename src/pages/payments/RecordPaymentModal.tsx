import React, { useState, useEffect } from 'react';
import { Invoice, PaymentMethod } from '../../types';
import { useData } from '../../context/DataContext';
import { Modal } from '../../components/common/Modal';
import { IndianRupee, Save, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedInvoice?: Invoice | null;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  preselectedInvoice
}) => {
  const { invoices, addPayment } = useData();

  // Filter pending invoices
  const pendingInvoices = invoices.filter(i => i.paymentStatus !== 'fully_paid' || (preselectedInvoice && i.id === preselectedInvoice.id));

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(
    preselectedInvoice ? preselectedInvoice.id : (pendingInvoices[0]?.id || '')
  );

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(
    preselectedInvoice || pendingInvoices[0] || null
  );

  const [amount, setAmount] = useState<number>(
    preselectedInvoice ? preselectedInvoice.balanceAmount : 0
  );

  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank Transfer');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const found = invoices.find(i => i.id === selectedInvoiceId);
    if (found) {
      setSelectedInvoice(found);
      setAmount(found.balanceAmount);
    }
  }, [selectedInvoiceId, invoices]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError('');

    if (!selectedInvoice) {
      setError('Please select a valid invoice.');
      return;
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Payment amount must be a valid number greater than 0.');
      return;
    }

    if (numAmount > selectedInvoice.balanceAmount) {
      setError('Payment amount cannot exceed the remaining invoice balance.');
      return;
    }

    if (!selectedInvoice.clientId || !selectedInvoice.client) {
      setError('Selected invoice has invalid client information.');
      return;
    }

    setIsSubmitting(true);
    const operationToken = `op_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    try {
      await addPayment({
        invoiceId: selectedInvoice.id,
        invoiceNumber: selectedInvoice.invoiceNumber,
        clientId: selectedInvoice.clientId,
        clientName: `${selectedInvoice.client.name} (${selectedInvoice.client.companyName})`,
        amount: numAmount,
        paymentDate,
        paymentMethod,
        referenceNumber: referenceNumber.trim(),
        note: note.trim(),
        operationToken
      });

      if (numAmount >= selectedInvoice.balanceAmount) {
        confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
      }

      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || 'Payment processing failed. Please try again.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => !isSubmitting && onClose()} title="Record Client Payment" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-red-100 border border-red-200 text-red-800 text-xs font-semibold rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {pendingInvoices.length === 0 ? (
          <div className="p-4 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-emerald-600" />
            <span>All invoices are currently fully paid!</span>
          </div>
        ) : (
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
              Select Invoice *
            </label>
            <select
              disabled={isSubmitting}
              value={selectedInvoiceId}
              onChange={(e) => setSelectedInvoiceId(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl focus:ring-1 focus:ring-[#E31B23] disabled:opacity-50"
            >
              {pendingInvoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNumber} — {inv.client.name} | Total: ₹{inv.totalAmount.toLocaleString('en-IN')}, Balance Due: ₹{inv.balanceAmount.toLocaleString('en-IN')}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedInvoice && (
          <div className="p-3 bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl space-y-1">
            <div className="flex justify-between font-bold text-gray-800 dark:text-gray-200">
              <span>{selectedInvoice.client.name} ({selectedInvoice.client.companyName})</span>
              <span className="text-[#E31B23]">Due: ₹{selectedInvoice.balanceAmount.toLocaleString('en-IN')}</span>
            </div>
            <p className="text-[10px] text-gray-500">Invoice Total: ₹{selectedInvoice.totalAmount.toLocaleString('en-IN')} | Paid so far: ₹{selectedInvoice.paidAmount.toLocaleString('en-IN')}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
              Payment Amount (₹) *
            </label>
            <input
              type="number"
              required
              disabled={isSubmitting}
              min="1"
              max={selectedInvoice ? selectedInvoice.balanceAmount : undefined}
              step="any"
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs font-black text-emerald-600 bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl focus:ring-1 focus:ring-[#E31B23] disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
              Payment Date *
            </label>
            <input
              type="date"
              required
              disabled={isSubmitting}
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl focus:ring-1 focus:ring-[#E31B23] disabled:opacity-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
              Payment Method *
            </label>
            <select
              disabled={isSubmitting}
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2 text-xs font-medium bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl focus:ring-1 focus:ring-[#E31B23] disabled:opacity-50"
            >
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
              <option value="Card">Credit / Debit Card</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
              Ref / Transaction #
            </label>
            <input
              type="text"
              disabled={isSubmitting}
              placeholder="e.g. UTR98234710923"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl focus:ring-1 focus:ring-[#E31B23] disabled:opacity-50"
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
            Payment Note / Remarks
          </label>
          <textarea
            rows={2}
            disabled={isSubmitting}
            placeholder="e.g. 50% Advance received for web project"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl focus:ring-1 focus:ring-[#E31B23] disabled:opacity-50"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100 dark:border-[#2A2A2A]">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 dark:bg-[#252525] text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || pendingInvoices.length === 0}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center space-x-2 shadow-md transition disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Recording Payment...</span>
              </>
            ) : (
              <>
                <IndianRupee className="w-4 h-4" />
                <span>Record Payment</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
