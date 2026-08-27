import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ClientFormModal } from './ClientFormModal';
import { ClientLogo } from '../../components/common/ClientLogo';
import { DocumentPreviewModal } from '../../components/documents/DocumentPreviewModal';
import { Quotation, Invoice, BalanceInvoice } from '../../types';
import {
  Building2, Phone, Mail, MapPin, Plus, FileText, CreditCard, IndianRupee,
  Scale, Calendar, Eye, ArrowLeft, History, FolderKanban
} from 'lucide-react';

export const ClientWorkspace: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { clients, quotations, invoices, balanceInvoices, payments, activityLogs, files } = useData();

  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'payments' | 'files' | 'activity'>('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Preview Document Modal state
  const [previewDoc, setPreviewDoc] = useState<Quotation | Invoice | BalanceInvoice | null>(null);
  const [previewType, setPreviewType] = useState<'Quotation' | 'Invoice' | 'Balance Invoice'>('Quotation');

  const client = clients.find(c => c.id === id);

  if (!client) {
    return (
      <div className="p-12 text-center bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-[#2A2A2A] space-y-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Client Not Found</h2>
        <button onClick={() => navigate('/clients')} className="px-4 py-2 bg-[#E31B23] text-white font-bold rounded-xl text-xs">
          Back to Clients Directory
        </button>
      </div>
    );
  }

  // Filter client-specific records
  const clientQuotations = quotations.filter(q => q.clientId === client.id);
  const clientInvoices = invoices.filter(i => i.clientId === client.id);
  const clientBalanceInvoices = balanceInvoices.filter(b => b.clientId === client.id);
  const clientPayments = payments.filter(p => p.clientId === client.id);
  const clientActivity = activityLogs.filter(a => a.clientId === client.id);
  const clientFiles = files.filter(f => f.clientId === client.id);

  // Calculations
  const totalProjectAmount = clientInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const totalPaidAmount = clientPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalBalanceAmount = Math.max(0, totalProjectAmount - totalPaidAmount);

  let overallPaymentStatus = 'unpaid';
  if (totalPaidAmount >= totalProjectAmount && totalProjectAmount > 0) {
    overallPaymentStatus = 'fully_paid';
  } else if (totalPaidAmount > 0) {
    overallPaymentStatus = 'partially_paid';
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Back Button & Top Action */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/clients')}
          className="inline-flex items-center space-x-2 text-xs font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Clients Directory</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate(`/quotations/create?clientId=${client.id}`)}
            className="px-3 py-1.5 bg-white dark:bg-[#1A1A1A] text-[#E31B23] text-xs font-bold rounded-lg border border-red-200 dark:border-red-900/50 hover:bg-red-50 transition flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Quotation</span>
          </button>
          <button
            onClick={() => navigate(`/invoices/create?clientId=${client.id}`)}
            className="px-3 py-1.5 bg-[#E31B23] hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Invoice</span>
          </button>
        </div>
      </div>

      {/* Client Identity Header Card */}
      <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start space-x-4">
          <ClientLogo
            client={client}
            className="w-16 h-16 rounded-2xl object-contain border border-gray-200 dark:border-[#2A2A2A] p-1 bg-white"
            fallbackClassName="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/40 text-[#E31B23] font-black flex items-center justify-center text-2xl border border-red-100"
          />
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-black text-gray-900 dark:text-gray-100">{client.name}</h1>
              <StatusBadge status={overallPaymentStatus} type="payment" />
            </div>
            <p className="text-xs font-bold text-[#E31B23] dark:text-red-400 mt-0.5 flex items-center space-x-1">
              <Building2 className="w-3.5 h-3.5" />
              <span>{client.companyName}</span>
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400 mt-2">
              <span className="flex items-center space-x-1"><Phone className="w-3.5 h-3.5 text-gray-400" /><span>{client.mobile}</span></span>
              <span className="flex items-center space-x-1"><Mail className="w-3.5 h-3.5 text-gray-400" /><span>{client.email}</span></span>
              <span className="flex items-center space-x-1"><MapPin className="w-3.5 h-3.5 text-gray-400" /><span>{client.address}, {client.city}, {client.state}</span></span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsEditModalOpen(true)}
          className="self-start md:self-center px-4 py-2 bg-gray-100 dark:bg-[#252525] text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl hover:bg-gray-200 transition"
        >
          Edit Client Details
        </button>
      </div>

      {/* Overview Cards (4 Key Metrics for this Client) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-bold text-gray-400">Total Project Amount</span>
          <p className="text-2xl font-black text-gray-900 dark:text-gray-100 mt-1">₹{totalProjectAmount.toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-gray-400">All invoices total</span>
        </div>

        <div className="bg-white dark:bg-[#1A1A1A] border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Total Paid</span>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">₹{totalPaidAmount.toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-emerald-600">Recorded payments</span>
        </div>

        <div className="bg-white dark:bg-[#1A1A1A] border border-red-200 dark:border-red-900/40 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-bold text-[#E31B23] dark:text-red-400">Total Balance Due</span>
          <p className="text-2xl font-black text-[#E31B23] dark:text-red-400 mt-1">₹{totalBalanceAmount.toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-[#E31B23]">Outstanding balance</span>
        </div>

        <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-bold text-gray-400">Payment Status</span>
          <div className="mt-2">
            <StatusBadge status={overallPaymentStatus} type="payment" />
          </div>
          <span className="text-[10px] text-gray-400 block mt-2">{clientInvoices.length} invoices generated</span>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="border-b border-gray-200 dark:border-[#2A2A2A] flex space-x-6">
        {[
          { id: 'overview', label: 'Overview', icon: FolderKanban },
          { id: 'documents', label: `Documents (${clientQuotations.length + clientInvoices.length + clientBalanceInvoices.length})`, icon: FileText },
          { id: 'payments', label: `Payments (${clientPayments.length})`, icon: IndianRupee },
          { id: 'files', label: `Files (${clientFiles.length})`, icon: CreditCard },
          { id: 'activity', label: `Activity Timeline (${clientActivity.length})`, icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 text-xs font-bold transition flex items-center space-x-2 border-b-2 ${
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

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-[#E31B23]" />
              <span>Recent Invoices</span>
            </h3>
            <div className="divide-y divide-gray-100 dark:divide-[#2A2A2A]">
              {clientInvoices.length === 0 ? (
                <p className="text-xs text-gray-400 py-4">No invoices created yet.</p>
              ) : (
                clientInvoices.map((inv) => (
                  <div key={inv.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-xs text-gray-900 dark:text-gray-100">{inv.invoiceNumber}</p>
                      <p className="text-[10px] text-gray-400">{inv.invoiceDate}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-xs text-gray-900 dark:text-gray-100">₹{inv.totalAmount.toLocaleString('en-IN')}</p>
                      <StatusBadge status={inv.paymentStatus} type="payment" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
              <History className="w-4 h-4 text-[#E31B23]" />
              <span>Recent Activity Timeline</span>
            </h3>
            <div className="space-y-3">
              {clientActivity.slice(0, 5).map((act) => (
                <div key={act.id} className="p-3 bg-gray-50 dark:bg-[#222] rounded-xl border border-gray-100 dark:border-[#2A2A2A]">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-[#E31B23] uppercase">{act.action}</span>
                    <span className="text-gray-400">{new Date(act.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">{act.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Documents */}
      {activeTab === 'documents' && (
        <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">All Client Documents</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-[#222] text-gray-400 uppercase text-[10px] font-bold border-b border-gray-100 dark:border-[#2A2A2A]">
                <tr>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Document #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#2A2A2A]">
                {clientQuotations.map((q) => (
                  <tr key={q.id} className="hover:bg-gray-50 dark:hover:bg-[#222]">
                    <td className="py-3 px-3"><span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px]">Quotation</span></td>
                    <td className="py-3 px-3 font-bold text-gray-900 dark:text-gray-100">{q.quotationNumber}</td>
                    <td className="py-3 px-3 text-gray-500">{q.quotationDate}</td>
                    <td className="py-3 px-3 text-right font-bold">₹{q.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-3 text-center"><StatusBadge status={q.status} type="quotation" /></td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => {
                          setPreviewDoc(q);
                          setPreviewType('Quotation');
                        }}
                        className="p-1.5 text-[#E31B23] hover:bg-red-50 rounded-lg"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {clientInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-[#222]">
                    <td className="py-3 px-3"><span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold text-[10px]">Invoice</span></td>
                    <td className="py-3 px-3 font-bold text-gray-900 dark:text-gray-100">{inv.invoiceNumber}</td>
                    <td className="py-3 px-3 text-gray-500">{inv.invoiceDate}</td>
                    <td className="py-3 px-3 text-right font-bold">₹{inv.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-3 text-center"><StatusBadge status={inv.paymentStatus} type="payment" /></td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => {
                          setPreviewDoc(inv);
                          setPreviewType('Invoice');
                        }}
                        className="p-1.5 text-[#E31B23] hover:bg-red-50 rounded-lg"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {clientBalanceInvoices.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-[#222]">
                    <td className="py-3 px-3"><span className="px-2 py-0.5 rounded bg-orange-50 text-orange-700 font-bold text-[10px]">Balance Invoice</span></td>
                    <td className="py-3 px-3 font-bold text-gray-900 dark:text-gray-100">{b.balanceInvoiceNumber}</td>
                    <td className="py-3 px-3 text-gray-500">{b.date}</td>
                    <td className="py-3 px-3 text-right font-bold text-[#E31B23]">₹{b.balanceAmountDue.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-3 text-center"><span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[10px] font-bold">Sent</span></td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => {
                          setPreviewDoc(b);
                          setPreviewType('Balance Invoice');
                        }}
                        className="p-1.5 text-[#E31B23] hover:bg-red-50 rounded-lg"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Payments */}
      {activeTab === 'payments' && (
        <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Client Payment Ledger</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-[#222] text-gray-400 uppercase text-[10px] font-bold border-b border-gray-100 dark:border-[#2A2A2A]">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Ref #</th>
                  <th className="py-2.5 px-3 text-right">Amount Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#2A2A2A]">
                {clientPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-[#222]">
                    <td className="py-3 px-3 font-semibold">{p.paymentDate}</td>
                    <td className="py-3 px-3 font-bold text-gray-900 dark:text-gray-100">{p.invoiceNumber}</td>
                    <td className="py-3 px-3">{p.paymentMethod}</td>
                    <td className="py-3 px-3 text-gray-500 font-mono text-[11px]">{p.referenceNumber || 'N/A'}</td>
                    <td className="py-3 px-3 text-right font-extrabold text-emerald-600">₹{p.amount.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Files */}
      {activeTab === 'files' && (
        <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Client Files & Branding Library</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {client.logoUrl && (
              <div className="p-3 border border-gray-200 dark:border-[#2A2A2A] rounded-xl flex items-center space-x-3">
                <img src={client.logoUrl} alt="Logo" className="w-12 h-12 object-contain rounded-lg" />
                <div>
                  <p className="font-bold text-xs text-gray-800 dark:text-gray-200">Client Logo</p>
                  <p className="text-[10px] text-gray-400">Used in documents</p>
                </div>
              </div>
            )}
            {clientFiles.map(f => (
              <div key={f.id} className="p-3 border border-gray-200 dark:border-[#2A2A2A] rounded-xl flex items-center space-x-3">
                <FileText className="w-8 h-8 text-[#E31B23]" />
                <div className="truncate">
                  <p className="font-bold text-xs text-gray-800 dark:text-gray-200 truncate">{f.fileName}</p>
                  <p className="text-[10px] text-gray-400">{f.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Activity Timeline */}
      {activeTab === 'activity' && (
        <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Complete Audit History</h3>
          <div className="space-y-3">
            {clientActivity.map(act => (
              <div key={act.id} className="p-3 bg-gray-50 dark:bg-[#222] rounded-xl border border-gray-100 dark:border-[#2A2A2A] flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold text-[#E31B23] uppercase">{act.action}</span>
                  <p className="text-xs text-gray-800 dark:text-gray-200 mt-0.5">{act.description}</p>
                </div>
                <span className="text-[10px] text-gray-400">{new Date(act.timestamp).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      <ClientFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        clientToEdit={client}
      />

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        document={previewDoc}
        documentType={previewType}
      />
    </div>
  );
};
