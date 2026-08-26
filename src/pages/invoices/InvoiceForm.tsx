import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { ServiceItem, Client } from '../../types';
import { ItemTableBuilder } from '../../components/common/ItemTableBuilder';
import { ArrowLeft, Save, CreditCard, UserCheck } from 'lucide-react';

export const InvoiceForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clients, invoices, settings, addInvoice, updateInvoice } = useData();

  const isEditing = Boolean(id);
  const existingInvoice = isEditing ? invoices.find(i => i.id === id) : null;

  const preselectedClientId = searchParams.get('clientId') || '';

  const [selectedClientId, setSelectedClientId] = useState<string>(
    existingInvoice ? existingInvoice.clientId : preselectedClientId || (clients[0]?.id || '')
  );

  const [selectedClient, setSelectedClient] = useState<Client | null>(
    clients.find(c => c.id === selectedClientId) || clients[0] || null
  );

  const [invoiceDate, setInvoiceDate] = useState<string>(
    existingInvoice ? existingInvoice.invoiceDate : new Date().toISOString().split('T')[0]
  );

  const [dueDate, setDueDate] = useState<string>(
    existingInvoice ? existingInvoice.dueDate : new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
  );

  const [paymentTerms, setPaymentTerms] = useState<string>(
    existingInvoice ? existingInvoice.paymentTerms : settings.invoice.defaultPaymentTerms
  );

  const [notes, setNotes] = useState<string>(
    existingInvoice ? existingInvoice.notes : settings.invoice.defaultNotes
  );

  const [termsAndConditions, setTermsAndConditions] = useState<string>(
    existingInvoice ? existingInvoice.termsAndConditions : settings.invoice.defaultTermsAndConditions
  );

  const [items, setItems] = useState<ServiceItem[]>(
    existingInvoice && existingInvoice.items.length > 0
      ? existingInvoice.items
      : [
          { id: 'itm_1', serviceName: 'Enterprise Software License & Setup', description: 'Deployment & configuration', amount: 45000 }
        ]
  );

  useEffect(() => {
    const found = clients.find(c => c.id === selectedClientId);
    if (found) setSelectedClient(found);
  }, [selectedClientId, clients]);

  const sanitizeDescription = (description = '') =>
    description.split('\n').map(point => point.trim()).filter(Boolean).join('\n');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) {
      alert('Please select a valid client profile.');
      return;
    }

    const sanitizedItems = items.map(item => ({
      ...item,
      description: sanitizeDescription(item.description)
    }));

    try {
      if (isEditing && id) {
        await updateInvoice(id, {
          clientId: selectedClient.id,
          client: selectedClient,
          invoiceDate,
          dueDate,
          paymentTerms,
          notes,
          termsAndConditions,
          items: sanitizedItems,
          clientLogoUrl: selectedClient.logoUrl
        });
      } else {
        await addInvoice({
          invoiceDate,
          dueDate,
          paymentTerms,
          clientId: selectedClient.id,
          client: selectedClient,
          items: sanitizedItems,
          fromDetails: settings.company,
          notes,
          termsAndConditions,
          companyLogoUrl: settings.company.logoUrl,
          clientLogoUrl: selectedClient.logoUrl,
          signatureUrl: settings.company.signatureUrl,
          status: 'sent'
        });
      }

      navigate('/invoices');
    } catch (err: any) {
      alert(`Invoice save failed: ${err.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/invoices')}
          className="inline-flex items-center space-x-2 text-xs font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Invoices</span>
        </button>

        <h1 className="text-xl font-extrabold text-gray-900 dark:text-gray-100">
          {isEditing ? `Edit Invoice ${existingInvoice?.invoiceNumber}` : 'Create New Billing Invoice'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client Selection Card */}
        <div className="neu-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200/80 dark:border-[#2C2C34] pb-3">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-[#E31B23]" />
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Invoice Recipient</h2>
            </div>
            <span className="text-[10px] bg-red-50 dark:bg-red-950/40 text-[#E31B23] px-2.5 py-1 rounded-full font-bold border border-red-200/50 dark:border-red-900/50">
              Auto-Populates Client Info & Logos
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
                className="neu-select w-full px-3 py-2 text-xs font-semibold"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.companyName} ({c.email})
                  </option>
                ))}
              </select>
            </div>

            {selectedClient && (
              <div className="neu-panel p-3.5 text-xs space-y-1">
                <p className="font-bold text-gray-900 dark:text-gray-100">{selectedClient.name} ({selectedClient.companyName})</p>
                <p className="text-gray-500 text-[11px]">{selectedClient.address}, {selectedClient.city}, {selectedClient.state} - {selectedClient.pincode}</p>
                <p className="text-gray-500 text-[11px]">Phone: {selectedClient.mobile} | Email: {selectedClient.email}</p>
              </div>
            )}
          </div>
        </div>

        {/* Dates & Terms Card */}
        <div className="neu-card p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Invoice Date *
            </label>
            <input
              type="date"
              required
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="neu-input w-full px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Due Date *
            </label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="neu-input w-full px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Payment Terms
            </label>
            <input
              type="text"
              placeholder="e.g. 50% Advance received"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              className="neu-input w-full px-3 py-2 text-xs"
            />
          </div>
        </div>

        {/* Repeatable Service Items */}
        <ItemTableBuilder items={items} onChange={setItems} enableDescriptionPoints={true} />

        {/* Notes & Terms */}
        <div className="neu-card p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Payment Notes & Bank Details
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="neu-textarea w-full px-3 py-2 text-xs"
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
              className="neu-textarea w-full px-3 py-2 text-xs"
            />
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex justify-end space-x-4 pt-2">
          <button
            type="button"
            onClick={() => navigate('/invoices')}
            className="neu-btn-secondary px-5 py-2.5 text-xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="neu-btn-primary px-6 py-2.5 text-xs flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{isEditing ? 'Save Invoice Changes' : 'Generate & Save Invoice'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
