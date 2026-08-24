import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Settings as SettingsIcon, Building2, FileText, CreditCard, Scale, Moon, Sun, Save, CheckCircle2, Trash2 } from 'lucide-react';
import { uploadDocumentFile } from '../lib/supabase';

export const Settings: React.FC = () => {
  const { settings, updateSettings, resetAllData } = useData();

  const [activeTab, setActiveTab] = useState<'company' | 'quotation' | 'invoice' | 'balance' | 'appearance'>('company');
  const [successToast, setSuccessToast] = useState(false);

  const [companyForm, setCompanyForm] = useState(settings.company);
  const [quotationForm, setQuotationForm] = useState(settings.quotation);
  const [invoiceForm, setInvoiceForm] = useState(settings.invoice);
  const [balanceForm, setBalanceForm] = useState(settings.balanceInvoice);

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({ company: companyForm });
    showSuccess();
  };

  const handleSaveQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({ quotation: quotationForm });
    showSuccess();
  };

  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({ invoice: invoiceForm });
    showSuccess();
  };

  const handleSaveBalance = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({ balanceInvoice: balanceForm });
    showSuccess();
  };

  const showSuccess = () => {
    setSuccessToast(true);
    setTimeout(() => setSuccessToast(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">System Settings</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Configure company profile, numbering sequence prefixes, default terms, and system preferences.
        </p>
      </div>

      {successToast && (
        <div className="p-3 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5" />
          <span>Settings updated successfully!</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-[#2A2A2A] space-x-6 overflow-x-auto">
        {[
          { id: 'company', label: 'Company Profile', icon: Building2 },
          { id: 'quotation', label: 'Quotation Defaults', icon: FileText },
          { id: 'invoice', label: 'Invoice Defaults', icon: CreditCard },
          { id: 'balance', label: 'Balance Invoice Defaults', icon: Scale },
          { id: 'appearance', label: 'Appearance Theme', icon: settings.theme === 'light' ? Moon : Sun },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 text-xs font-bold transition flex items-center space-x-2 border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-[#E31B23] text-[#E31B23] dark:text-red-400'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Company Profile */}
      {activeTab === 'company' && (
        <form onSubmit={handleSaveCompany} className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-6 shadow-xs space-y-4 text-xs">
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Company Profile Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">Company Name *</label>
              <input
                type="text"
                required
                value={companyForm.companyName}
                onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl focus:ring-1 focus:ring-[#E31B23]"
              />
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">Company Email *</label>
              <input
                type="email"
                required
                value={companyForm.email}
                onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl focus:ring-1 focus:ring-[#E31B23]"
              />
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">Company Phone *</label>
              <input
                type="text"
                required
                value={companyForm.phone}
                onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl focus:ring-1 focus:ring-[#E31B23]"
              />
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">Street Address *</label>
              <input
                type="text"
                required
                value={companyForm.address}
                onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl focus:ring-1 focus:ring-[#E31B23]"
              />
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">City *</label>
              <input
                type="text"
                required
                value={companyForm.city}
                onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl focus:ring-1 focus:ring-[#E31B23]"
              />
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">State & Pincode *</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={companyForm.state}
                  onChange={(e) => setCompanyForm({ ...companyForm, state: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl"
                />
                <input
                  type="text"
                  required
                  value={companyForm.pincode}
                  onChange={(e) => setCompanyForm({ ...companyForm, pincode: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">Company Logo</label>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    try {
                      const uploaded = await uploadDocumentFile(`company/logo/${Date.now()}_${file.name}`, file, file.type);
                      setCompanyForm(prev => ({ ...prev, logoUrl: uploaded.url }));
                    } catch (err: any) {
                      alert('Logo upload failed: ' + err.message);
                    }
                  }
                }}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl"
              />
              <input
                type="url"
                placeholder="Or paste Logo URL"
                value={companyForm.logoUrl || ''}
                onChange={(e) => setCompanyForm({ ...companyForm, logoUrl: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl focus:ring-1 focus:ring-[#E31B23]"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">Authorized Signature</label>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    try {
                      const uploaded = await uploadDocumentFile(`company/signature/${Date.now()}_${file.name}`, file, file.type);
                      setCompanyForm(prev => ({ ...prev, signatureUrl: uploaded.url }));
                    } catch (err: any) {
                      alert('Signature upload failed: ' + err.message);
                    }
                  }
                }}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl"
              />
              <input
                type="url"
                placeholder="Or paste Signature URL"
                value={companyForm.signatureUrl || ''}
                onChange={(e) => setCompanyForm({ ...companyForm, signatureUrl: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl focus:ring-1 focus:ring-[#E31B23]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#E31B23] hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-2 transition"
            >
              <Save className="w-4 h-4" />
              <span>Save Company Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Quotations Settings */}
      {activeTab === 'quotation' && (
        <form onSubmit={handleSaveQuotation} className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-6 shadow-xs space-y-4 text-xs">
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Quotation Numbering & Defaults</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">Quotation Number Prefix</label>
              <input
                type="text"
                value={quotationForm.prefix}
                onChange={(e) => setQuotationForm({ ...quotationForm, prefix: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl"
              />
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">Next Sequence Number</label>
              <input
                type="number"
                value={quotationForm.nextNumber}
                onChange={(e) => setQuotationForm({ ...quotationForm, nextNumber: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">Default Validity (Days)</label>
            <input
              type="number"
              value={quotationForm.defaultValidityDays}
              onChange={(e) => setQuotationForm({ ...quotationForm, defaultValidityDays: Number(e.target.value) })}
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl"
            />
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">Default Notes</label>
            <textarea
              rows={3}
              value={quotationForm.defaultNotes}
              onChange={(e) => setQuotationForm({ ...quotationForm, defaultNotes: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl"
            />
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">Default Terms and Conditions</label>
            <textarea
              rows={4}
              value={quotationForm.defaultTermsAndConditions}
              onChange={(e) => setQuotationForm({ ...quotationForm, defaultTermsAndConditions: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl"
            />
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#E31B23] hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-2 transition"
            >
              <Save className="w-4 h-4" />
              <span>Save Quotation Defaults</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Invoice Settings */}
      {activeTab === 'invoice' && (
        <form onSubmit={handleSaveInvoice} className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-6 shadow-xs space-y-4 text-xs">
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Invoice Numbering & Defaults</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">Invoice Number Prefix</label>
              <input
                type="text"
                value={invoiceForm.prefix}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, prefix: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl"
              />
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">Next Sequence Number</label>
              <input
                type="number"
                value={invoiceForm.nextNumber}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, nextNumber: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">Default Invoice Notes & Bank Info</label>
            <textarea
              rows={3}
              value={invoiceForm.defaultNotes}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, defaultNotes: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl"
            />
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">Default Terms and Conditions</label>
            <textarea
              rows={4}
              value={invoiceForm.defaultTermsAndConditions}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, defaultTermsAndConditions: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl"
            />
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#E31B23] hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-2 transition"
            >
              <Save className="w-4 h-4" />
              <span>Save Invoice Defaults</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 4: Balance Invoice Settings */}
      {activeTab === 'balance' && (
        <form onSubmit={handleSaveBalance} className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-6 shadow-xs space-y-4 text-xs">
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Balance Invoice Configuration</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">Balance Invoice Prefix</label>
              <input
                type="text"
                value={balanceForm.prefix}
                onChange={(e) => setBalanceForm({ ...balanceForm, prefix: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl"
              />
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">Next Sequence Number</label>
              <input
                type="number"
                value={balanceForm.nextNumber}
                onChange={(e) => setBalanceForm({ ...balanceForm, nextNumber: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#E31B23] hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-2 transition"
            >
              <Save className="w-4 h-4" />
              <span>Save Balance Invoice Config</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 5: Appearance */}
      {activeTab === 'appearance' && (
        <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-6 shadow-xs space-y-4 text-xs">
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Appearance Theme</h2>
          <p className="text-gray-500">Choose your preferred visual theme interface mode.</p>

          <div className="grid grid-cols-2 gap-4 max-w-md pt-2">
            <button
              type="button"
              onClick={() => updateSettings({ theme: 'light' })}
              className={`p-4 rounded-2xl border flex flex-col items-center justify-center space-y-2 transition ${
                settings.theme === 'light'
                  ? 'border-[#E31B23] bg-red-50/50 text-[#E31B23] font-bold shadow-md'
                  : 'border-gray-200 bg-gray-50 text-gray-700'
              }`}
            >
              <Sun className="w-6 h-6 text-amber-500" />
              <span>Light Mode (Default White)</span>
            </button>

            <button
              type="button"
              onClick={() => updateSettings({ theme: 'dark' })}
              className={`p-4 rounded-2xl border flex flex-col items-center justify-center space-y-2 transition ${
                settings.theme === 'dark'
                  ? 'border-[#E31B23] bg-stone-900 text-red-400 font-bold shadow-md'
                  : 'border-gray-700 bg-[#222] text-gray-300'
              }`}
            >
              <Moon className="w-6 h-6 text-indigo-400" />
              <span>Dark Mode (Obsidian)</span>
            </button>
          </div>
        </div>
      )}

      {/* Clear / Reset All Stored Data Section */}
      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <Trash2 className="w-4 h-4 text-[#E31B23]" />
            <span>Database Reset & Clear All Data</span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Wipe all clients, quotations, invoices, payments, and file logs to start completely fresh.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (confirm("Are you sure you want to delete ALL clients, quotations, invoices, payments, and activity logs? This action cannot be undone.")) {
              resetAllData();
              alert("All data cleared successfully!");
              window.location.reload();
            }
          }}
          className="px-4 py-2 bg-[#E31B23] hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-2 whitespace-nowrap"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear All Stored Data</span>
        </button>
      </div>
    </div>
  );
};
