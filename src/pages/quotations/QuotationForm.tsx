import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { ServiceItem, Client } from '../../types';
import { ItemTableBuilder } from '../../components/common/ItemTableBuilder';
import { ArrowLeft, Save, FileText, CheckCircle2, UserCheck } from 'lucide-react';

export const QuotationForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clients, quotations, settings, addQuotation, updateQuotation } = useData();

  const isEditing = Boolean(id);
  const existingQuotation = isEditing ? quotations.find(q => q.id === id) : null;

  const preselectedClientId = searchParams.get('clientId') || '';

  const [selectedClientId, setSelectedClientId] = useState<string>(
    existingQuotation ? existingQuotation.clientId : preselectedClientId || (clients[0]?.id || '')
  );

  const [selectedClient, setSelectedClient] = useState<Client | null>(
    clients.find(c => c.id === selectedClientId) || clients[0] || null
  );

  const [quotationDate, setQuotationDate] = useState<string>(
    existingQuotation ? existingQuotation.quotationDate : new Date().toISOString().split('T')[0]
  );

  const [validUntil, setValidUntil] = useState<string>(
    existingQuotation ? existingQuotation.validUntil : new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
  );

  const [paymentTerms, setPaymentTerms] = useState<string>(
    existingQuotation ? existingQuotation.paymentTerms : settings.quotation.defaultPaymentTerms
  );

  const [notes, setNotes] = useState<string>(
    existingQuotation ? existingQuotation.notes : settings.quotation.defaultNotes
  );

  const [termsAndConditions, setTermsAndConditions] = useState<string>(
    existingQuotation ? existingQuotation.termsAndConditions : settings.quotation.defaultTermsAndConditions
  );

  const [items, setItems] = useState<ServiceItem[]>(
    existingQuotation && existingQuotation.items.length > 0
      ? existingQuotation.items
      : [
          { id: 'itm_1', serviceName: 'Commercial Web Application Development', description: 'Design & implementation of billing system', amount: 35000 }
        ]
  );

  // Auto-populate saved client details when client selection changes
  useEffect(() => {
    const found = clients.find(c => c.id === selectedClientId);
    if (found) {
      setSelectedClient(found);
    }
  }, [selectedClientId, clients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) {
      alert('Please select a valid client profile.');
      return;
    }

    try {
      if (isEditing && id) {
        await updateQuotation(id, {
          clientId: selectedClient.id,
          client: selectedClient,
          quotationDate,
          validUntil,
          paymentTerms,
          notes,
          termsAndConditions,
          items,
          clientLogoUrl: selectedClient.logoUrl
        });
      } else {
        await addQuotation({
          quotationDate,
          validUntil,
          paymentTerms,
          clientId: selectedClient.id,
          client: selectedClient,
          items,
          fromDetails: settings.company,
          notes,
          termsAndConditions,
          companyLogoUrl: settings.company.logoUrl,
          clientLogoUrl: selectedClient.logoUrl,
          signatureUrl: settings.company.signatureUrl,
          status: 'sent'
        });
      }

      navigate('/quotations');
    } catch (err: any) {
      alert(`Quotation save failed: ${err.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/quotations')}
          className="inline-flex items-center space-x-2 text-xs font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Quotations</span>
        </button>

        <h1 className="text-xl font-extrabold text-gray-900 dark:text-gray-100">
          {isEditing ? `Edit Quotation ${existingQuotation?.quotationNumber}` : 'Create New Quotation'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client Selection Card with Auto-Population Notice */}
        <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#2A2A2A] pb-3">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-[#E31B23]" />
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Client Information</h2>
            </div>
            <span className="text-[10px] bg-red-50 text-[#E31B23] px-2.5 py-1 rounded-full font-bold">
              Auto-Populates Client Dues & Address
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Select Client *
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl focus:ring-1 focus:ring-[#E31B23] focus:border-[#E31B23]"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.companyName} ({c.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Readonly Auto-populated summary card */}
            {selectedClient && (
              <div className="bg-gray-50 dark:bg-[#222] p-3 rounded-xl border border-gray-100 dark:border-[#333] text-xs space-y-1">
                <p className="font-bold text-gray-900 dark:text-gray-100">{selectedClient.name} ({selectedClient.companyName})</p>
                <p className="text-gray-500 text-[11px]">{selectedClient.address}, {selectedClient.city}, {selectedClient.state} - {selectedClient.pincode}</p>
                <p className="text-gray-500 text-[11px]">Phone: {selectedClient.mobile} | Email: {selectedClient.email}</p>
              </div>
            )}
          </div>
        </div>

        {/* Dates & Terms Card */}
        <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-6 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Quotation Date *
            </label>
            <input
              type="date"
              required
              value={quotationDate}
              onChange={(e) => setQuotationDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl focus:ring-1 focus:ring-[#E31B23]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Valid Until *
            </label>
            <input
              type="date"
              required
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl focus:ring-1 focus:ring-[#E31B23]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Payment Terms
            </label>
            <input
              type="text"
              placeholder="e.g. 50% Advance on order"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl focus:ring-1 focus:ring-[#E31B23]"
            />
          </div>
        </div>

        {/* Repeatable Service Items Table */}
        <ItemTableBuilder items={items} onChange={setItems} />

        {/* Notes & Terms & Conditions */}
        <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-6 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Notes / Remarks
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl focus:ring-1 focus:ring-[#E31B23]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Terms and Conditions
            </label>
            <textarea
              rows={4}
              value={termsAndConditions}
              onChange={(e) => setTermsAndConditions(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl focus:ring-1 focus:ring-[#E31B23]"
            />
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex justify-end space-x-4 pt-2">
          <button
            type="button"
            onClick={() => navigate('/quotations')}
            className="px-5 py-2.5 bg-gray-100 dark:bg-[#252525] text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#E31B23] hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-2 transition"
          >
            <Save className="w-4 h-4" />
            <span>{isEditing ? 'Save Quotation Changes' : 'Generate & Save Quotation'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
