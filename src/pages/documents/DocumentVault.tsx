import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Quotation, Invoice, BalanceInvoice } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DocumentPreviewModal } from '../../components/documents/DocumentPreviewModal';
import { SendEmailModal } from '../../components/documents/SendEmailModal';
import { FolderKanban, Search, Eye, Mail, Filter } from 'lucide-react';

export const DocumentVault: React.FC = () => {
  const { quotations, invoices, balanceInvoices } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Quotation' | 'Invoice' | 'Balance Invoice'>('All');
  const [selectedDoc, setSelectedDoc] = useState<Quotation | Invoice | BalanceInvoice | null>(null);
  const [docType, setDocType] = useState<'Quotation' | 'Invoice' | 'Balance Invoice'>('Quotation');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);

  // Unified document items list
  const allDocs = [
    ...quotations.map(q => ({ ...q, _type: 'Quotation' as const, docNum: q.quotationNumber, dateStr: q.quotationDate, amountVal: q.totalAmount })),
    ...invoices.map(i => ({ ...i, _type: 'Invoice' as const, docNum: i.invoiceNumber, dateStr: i.invoiceDate, amountVal: i.totalAmount })),
    ...balanceInvoices.map(b => ({ ...b, _type: 'Balance Invoice' as const, docNum: b.balanceInvoiceNumber, dateStr: b.date, amountVal: b.balanceAmountDue }))
  ];

  const filteredDocs = allDocs.filter(d => {
    if (filterType !== 'All' && d._type !== filterType) return false;
    const query = searchQuery.toLowerCase();
    return (
      d.docNum.toLowerCase().includes(query) ||
      d.client.name.toLowerCase().includes(query) ||
      d.client.companyName.toLowerCase().includes(query)
    );
  });

  const handlePreview = (doc: any) => {
    setSelectedDoc(doc);
    setDocType(doc._type);
    setIsPreviewOpen(true);
  };

  const handleEmail = (doc: any) => {
    setSelectedDoc(doc);
    setDocType(doc._type);
    setIsEmailOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">Document Vault</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Centralized repository for all generated Quotations, Invoices, and Balance Invoices.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-[#1A1A1A] p-4 rounded-2xl border border-gray-200 dark:border-[#2A2A2A] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3 flex-1">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents by number, client name, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-transparent focus:outline-none text-gray-900 dark:text-gray-100"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          {(['All', 'Quotation', 'Invoice', 'Balance Invoice'] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterType === t
                  ? 'bg-[#E31B23] text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-[#252525] text-gray-600 dark:text-gray-400 hover:bg-gray-200'
              }`}
            >
              {t}s
            </button>
          ))}
        </div>
      </div>

      {/* Unified Document Table */}
      <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-[#222] text-gray-400 uppercase text-[10px] font-bold border-b border-gray-100 dark:border-[#2A2A2A]">
              <tr>
                <th className="py-3 px-4">Document Type</th>
                <th className="py-3 px-4">Document #</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#2A2A2A]">
              {filteredDocs.map((doc, idx) => (
                <tr key={`${doc.id}_${idx}`} className="hover:bg-gray-50/80 dark:hover:bg-[#222] transition">
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                      doc._type === 'Quotation' ? 'bg-blue-50 text-blue-700' :
                      doc._type === 'Invoice' ? 'bg-purple-50 text-purple-700' : 'bg-orange-50 text-orange-700'
                    }`}>
                      {doc._type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-gray-100">
                    {doc.docNum}
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-gray-800 dark:text-gray-200">{doc.client.name}</p>
                    <p className="text-[10px] text-gray-400">{doc.client.companyName}</p>
                  </td>
                  <td className="py-3.5 px-4 text-gray-500 font-medium">
                    {doc.dateStr}
                  </td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-gray-900 dark:text-gray-100">
                    ₹{doc.amountVal.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <StatusBadge
                      status={(doc as any).paymentStatus || (doc as any).status || 'Sent'}
                      type={doc._type === 'Quotation' ? 'quotation' : 'payment'}
                    />
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        onClick={() => handlePreview(doc)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-[#E31B23] hover:bg-red-50 dark:hover:bg-red-950/30"
                        title="Preview / Print PDF"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleEmail(doc)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                        title="Send Email"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredDocs.length === 0 && (
          <div className="p-12 text-center space-y-3">
            <FolderKanban className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">No Documents Found</h3>
            <p className="text-xs text-gray-400">Generated billing documents will appear here.</p>
          </div>
        )}
      </div>

      {/* Document Preview Modal */}
      {selectedDoc && (
        <DocumentPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          document={selectedDoc}
          documentType={docType}
        />
      )}

      {/* Send Email Modal */}
      {selectedDoc && (
        <SendEmailModal
          isOpen={isEmailOpen}
          onClose={() => setIsEmailOpen(false)}
          document={selectedDoc}
          documentType={docType}
        />
      )}
    </div>
  );
};
