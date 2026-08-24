import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { RecordPaymentModal } from './RecordPaymentModal';
import { useSearchParams } from 'react-router-dom';
import {
  DollarSign, Plus, Search, Trash2, Calendar, FileText, ArrowUpRight
} from 'lucide-react';

export const PaymentList: React.FC = () => {
  const { payments, deletePayment } = useData();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsModalOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const filteredPayments = payments.filter(p => {
    const query = searchQuery.toLowerCase();
    return (
      p.clientName.toLowerCase().includes(query) ||
      p.invoiceNumber.toLowerCase().includes(query) ||
      p.paymentMethod.toLowerCase().includes(query) ||
      (p.referenceNumber && p.referenceNumber.toLowerCase().includes(query))
    );
  });

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  const handleDelete = (id: string, amount: number, client: string) => {
    if (confirm(`Are you sure you want to delete payment of ₹${amount.toLocaleString('en-IN')} from ${client}? This will recalculate the invoice balance.`)) {
      deletePayment(id);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">Client Payments Ledger</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Track all client payments and automatically update invoice balances and statuses.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Payment</span>
        </button>
      </div>

      {/* Summary KPI Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-5 rounded-2xl shadow-md flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">Total Payments Collected</span>
          <h2 className="text-2xl sm:text-3xl font-black mt-0.5">₹{totalCollected.toLocaleString('en-IN')}</h2>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
          <DollarSign className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-[#1A1A1A] p-4 rounded-2xl border border-gray-200 dark:border-[#2A2A2A] shadow-xs flex items-center space-x-3">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by client name, invoice number, payment method, or transaction reference..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs bg-transparent focus:outline-none text-gray-900 dark:text-gray-100"
        />
      </div>

      {/* Payment Ledger Table */}
      <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-[#222] text-gray-400 uppercase text-[10px] font-bold border-b border-gray-100 dark:border-[#2A2A2A]">
              <tr>
                <th className="py-3 px-4">Payment Date</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Ref / Transaction #</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#2A2A2A]">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/80 dark:hover:bg-[#222] transition">
                  <td className="py-3.5 px-4 font-semibold text-gray-800 dark:text-gray-200">
                    {p.paymentDate}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-gray-100">
                    {p.invoiceNumber}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-gray-800 dark:text-gray-200">
                    {p.clientName}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-[10px]">
                      {p.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-gray-500 text-[11px]">
                    {p.referenceNumber || 'N/A'}
                  </td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                    + ₹{p.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => handleDelete(p.id, p.amount, p.clientName)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      title="Delete payment & update invoice balance"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPayments.length === 0 && (
          <div className="p-12 text-center space-y-3">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">No Payments Recorded</h3>
            <p className="text-xs text-gray-400">Click "Record New Payment" to log client receipts.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <RecordPaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
