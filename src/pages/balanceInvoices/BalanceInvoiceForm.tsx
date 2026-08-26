import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { Invoice, ServiceItem } from '../../types';
import { ItemTableBuilder } from '../../components/common/ItemTableBuilder';
import { ArrowLeft, Save, Scale, AlertCircle } from 'lucide-react';

export const BalanceInvoiceForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { invoices, balanceInvoices, settings, addBalanceInvoice, updateBalanceInvoice } = useData();

  const isEditing = Boolean(id);
  const existingBalanceInv = isEditing ? balanceInvoices.find(b => b.id === id) : null;

  const preselectedInvoiceId = searchParams.get('invoiceId') || '';

  // Selectable parent invoices that have an outstanding balance
  const eligibleInvoices = invoices.filter(i => i.balanceAmount > 0 || (existingBalanceInv && i.id === existingBalanceInv.originalInvoiceId));

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(
    existingBalanceInv ? existingBalanceInv.originalInvoiceId : preselectedInvoiceId || (eligibleInvoices[0]?.id || '')
  );

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(
    invoices.find(i => i.id === selectedInvoiceId) || eligibleInvoices[0] || null
  );

  // Editable Service Items State
  // Priority: 1. Existing Balance Invoice items (edit mode), 2. Selected Parent Invoice items (create mode)
  const [items, setItems] = useState<ServiceItem[]>(() => {
    if (isEditing && existingBalanceInv && existingBalanceInv.items && existingBalanceInv.items.length > 0) {
      return existingBalanceInv.items;
    }
    const initInv = invoices.find(i => i.id === selectedInvoiceId) || eligibleInvoices[0];
    return initInv && initInv.items ? initInv.items : [];
  });

  const [date, setDate] = useState<string>(
    existingBalanceInv ? existingBalanceInv.date : new Date().toISOString().split('T')[0]
  );

  const [dueDate, setDueDate] = useState<string>(
    existingBalanceInv ? existingBalanceInv.dueDate : new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );

  const [notes, setNotes] = useState<string>(
    existingBalanceInv ? existingBalanceInv.notes : ''
  );

  const [termsAndConditions, setTermsAndConditions] = useState<string>(
    existingBalanceInv ? existingBalanceInv.termsAndConditions : settings.invoice.defaultTermsAndConditions
  );

  // Auto-calculate balance details and reinitialize items ONLY when selected parent invoice explicitly changes in CREATE mode
  useEffect(() => {
    const inv = invoices.find(i => i.id === selectedInvoiceId);
    if (inv) {
      setSelectedInvoice(inv);
      if (!isEditing) {
        setItems(inv.items || []);
        setNotes(`Balance Invoice for remaining amount on Invoice ${inv.invoiceNumber}. Total: ₹${inv.totalAmount.toLocaleString('en-IN')}, Paid: ₹${inv.paidAmount.toLocaleString('en-IN')}, Net Balance Due: ₹${inv.balanceAmount.toLocaleString('en-IN')}`);
      }
    }
  }, [selectedInvoiceId, isEditing]);

  const sanitizeDescription = (description = '') =>
    description.split('\n').map(point => point.trim()).filter(Boolean).join('\n');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) {
      alert('Please select a valid original invoice.');
      return;
    }

    const netBalanceDue = Math.max(0, selectedInvoice.totalAmount - selectedInvoice.paidAmount);

    const sanitizedItems = items.map(item => ({
      ...item,
      description: sanitizeDescription(item.description)
    }));

    try {
      if (isEditing && id) {
        await updateBalanceInvoice(id, {
          originalInvoiceId: selectedInvoice.id,
          originalInvoiceNumber: selectedInvoice.invoiceNumber,
          date,
          dueDate,
          clientId: selectedInvoice.clientId,
          client: selectedInvoice.client,
          items: sanitizedItems,
          originalInvoiceAmount: selectedInvoice.totalAmount,
          amountAlreadyPaid: selectedInvoice.paidAmount,
          balanceAmountDue: netBalanceDue,
          notes,
          termsAndConditions,
          clientLogoUrl: selectedInvoice.client.logoUrl
        });
      } else {
        await addBalanceInvoice({
          originalInvoiceId: selectedInvoice.id,
          originalInvoiceNumber: selectedInvoice.invoiceNumber,
          date,
          dueDate,
          paymentTerms: selectedInvoice.paymentTerms || settings.invoice.defaultPaymentTerms,
          clientId: selectedInvoice.clientId,
          client: selectedInvoice.client,
          items: sanitizedItems,
          originalInvoiceAmount: selectedInvoice.totalAmount,
          amountAlreadyPaid: selectedInvoice.paidAmount,
          balanceAmountDue: netBalanceDue,
          fromDetails: settings.company,
          notes,
          termsAndConditions,
          companyLogoUrl: settings.company.logoUrl,
          clientLogoUrl: selectedInvoice.client.logoUrl,
          signatureUrl: settings.company.signatureUrl,
          status: 'sent'
        });
      }

      navigate('/balance-invoices');
    } catch (err: any) {
      alert(`Balance invoice save failed: ${err.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/balance-invoices')}
          className="inline-flex items-center space-x-2 text-xs font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Balance Invoices</span>
        </button>

        <h1 className="text-xl font-extrabold text-gray-900 dark:text-gray-100">
          {isEditing ? `Edit Balance Invoice ${existingBalanceInv?.balanceInvoiceNumber}` : 'Create Balance Invoice'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Parent Invoice Selection */}
        <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#2A2A2A] pb-3">
            <div className="flex items-center space-x-2">
              <Scale className="w-5 h-5 text-[#E31B23]" />
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Select Original Invoice</h2>
            </div>
            <span className="text-[10px] bg-orange-100 text-orange-800 font-bold px-2.5 py-1 rounded-full">
              Auto-Calculates Balance Formula
            </span>
          </div>

          {eligibleInvoices.length === 0 && !isEditing ? (
            <div className="p-4 bg-amber-50 text-amber-800 text-xs font-semibold rounded-xl border border-amber-200 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>All existing invoices are either fully paid or none are created yet.</span>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Original Invoice Reference *
              </label>
              <select
                value={selectedInvoiceId}
                onChange={(e) => setSelectedInvoiceId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl focus:ring-1 focus:ring-[#E31B23]"
              >
                {eligibleInvoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} — {inv.client.name} ({inv.client.companyName}) | Total: ₹{inv.totalAmount.toLocaleString('en-IN')}, Paid: ₹{inv.paidAmount.toLocaleString('en-IN')}, Balance: ₹{inv.balanceAmount.toLocaleString('en-IN')}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Formula calculation preview card */}
          {selectedInvoice && (
            <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-stone-900 p-4 rounded-xl border border-red-100 dark:border-red-900/40 text-xs space-y-2">
              <div className="flex justify-between items-center text-gray-700 dark:text-gray-300">
                <span>Original Invoice Total:</span>
                <span className="font-bold">₹{selectedInvoice.totalAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400">
                <span>Amount Already Paid (Advance / Partials):</span>
                <span className="font-bold">- ₹{selectedInvoice.paidAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center font-extrabold text-sm border-t border-red-200 pt-2 text-[#E31B23]">
                <span>Calculated Balance Amount Due:</span>
                <span className="text-base">₹{Math.max(0, selectedInvoice.totalAmount - selectedInvoice.paidAmount).toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-6 shadow-xs grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Balance Invoice Date *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl focus:ring-1 focus:ring-[#E31B23]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Balance Payment Due Date *
            </label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl focus:ring-1 focus:ring-[#E31B23]"
            />
          </div>
        </div>

        {/* Repeatable Service Items with Multi-Point Description Support */}
        <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-6 shadow-xs">
          <ItemTableBuilder items={items} onChange={setItems} enableDescriptionPoints={true} />
        </div>

        {/* Notes & Terms */}
        <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-6 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Balance Invoice Notes
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
            onClick={() => navigate('/balance-invoices')}
            className="px-5 py-2.5 bg-gray-100 dark:bg-[#252525] text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#E31B23] hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-2 transition"
          >
            <Save className="w-4 h-4" />
            <span>{isEditing ? 'Save Balance Invoice Changes' : 'Generate Balance Invoice'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

