import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import {
  Building2, FileText, CreditCard, Scale, Moon, Sun, Save, CheckCircle2,
  Trash2, Database, RefreshCw, AlertTriangle, ShieldCheck, Layers,
  Activity, HardDrive, Info, Zap, Folder, HardDriveDownload
} from 'lucide-react';
import {
  saveCompanyAsset,
  getCompanyAsset,
  getLocalStorageStats,
  clearAllLocalAssets,
  revokeObjectUrl,
  LocalStorageStats
} from '../lib/indexedDb';

export const Settings: React.FC = () => {
  const {
    settings, updateSettings, resetAllData,
    clients, quotations, invoices, balanceInvoices, payments, files,
    activityLogs, emailLogs, usageMetrics, refreshMetrics
  } = useData();

  const [activeTab, setActiveTab] = useState<'company' | 'quotation' | 'invoice' | 'balance' | 'appearance' | 'firebase_usage'>('company');
  const [successToast, setSuccessToast] = useState(false);
  const [resetModalType, setResetModalType] = useState<'assets' | 'all' | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const [companyForm, setCompanyForm] = useState(settings.company);
  const [quotationForm, setQuotationForm] = useState(settings.quotation);
  const [invoiceForm, setInvoiceForm] = useState(settings.invoice);
  const [balanceForm, setBalanceForm] = useState(settings.balanceInvoice);

  const [localStats, setLocalStats] = useState<LocalStorageStats>({
    companyAssetsCount: 0,
    clientAssetsCount: 0,
    quotationFilesCount: 0,
    invoiceFilesCount: 0,
    balanceInvoiceFilesCount: 0,
    otherFilesCount: 0,
    totalSizeBytes: 0,
  });

  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>('');
  const [signaturePreviewUrl, setSignaturePreviewUrl] = useState<string>('');

  // Load IndexedDB local assets & statistics on mount
  useEffect(() => {
    let currentLogoUrl = '';
    let currentSigUrl = '';

    const loadLocalAssets = async () => {
      try {
        const stats = await getLocalStorageStats();
        setLocalStats(stats);

        const logoAsset = await getCompanyAsset('company_logo');
        if (logoAsset?.url) {
          currentLogoUrl = logoAsset.url;
          setLogoPreviewUrl(logoAsset.url);
          setCompanyForm(prev => ({ ...prev, logoUrl: logoAsset.url }));
        }

        const sigAsset = await getCompanyAsset('company_signature');
        if (sigAsset?.url) {
          currentSigUrl = sigAsset.url;
          setSignaturePreviewUrl(sigAsset.url);
          setCompanyForm(prev => ({ ...prev, signatureUrl: sigAsset.url }));
        }
      } catch (err) {
        console.warn('Local IndexedDB load notice:', err);
      }
    };

    loadLocalAssets();

    return () => {
      if (currentLogoUrl) revokeObjectUrl(currentLogoUrl);
      if (currentSigUrl) revokeObjectUrl(currentSigUrl);
    };
  }, []);

  const refreshLocalStats = async () => {
    try {
      const stats = await getLocalStorageStats();
      setLocalStats(stats);
      refreshMetrics();
    } catch (err) {
      console.warn('Failed to refresh local stats:', err);
    }
  };

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

  // Document Collection Counts
  const documentCounts = {
    clients: clients.length,
    quotations: quotations.length,
    invoices: invoices.length,
    balanceInvoices: balanceInvoices.length,
    payments: payments.length,
    files: files.length,
    activityLogs: activityLogs.length,
    emailLogs: emailLogs.length,
    settings: 1
  };

  const totalDocCount = Object.values(documentCounts).reduce((a, b) => a + b, 0);

  // Estimate JSON Data Size + 100B per doc header overhead
  const estimatedJsonBytes =
    JSON.stringify(clients).length +
    JSON.stringify(quotations).length +
    JSON.stringify(invoices).length +
    JSON.stringify(balanceInvoices).length +
    JSON.stringify(payments).length +
    JSON.stringify(files).length +
    JSON.stringify(activityLogs).length +
    JSON.stringify(emailLogs).length +
    JSON.stringify(settings).length +
    (totalDocCount * 100);

  const estimatedMb = estimatedJsonBytes / (1024 * 1024);
  const firestoreLimitMb = 1024; // 1 GB Spark Plan free limit
  const usagePercentage = Math.min(100, (estimatedMb / firestoreLimitMb) * 100);

  // Threshold rules: 0-50% Safe, 50-75% Monitor, 75-90% High, 90%+ Critical
  let planStatus: { label: 'Safe' | 'Monitor' | 'High' | 'Critical'; bg: string; border: string; text: string; description: string } = {
    label: 'Safe',
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    border: 'border-emerald-200 dark:border-emerald-900/40',
    text: 'text-emerald-700 dark:text-emerald-400',
    description: 'Your estimated Firestore usage is within the free-plan range (Spark Plan).'
  };

  if (usagePercentage >= 90) {
    planStatus = {
      label: 'Critical',
      bg: 'bg-red-50 dark:bg-red-950/30',
      border: 'border-red-300 dark:border-red-800',
      text: 'text-red-700 dark:text-red-400',
      description: 'Critical: Estimated usage is near the 1 GB free-plan quota limit.'
    };
  } else if (usagePercentage >= 75) {
    planStatus = {
      label: 'High',
      bg: 'bg-orange-50 dark:bg-orange-950/30',
      border: 'border-orange-300 dark:border-orange-800',
      text: 'text-orange-700 dark:text-orange-400',
      description: 'Warning: Estimated usage is approaching the configured free-plan threshold.'
    };
  } else if (usagePercentage >= 50) {
    planStatus = {
      label: 'Monitor',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-300 dark:border-amber-800',
      text: 'text-amber-700 dark:text-amber-400',
      description: 'Notice: Estimated usage is moderate. Consider monitoring activity logs.'
    };
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">System Settings</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Configure company profile, numbering sequence prefixes, default terms, theme mode, and monitor local & Firebase usage.
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
          { id: 'firebase_usage', label: 'Firebase & Local Storage', icon: Database },
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
              <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">Company Phone Number 1 *</label>
              <input
                type="text"
                required
                value={companyForm.phone}
                onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl focus:ring-1 focus:ring-[#E31B23]"
              />
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">Company Phone Number 2 (Optional)</label>
              <input
                type="text"
                placeholder="e.g. +91 98765 43211"
                value={companyForm.phone2 || ''}
                onChange={(e) => setCompanyForm({ ...companyForm, phone2: e.target.value })}
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
            <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">Company Logo (Stored Locally in IndexedDB)</label>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    try {
                      const record = await saveCompanyAsset('company_logo', file, file.name);
                      const url = URL.createObjectURL(record.blob);
                      setLogoPreviewUrl(url);
                      setCompanyForm(prev => ({ ...prev, logoUrl: url }));
                      await refreshLocalStats();
                    } catch (err: any) {
                      alert('Local Logo save failed: ' + err.message);
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
            {(logoPreviewUrl || companyForm.logoUrl) && (
              <div className="mt-2 p-2 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-xl flex items-center space-x-3 w-max">
                <img src={logoPreviewUrl || companyForm.logoUrl} alt="Company Logo Preview" className="h-10 w-auto object-contain rounded" />
                <span className="text-[10px] text-gray-400 font-semibold">Active Local Logo</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">Authorized Signature (Stored Locally in IndexedDB)</label>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    try {
                      const record = await saveCompanyAsset('company_signature', file, file.name);
                      const url = URL.createObjectURL(record.blob);
                      setSignaturePreviewUrl(url);
                      setCompanyForm(prev => ({ ...prev, signatureUrl: url }));
                      await refreshLocalStats();
                    } catch (err: any) {
                      alert('Local Signature save failed: ' + err.message);
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
            {(signaturePreviewUrl || companyForm.signatureUrl) && (
              <div className="mt-2 p-2 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-xl flex items-center space-x-3 w-max">
                <img src={signaturePreviewUrl || companyForm.signatureUrl} alt="Signature Preview" className="h-10 w-auto object-contain rounded" />
                <span className="text-[10px] text-gray-400 font-semibold">Active Local Signature</span>
              </div>
            )}
          </div>

          <p className="text-[11px] text-gray-500 dark:text-gray-400 bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30 flex items-start space-x-2">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Local Storage Notice:</strong> Your logos and signatures are saved locally in your browser's IndexedDB database. They are not uploaded to any cloud service and stay private on this device.
            </span>
          </p>

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

      {/* Tab 6: Firebase & Local Storage */}
      {activeTab === 'firebase_usage' && (
        <div className="space-y-6 text-xs animate-in fade-in duration-300">
          {/* Status & Refresh Header Banner */}
          <div className={`p-5 rounded-2xl border ${planStatus.bg} ${planStatus.border} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
            <div className="flex items-start space-x-3">
              {planStatus.label === 'Safe' ? (
                <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className={`w-6 h-6 ${planStatus.text} flex-shrink-0 mt-0.5`} />
              )}
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-extrabold text-sm text-gray-900 dark:text-gray-100">
                    Firebase Spark Plan Status: <span className={planStatus.text}>{planStatus.label}</span>
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-black/10 dark:bg-white/10 uppercase">
                    Free Tier
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                  {planStatus.description}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 self-end sm:self-auto">
              <span className="text-[11px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
                Last updated: {new Date(usageMetrics.lastUpdated).toLocaleTimeString()}
              </span>
              <button
                type="button"
                onClick={refreshLocalStats}
                className="p-2 bg-white dark:bg-[#252525] border border-gray-200 dark:border-[#333] hover:bg-gray-100 dark:hover:bg-[#333] text-gray-700 dark:text-gray-200 rounded-xl font-bold shadow-xs transition flex items-center space-x-1"
                title="Refresh Usage Metrics"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* Local Storage Usage Section (IndexedDB) */}
          <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#2A2A2A] pb-3">
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider flex items-center space-x-2">
                <HardDriveDownload className="w-4 h-4 text-[#E31B23]" />
                <span>IndexedDB Local Storage Usage (Device Files)</span>
              </h2>
              <span className="text-xs font-mono font-bold text-gray-700 dark:text-gray-300">
                {(localStats.totalSizeBytes / 1024 / 1024).toFixed(2)} MB Stored Locally
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <div className="p-3 bg-gray-50 dark:bg-[#222] border border-gray-100 dark:border-[#2A2A2A] rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">companyAssets</span>
                <p className="text-xl font-extrabold font-mono text-gray-900 dark:text-gray-100">
                  {localStats.companyAssetsCount}
                </p>
                <span className="text-[9px] text-gray-400">Logos & Signatures</span>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-[#222] border border-gray-100 dark:border-[#2A2A2A] rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">clientAssets</span>
                <p className="text-xl font-extrabold font-mono text-gray-900 dark:text-gray-100">
                  {localStats.clientAssetsCount}
                </p>
                <span className="text-[9px] text-gray-400">Client Logos</span>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-[#222] border border-gray-100 dark:border-[#2A2A2A] rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">quotationFiles</span>
                <p className="text-xl font-extrabold font-mono text-gray-900 dark:text-gray-100">
                  {localStats.quotationFilesCount}
                </p>
                <span className="text-[9px] text-gray-400">Quotation PDFs</span>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-[#222] border border-gray-100 dark:border-[#2A2A2A] rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">invoiceFiles</span>
                <p className="text-xl font-extrabold font-mono text-gray-900 dark:text-gray-100">
                  {localStats.invoiceFilesCount}
                </p>
                <span className="text-[9px] text-gray-400">Invoice PDFs</span>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-[#222] border border-gray-100 dark:border-[#2A2A2A] rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">balanceInvoiceFiles</span>
                <p className="text-xl font-extrabold font-mono text-gray-900 dark:text-gray-100">
                  {localStats.balanceInvoiceFilesCount}
                </p>
                <span className="text-[9px] text-gray-400">Balance PDFs</span>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-[#222] border border-gray-100 dark:border-[#2A2A2A] rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">otherFiles</span>
                <p className="text-xl font-extrabold font-mono text-gray-900 dark:text-gray-100">
                  {localStats.otherFilesCount}
                </p>
                <span className="text-[9px] text-gray-400">Documents</span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-[#2A2A2A]">
              <p className="text-[11px] text-gray-500 dark:text-gray-400 bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200/50 dark:border-amber-900/30">
                <strong>Cross-Device & Browser Data Notice:</strong> Logos, signatures, generated PDFs and attachments stored in IndexedDB are available only on this browser/device and do not automatically synchronize to another device. Clearing browser/site data may permanently remove locally stored IndexedDB assets while Firestore business records remain available.
              </p>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setResetModalType('assets')}
                  className="px-3.5 py-1.5 bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 hover:bg-red-200 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 whitespace-nowrap"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Local Assets</span>
                </button>
              </div>
            </div>
          </div>

          {/* 1. Storage & Quota Estimation Card */}
          <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#2A2A2A] pb-3">
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider flex items-center space-x-2">
                <HardDrive className="w-4 h-4 text-[#E31B23]" />
                <span>Estimated Firestore Database Usage</span>
              </h2>
              <span className="text-xs font-mono font-bold text-gray-700 dark:text-gray-300">
                {estimatedMb < 1 ? `${(estimatedJsonBytes / 1024).toFixed(2)} KB` : `${estimatedMb.toFixed(2)} MB`} / 1.0 GB Free Quota
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full bg-gray-100 dark:bg-[#252525] h-3 rounded-full overflow-hidden p-0.5 border border-gray-200 dark:border-[#333]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    usagePercentage >= 90 ? 'bg-red-600' :
                    usagePercentage >= 75 ? 'bg-orange-500' :
                    usagePercentage >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.max(1, usagePercentage)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 font-medium">
                <span>0 MB</span>
                <span>500 MB (50%)</span>
                <span>1,024 MB (1 GB Max)</span>
              </div>
            </div>

            <p className="text-[11px] text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#222] p-3 rounded-xl border border-gray-100 dark:border-[#2A2A2A] flex items-start space-x-2">
              <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Note:</strong> Calculated from stringified application state + Firestore document metadata overhead. Official server-side billing storage numbers are maintained in the Firebase Web Console.
              </span>
            </p>
          </div>

          {/* 2. Collection Document Counts Grid */}
          <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider flex items-center space-x-2">
              <Layers className="w-4 h-4 text-[#E31B23]" />
              <span>Firestore Collection Document Counts</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {[
                { label: 'Clients', count: documentCounts.clients },
                { label: 'Quotations', count: documentCounts.quotations },
                { label: 'Invoices', count: documentCounts.invoices },
                { label: 'Bal Invoices', count: documentCounts.balanceInvoices },
                { label: 'Payments', count: documentCounts.payments },
                { label: 'File Library', count: documentCounts.files },
                { label: 'Activity Logs', count: documentCounts.activityLogs },
                { label: 'Email Logs', count: documentCounts.emailLogs },
                { label: 'Settings', count: documentCounts.settings },
                { label: 'Total Documents', count: totalDocCount, highlight: true },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`p-3 rounded-xl border flex flex-col justify-between space-y-1 transition ${
                    item.highlight
                      ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-[#E31B23]'
                      : 'bg-gray-50 dark:bg-[#222] border-gray-100 dark:border-[#2A2A2A]'
                  }`}
                >
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase truncate">{item.label}</span>
                  <span className="text-lg font-extrabold font-mono text-gray-900 dark:text-gray-100">
                    {item.count.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-gray-400">docs stored</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Session Tracked Operations */}
          <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#2A2A2A] pb-3">
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider flex items-center space-x-2">
                <Activity className="w-4 h-4 text-[#E31B23]" />
                <span>Application-Tracked Session Activity</span>
              </h2>
              <span className="text-[10px] text-gray-400 font-medium">
                Spark Daily Limits Reference
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-[#222] border border-gray-100 dark:border-[#2A2A2A] rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Document Reads (Session)</span>
                <p className="text-2xl font-extrabold font-mono text-blue-600 dark:text-blue-400">
                  {usageMetrics.trackedReads.toLocaleString()}
                </p>
                <p className="text-[10px] text-gray-400">Spark Free Limit: 50,000 / day</p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-[#222] border border-gray-100 dark:border-[#2A2A2A] rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Document Writes (Session)</span>
                <p className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                  {usageMetrics.trackedWrites.toLocaleString()}
                </p>
                <p className="text-[10px] text-gray-400">Spark Free Limit: 20,000 / day</p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-[#222] border border-gray-100 dark:border-[#2A2A2A] rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Document Deletes (Session)</span>
                <p className="text-2xl font-extrabold font-mono text-amber-600 dark:text-amber-400">
                  {usageMetrics.trackedDeletes.toLocaleString()}
                </p>
                <p className="text-[10px] text-gray-400">Spark Free Limit: 20,000 / day</p>
              </div>
            </div>

            <p className="text-[11px] text-gray-400">
              * Tracked in memory during your active browser session. Zero extra queries are executed to measure these operations.
            </p>
          </div>

          {/* 1. Storage & Quota Estimation Card */}
          <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#2A2A2A] pb-3">
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider flex items-center space-x-2">
                <HardDrive className="w-4 h-4 text-[#E31B23]" />
                <span>Estimated Firestore Database Usage</span>
              </h2>
              <span className="text-xs font-mono font-bold text-gray-700 dark:text-gray-300">
                {estimatedMb < 1 ? `${(estimatedJsonBytes / 1024).toFixed(2)} KB` : `${estimatedMb.toFixed(2)} MB`} / 1.0 GB Free Quota
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full bg-gray-100 dark:bg-[#252525] h-3 rounded-full overflow-hidden p-0.5 border border-gray-200 dark:border-[#333]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    usagePercentage >= 90 ? 'bg-red-600' :
                    usagePercentage >= 75 ? 'bg-orange-500' :
                    usagePercentage >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.max(1, usagePercentage)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 font-medium">
                <span>0 MB</span>
                <span>500 MB (50%)</span>
                <span>1,024 MB (1 GB Max)</span>
              </div>
            </div>

            <p className="text-[11px] text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#222] p-3 rounded-xl border border-gray-100 dark:border-[#2A2A2A] flex items-start space-x-2">
              <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Note:</strong> Calculated from stringified application state + Firestore document metadata overhead. Official server-side billing storage numbers are maintained in the Firebase Web Console.
              </span>
            </p>
          </div>

          {/* 2. Collection Document Counts Grid */}
          <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider flex items-center space-x-2">
              <Layers className="w-4 h-4 text-[#E31B23]" />
              <span>Firestore Collection Document Counts</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {[
                { label: 'Clients', count: documentCounts.clients },
                { label: 'Quotations', count: documentCounts.quotations },
                { label: 'Invoices', count: documentCounts.invoices },
                { label: 'Bal Invoices', count: documentCounts.balanceInvoices },
                { label: 'Payments', count: documentCounts.payments },
                { label: 'File Library', count: documentCounts.files },
                { label: 'Activity Logs', count: documentCounts.activityLogs },
                { label: 'Email Logs', count: documentCounts.emailLogs },
                { label: 'Settings', count: documentCounts.settings },
                { label: 'Total Documents', count: totalDocCount, highlight: true },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`p-3 rounded-xl border flex flex-col justify-between space-y-1 transition ${
                    item.highlight
                      ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-[#E31B23]'
                      : 'bg-gray-50 dark:bg-[#222] border-gray-100 dark:border-[#2A2A2A]'
                  }`}
                >
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase truncate">{item.label}</span>
                  <span className="text-lg font-extrabold font-mono text-gray-900 dark:text-gray-100">
                    {item.count.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-gray-400">docs stored</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Session Tracked Operations */}
          <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#2A2A2A] pb-3">
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider flex items-center space-x-2">
                <Activity className="w-4 h-4 text-[#E31B23]" />
                <span>Application-Tracked Session Activity</span>
              </h2>
              <span className="text-[10px] text-gray-400 font-medium">
                Spark Daily Limits Reference
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-[#222] border border-gray-100 dark:border-[#2A2A2A] rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Document Reads (Session)</span>
                <p className="text-2xl font-extrabold font-mono text-blue-600 dark:text-blue-400">
                  {usageMetrics.trackedReads.toLocaleString()}
                </p>
                <p className="text-[10px] text-gray-400">Spark Free Limit: 50,000 / day</p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-[#222] border border-gray-100 dark:border-[#2A2A2A] rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Document Writes (Session)</span>
                <p className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                  {usageMetrics.trackedWrites.toLocaleString()}
                </p>
                <p className="text-[10px] text-gray-400">Spark Free Limit: 20,000 / day</p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-[#222] border border-gray-100 dark:border-[#2A2A2A] rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Document Deletes (Session)</span>
                <p className="text-2xl font-extrabold font-mono text-amber-600 dark:text-amber-400">
                  {usageMetrics.trackedDeletes.toLocaleString()}
                </p>
                <p className="text-[10px] text-gray-400">Spark Free Limit: 20,000 / day</p>
              </div>
            </div>

            <p className="text-[11px] text-gray-400">
              * Tracked in memory during your active browser session. Zero extra queries are executed to measure these operations.
            </p>
          </div>

          {/* Danger Zone Card */}
          <div className="p-6 bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-3xl space-y-4">
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
              onClick={() => setResetModalType('all')}
              className="px-4 py-2 bg-[#E31B23] hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-2 whitespace-nowrap"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All Stored Data</span>
            </button>
          </div>
        </div>
      )}

      {/* Reusable Confirmation Modal for Settings Actions */}
      <ConfirmationModal
        open={Boolean(resetModalType)}
        title={resetModalType === 'assets' ? "Clear Local IndexedDB Assets?" : "Database Reset & Clear All Data?"}
        description={resetModalType === 'assets' ? "Are you sure you want to clear all locally stored logos, signatures, and generated PDFs from this browser?" : "Are you sure you want to delete ALL clients, quotations, invoices, payments, and activity logs?"}
        warning={resetModalType === 'assets' ? "This file is stored locally on this device/browser." : "This action cannot be undone and will reset the entire system database."}
        confirmText={resetModalType === 'assets' ? "Clear Local Assets" : "Clear All Data"}
        cancelText="Cancel"
        loading={isResetting}
        onConfirm={async () => {
          setIsResetting(true);
          try {
            if (resetModalType === 'assets') {
              await clearAllLocalAssets();
              setLogoPreviewUrl('');
              setSignaturePreviewUrl('');
              await refreshLocalStats();
              setIsResetting(false);
              setResetModalType(null);
            } else if (resetModalType === 'all') {
              await resetAllData();
              setIsResetting(false);
              setResetModalType(null);
              window.location.reload();
            }
          } catch (err) {
            setIsResetting(false);
          }
        }}
        onCancel={() => setResetModalType(null)}
      />
    </div>
  );
};
