import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Quotation } from '../../types';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DocumentPreviewModal } from '../../components/documents/DocumentPreviewModal';
import { SendEmailModal } from '../../components/documents/SendEmailModal';
import {
  FileText, Plus, Search, Eye, Edit, Trash2, Mail, ArrowRightLeft, Copy, CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const QuotationList: React.FC = () => {
  const { quotations, deleteQuotation, convertQuotationToInvoice, addQuotation } = useData();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<Quotation | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const filteredQuotations = quotations.filter(q => {
    const query = searchQuery.toLowerCase();
    return (
      q.quotationNumber.toLowerCase().includes(query) ||
      q.client.name.toLowerCase().includes(query) ||
      q.client.companyName.toLowerCase().includes(query)
    );
  });

  const handlePreview = (q: Quotation) => {
    setSelectedDoc(q);
    setIsPreviewOpen(true);
  };

  const handleEmail = (q: Quotation) => {
    setSelectedDoc(q);
    setIsEmailOpen(true);
  };

  const handleConvertToInvoice = async (q: Quotation) => {
    if (confirm(`Convert Quotation ${q.quotationNumber} into a formal Invoice?`)) {
      const createdInvoice = await convertQuotationToInvoice(q.id);
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      setSuccessToast(`Quotation ${q.quotationNumber} successfully converted to Invoice ${createdInvoice.invoiceNumber}!`);
      setTimeout(() => setSuccessToast(null), 4000);
    }
  };

  const handleDuplicate = async (q: Quotation) => {
    const dup = await addQuotation({
      quotationDate: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      paymentTerms: q.paymentTerms,
      clientId: q.clientId,
      client: q.client,
      items: q.items,
      fromDetails: q.fromDetails,
      notes: q.notes,
      termsAndConditions: q.termsAndConditions,
      companyLogoUrl: q.companyLogoUrl,
      clientLogoUrl: q.clientLogoUrl,
      signatureUrl: q.signatureUrl,
      status: 'draft'
    });
    setSuccessToast(`Duplicated into new Quotation ${dup.quotationNumber}!`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleDelete = (id: string, num: string) => {
    if (confirm(`Are you sure you want to delete quotation ${num}?`)) {
      deleteQuotation(id);
    }
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
          <button onClick={() => navigate('/invoices')} className="underline text-emerald-100 hover:text-white">
            View Invoices →
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">Quotations</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Create, send, and convert formal client estimates into invoices with 1-click execution.
          </p>
        </div>

        <button
          onClick={() => navigate('/quotations/create')}
          className="px-4 py-2.5 bg-[#E31B23] hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Quotation</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-[#1A1A1A] p-4 rounded-2xl border border-gray-200 dark:border-[#2A2A2A] shadow-xs flex items-center space-x-3">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by quotation number, client name, or company..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs bg-transparent focus:outline-none text-gray-900 dark:text-gray-100"
        />
      </div>

      {/* Quotations Table */}
      <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-[#222] text-gray-400 uppercase text-[10px] font-bold border-b border-gray-100 dark:border-[#2A2A2A]">
              <tr>
                <th className="py-3 px-4">Quotation #</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Date / Valid Until</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#2A2A2A]">
              {filteredQuotations.map((q) => (
                <tr key={q.id} className="hover:bg-gray-50/80 dark:hover:bg-[#222] transition">
                  <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-gray-100">
                    {q.quotationNumber}
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-gray-800 dark:text-gray-200">{q.client.name}</p>
                    <p className="text-[10px] text-gray-400">{q.client.companyName}</p>
                  </td>
                  <td className="py-3.5 px-4 text-gray-500">
                    <p className="font-medium text-gray-800 dark:text-gray-200">{q.quotationDate}</p>
                    <p className="text-[10px] text-gray-400">Valid: {q.validUntil}</p>
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-gray-900 dark:text-gray-100">
                    ₹{q.totalAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <StatusBadge status={q.status} type="quotation" />
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        onClick={() => handlePreview(q)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-[#E31B23] hover:bg-red-50 dark:hover:bg-red-950/30"
                        title="Preview / Print PDF"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleEmail(q)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                        title="Send Email"
                      >
                        <Mail className="w-4 h-4" />
                      </button>

                      {q.status !== 'converted' && (
                        <button
                          onClick={() => handleConvertToInvoice(q)}
                          className="p-1.5 rounded-lg text-[#E31B23] bg-red-50 hover:bg-red-100 dark:bg-red-950/40 font-bold flex items-center space-x-1"
                          title="Convert to Invoice"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span className="text-[10px] hidden lg:inline">Convert</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDuplicate(q)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        title="Duplicate Quotation"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => navigate(`/quotations/edit/${q.id}`)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        title="Edit Quotation"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(q.id, q.quotationNumber)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600"
                        title="Delete Quotation"
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

        {filteredQuotations.length === 0 && (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">No Quotations Found</h3>
            <p className="text-xs text-gray-400">Click "Create New Quotation" to generate a formal quote.</p>
          </div>
        )}
      </div>

      {/* Document Preview Modal */}
      {selectedDoc && (
        <DocumentPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          document={selectedDoc}
          documentType="Quotation"
        />
      )}

      {/* Send Email Modal */}
      {selectedDoc && (
        <SendEmailModal
          isOpen={isEmailOpen}
          onClose={() => setIsEmailOpen(false)}
          document={selectedDoc}
          documentType="Quotation"
        />
      )}
    </div>
  );
};
