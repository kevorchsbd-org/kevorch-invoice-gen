import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { BalanceInvoice } from '../../types';
import { useNavigate } from 'react-router-dom';
import { DocumentPreviewModal } from '../../components/documents/DocumentPreviewModal';
import { SendEmailModal } from '../../components/documents/SendEmailModal';
import {
  Scale, Plus, Search, Eye, Edit, Trash2, Mail
} from 'lucide-react';

export const BalanceInvoiceList: React.FC = () => {
  const { balanceInvoices, deleteBalanceInvoice } = useData();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<BalanceInvoice | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);

  const filtered = balanceInvoices.filter(b => {
    const query = searchQuery.toLowerCase();
    return (
      b.balanceInvoiceNumber.toLowerCase().includes(query) ||
      b.originalInvoiceNumber.toLowerCase().includes(query) ||
      b.client.name.toLowerCase().includes(query) ||
      b.client.companyName.toLowerCase().includes(query)
    );
  });

  const handlePreview = (b: BalanceInvoice) => {
    setSelectedDoc(b);
    setIsPreviewOpen(true);
  };

  const handleEmail = (b: BalanceInvoice) => {
    setSelectedDoc(b);
    setIsEmailOpen(true);
  };

  const handleDelete = (id: string, num: string) => {
    if (confirm(`Are you sure you want to delete balance invoice ${num}?`)) {
      deleteBalanceInvoice(id);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">Balance Invoices</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Bill remaining project amounts after advance payments.
          </p>
        </div>

        <button
          onClick={() => navigate('/balance-invoices/create')}
          className="px-4 py-2.5 bg-[#E31B23] hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Balance Invoice</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-[#1A1A1A] p-4 rounded-2xl border border-gray-200 dark:border-[#2A2A2A] shadow-xs flex items-center space-x-3">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by balance invoice number, original invoice #, or client..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs bg-transparent focus:outline-none text-gray-900 dark:text-gray-100"
        />
      </div>

      {/* Balance Invoices Table */}
      <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-[#222] text-gray-400 uppercase text-[10px] font-bold border-b border-gray-100 dark:border-[#2A2A2A]">
              <tr>
                <th className="py-3 px-4">Balance Inv #</th>
                <th className="py-3 px-4">Original Inv #</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Date / Due</th>
                <th className="py-3 px-4 text-right">Original Amount</th>
                <th className="py-3 px-4 text-right">Paid Amount</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#2A2A2A]">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50/80 dark:hover:bg-[#222] transition">
                  <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-gray-100">
                    {b.balanceInvoiceNumber}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-gray-700 dark:text-gray-300">
                    {b.originalInvoiceNumber}
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-gray-800 dark:text-gray-200">{b.client.name}</p>
                    <p className="text-[10px] text-gray-400">{b.client.companyName}</p>
                  </td>
                  <td className="py-3.5 px-4 text-gray-500">
                    <p className="font-medium text-gray-800 dark:text-gray-200">{b.date}</p>
                    <p className="text-[10px] text-gray-400">Due: {b.dueDate}</p>
                  </td>
                  <td className="py-3.5 px-4 text-right font-semibold text-gray-700 dark:text-gray-300">
                    ₹{b.originalInvoiceAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                    ₹{b.amountAlreadyPaid.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-[#E31B23]">
                    ₹{b.balanceAmountDue.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        onClick={() => handlePreview(b)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-[#E31B23] hover:bg-red-50 dark:hover:bg-red-950/30"
                        title="Preview / Print PDF"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleEmail(b)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                        title="Send Email"
                      >
                        <Mail className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => navigate(`/balance-invoices/edit/${b.id}`)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        title="Edit Balance Invoice"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(b.id, b.balanceInvoiceNumber)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600"
                        title="Delete Balance Invoice"
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

        {filtered.length === 0 && (
          <div className="p-12 text-center space-y-3">
            <Scale className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">No Balance Invoices Found</h3>
            <p className="text-xs text-gray-400">Click "Create Balance Invoice" to generate a balance statement.</p>
          </div>
        )}
      </div>

      {/* Document Preview Modal */}
      {selectedDoc && (
        <DocumentPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          document={selectedDoc}
          documentType="Balance Invoice"
        />
      )}

      {/* Send Email Modal */}
      {selectedDoc && (
        <SendEmailModal
          isOpen={isEmailOpen}
          onClose={() => setIsEmailOpen(false)}
          document={selectedDoc}
          documentType="Balance Invoice"
        />
      )}
    </div>
  );
};
