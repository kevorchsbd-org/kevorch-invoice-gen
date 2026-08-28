import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Invoice } from '../../types';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DocumentPreviewModal } from '../../components/documents/DocumentPreviewModal';
import { SendEmailModal } from '../../components/documents/SendEmailModal';
import { RecordPaymentModal } from '../payments/RecordPaymentModal';
import { DeleteInvoiceModal } from './DeleteInvoiceModal';
import {
  CreditCard, Plus, Search, Eye, Edit, Trash2, Mail, Scale, IndianRupee, CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const InvoiceList: React.FC = () => {
  const { invoices, createBalanceInvoiceFromInvoice } = useData();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<Invoice | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [deleteTargetInvoice, setDeleteTargetInvoice] = useState<Invoice | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const filteredInvoices = invoices.filter(inv => {
    const query = searchQuery.toLowerCase();
    return (
      inv.invoiceNumber.toLowerCase().includes(query) ||
      inv.client.name.toLowerCase().includes(query) ||
      inv.client.companyName.toLowerCase().includes(query)
    );
  });

  const handlePreview = (inv: Invoice) => {
    setSelectedDoc(inv);
    setIsPreviewOpen(true);
  };

  const handleEmail = (inv: Invoice) => {
    setSelectedDoc(inv);
    setIsEmailOpen(true);
  };

  const handleCreateBalanceInvoice = async (inv: Invoice) => {
    if (inv.balanceAmount <= 0) {
      alert('This invoice has already been fully paid! No balance invoice required.');
      return;
    }
    const createdBal = await createBalanceInvoiceFromInvoice(inv.id);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    setSuccessToast(`Created Balance Invoice ${createdBal.balanceInvoiceNumber} for remaining ₹${createdBal.balanceAmountDue.toLocaleString('en-IN')}!`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const promptDeleteInvoice = (inv: Invoice) => {
    setDeleteTargetInvoice(inv);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteSuccess = (invoiceNumber: string) => {
    setSuccessToast(`Invoice ${invoiceNumber} deleted successfully.`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Alert */}
      {successToast && (
        <div className="p-4 bg-emerald-600 text-white font-bold text-xs rounded-2xl shadow-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="underline text-emerald-100 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">Invoices</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Manage client invoices, track advance payments, and generate balance invoices for remaining dues.
          </p>
        </div>

        <button
          onClick={() => navigate('/invoices/create')}
          className="px-4 py-2.5 bg-[#E31B23] hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Invoice</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-[#1A1A1A] p-4 rounded-2xl border border-gray-200 dark:border-[#2A2A2A] shadow-xs flex items-center space-x-3">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search invoices by invoice number, client name, or company..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs bg-transparent focus:outline-none text-gray-900 dark:text-gray-100"
        />
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-[#222] text-gray-400 uppercase text-[10px] font-bold border-b border-gray-100 dark:border-[#2A2A2A]">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Invoice Date</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Total Amount (₹)</th>
                <th className="py-3 px-4 text-right">Paid Amount (₹)</th>
                <th className="py-3 px-4 text-right">Balance Due (₹)</th>
                <th className="py-3 px-4 text-center">Payment Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#2A2A2A]">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50/80 dark:hover:bg-[#252525] transition">
                  <td className="py-3.5 px-4 font-bold text-[#E31B23]">
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-gray-900 dark:text-gray-100">{inv.client.name}</div>
                    <div className="text-[10px] text-gray-400">{inv.client.companyName}</div>
                  </td>
                  <td className="py-3.5 px-4 text-gray-500 dark:text-gray-400">
                    {inv.invoiceDate}
                  </td>
                  <td className="py-3.5 px-4 text-gray-500 dark:text-gray-400">
                    {inv.dueDate}
                  </td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-gray-900 dark:text-gray-100">
                    ₹{inv.totalAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    ₹{inv.paidAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-[#E31B23]">
                    ₹{inv.balanceAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <StatusBadge status={inv.paymentStatus} />
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        onClick={() => handlePreview(inv)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        title="Preview & Print PDF"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleEmail(inv)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#E31B23]"
                        title="Send Email"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </button>

                      {inv.balanceAmount > 0 && (
                        <>
                          <button
                            onClick={() => setPaymentInvoice(inv)}
                            className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                            title="Record Payment"
                          >
                            <IndianRupee className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleCreateBalanceInvoice(inv)}
                            className="p-1.5 rounded-lg text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                            title="Generate Balance Invoice"
                          >
                            <Scale className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => navigate(`/invoices/edit/${inv.id}`)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        title="Edit Invoice"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => promptDeleteInvoice(inv)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600"
                        title="Delete Invoice"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Preview Modal */}
      {selectedDoc && (
        <DocumentPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          document={selectedDoc}
          documentType="Invoice"
        />
      )}

      {/* Send Email Modal */}
      {selectedDoc && (
        <SendEmailModal
          isOpen={isEmailOpen}
          onClose={() => setIsEmailOpen(false)}
          document={selectedDoc}
          documentType="Invoice"
        />
      )}

      {/* Quick Record Payment Modal */}
      {paymentInvoice && (
        <RecordPaymentModal
          isOpen={Boolean(paymentInvoice)}
          onClose={() => setPaymentInvoice(null)}
          preselectedInvoice={paymentInvoice}
        />
      )}

      {/* Custom Delete Confirmation Modal */}
      <DeleteInvoiceModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteTargetInvoice(null);
        }}
        invoice={deleteTargetInvoice}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
};
