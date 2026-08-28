import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { DocumentPreviewModal } from '../components/documents/DocumentPreviewModal';
import { Invoice } from '../types';
import { motion } from 'framer-motion';
import {
  Users, FileText, CreditCard, IndianRupee, Scale, TrendingUp,
  PlusCircle, Clock, CheckCircle2, ShieldCheck, ArrowRight, Sparkles, Eye
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { clients, quotations, invoices, balanceInvoices, payments, activityLogs } = useData();
  const navigate = useNavigate();

  // Modal states for drill-down details
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);
  const [selectedInvoiceForPreview, setSelectedInvoiceForPreview] = useState<Invoice | null>(null);

  // Metrics calculations
  const totalClientsCount = clients.length;
  const totalQuotationsCount = quotations.length;
  const totalInvoicesCount = invoices.length;

  const totalInvoiceValue = invoices.reduce((sum, i) => sum + Number(i.totalAmount || 0), 0);
  const totalAmountReceived = invoices.reduce((sum, i) => sum + Number(i.paidAmount || 0), 0);
  const totalBalanceOutstanding = Math.max(0, invoices.reduce((sum, i) => sum + Number(i.balanceAmount || 0), 0));

  const pendingPaymentsCount = invoices.filter(i => i.paymentStatus !== 'fully_paid').length;
  const fullyPaidCount = invoices.filter(i => i.paymentStatus === 'fully_paid').length;

  // Derived pending invoices (balanceAmount > 0)
  const pendingInvoicesList = invoices.filter(i => i.balanceAmount > 0 || i.paymentStatus !== 'fully_paid');

  // Pending Balance Details Calculations
  const pendingInvoiceValue = pendingInvoicesList.reduce((sum, i) => sum + i.totalAmount, 0);
  const receivedAgainstPendingInvoices = pendingInvoicesList.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
  const outstandingBalanceSum = pendingInvoicesList.reduce((sum, i) => sum + i.balanceAmount, 0);

  // Unique Clients count calculation
  const uniqueClientsCount = new Set(
    pendingInvoicesList.map(i => i.client?.id || i.clientId || i.client?.name)
  ).size;

  // Stagger animation container
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 20 } }
  };

  return (
    <div className="space-y-6">
      {/* Liquid Banner with Framer Motion */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="liquid-glass-red text-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden border border-white/30"
      >
        {/* Floating Fluid Blobs */}
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none liquid-blob-1"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-400/20 rounded-full blur-2xl pointer-events-none liquid-blob-2"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-amber-300" />
              <span className="text-xs uppercase font-black tracking-widest text-red-100 bg-white/15 px-2.5 py-0.5 rounded-full border border-white/20">
                KEVORCH SBD Pro
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight drop-shadow-md">
              Billing & Document Control
            </h1>
            <p className="text-xs sm:text-sm text-red-100 mt-2 max-w-xl font-medium leading-relaxed opacity-95">
              Manage client history, generate formal quotations, convert invoices, track remaining balances, and dispatch PDF documents.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/quotations/create')}
              className="px-4 py-2.5 bg-white text-[#E31B23] hover:bg-red-50 text-xs font-black rounded-2xl shadow-xl transition flex items-center space-x-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Quotation</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/invoices/create')}
              className="px-4 py-2.5 bg-black/25 hover:bg-black/40 text-white text-xs font-black rounded-2xl border border-white/30 backdrop-blur-md transition flex items-center space-x-2"
            >
              <PlusCircle className="w-4 h-4 text-amber-300" />
              <span>Create Invoice</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Metric Cards Grid (8 Core Neumorphic Summary Cards) */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Card 1: Total Clients */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/clients')}
          className="neu-card p-5 cursor-pointer relative group overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-gray-500 dark:text-gray-400">Total Clients</span>
            <div className="w-10 h-10 rounded-2xl bg-red-500/10 dark:bg-red-500/20 text-[#E31B23] flex items-center justify-center border border-red-500/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900 dark:text-gray-100 mt-3">{totalClientsCount}</p>
          <p className="text-[10px] text-gray-400 mt-1 font-semibold">Active client directory</p>
        </motion.div>

        {/* Card 2: Total Quotations */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/quotations')}
          className="neu-card p-5 cursor-pointer relative group overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-gray-500 dark:text-gray-400">Total Quotations</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900 dark:text-gray-100 mt-3">{totalQuotationsCount}</p>
          <p className="text-[10px] text-gray-400 mt-1 font-semibold">Estimates & proposals</p>
        </motion.div>

        {/* Card 3: Total Invoices */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/invoices')}
          className="neu-card p-5 cursor-pointer relative group overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-gray-500 dark:text-gray-400">Total Invoices</span>
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900 dark:text-gray-100 mt-3">{totalInvoicesCount}</p>
          <p className="text-[10px] text-gray-400 mt-1 font-semibold">Generated invoices</p>
        </motion.div>

        {/* Card 4: Total Amount */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4, scale: 1.02 }}
          className="neu-card p-5 relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-gray-500 dark:text-gray-400">Total Invoice Value</span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 mt-3">₹{totalInvoiceValue.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-gray-400 mt-1 font-semibold">Gross project value</p>
        </motion.div>

        {/* Card 5: Amount Received */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/payments')}
          className="neu-card p-5 cursor-pointer relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">Amount Received</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400 mt-3">₹{totalAmountReceived.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-bold">Payments collected</p>
        </motion.div>

        {/* Card 6: Balance Outstanding */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsBalanceModalOpen(true)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsBalanceModalOpen(true); } }}
          tabIndex={0}
          role="button"
          aria-label="View Pending Balance Details"
          className="neu-card p-5 cursor-pointer relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-amber-500/40"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-700 dark:text-amber-400">Balance Outstanding</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-700 dark:text-amber-400 mt-3">₹{totalBalanceOutstanding.toLocaleString('en-IN')}</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">Remaining balance due</span>
            <span className="text-[10px] font-black text-amber-700 dark:text-amber-300 flex items-center hover:underline">
              View Details <ArrowRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </motion.div>

        {/* Card 7: Pending Payments Count */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsPendingModalOpen(true)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsPendingModalOpen(true); } }}
          tabIndex={0}
          role="button"
          aria-label="View Pending Invoices Details"
          className="neu-card p-5 cursor-pointer relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-red-500/40"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-gray-500 dark:text-gray-400">Pending Invoices</span>
            <div className="w-10 h-10 rounded-2xl bg-red-500/10 dark:bg-red-500/20 text-[#E31B23] flex items-center justify-center border border-red-500/20">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900 dark:text-gray-100 mt-3">{pendingPaymentsCount}</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-[#E31B23] font-bold">Unpaid / Partially paid</span>
            <span className="text-[10px] font-black text-[#E31B23] flex items-center hover:underline">
              View Details <ArrowRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </motion.div>

        {/* Card 8: Fully Paid Projects */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4, scale: 1.02 }}
          className="neu-card p-5 relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-gray-500 dark:text-gray-400">Fully Paid Projects</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900 dark:text-gray-100 mt-3">{fullyPaidCount}</p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">100% Settled billing</p>
        </motion.div>
      </motion.div>

      {/* Quick Action Bar */}
      <div className="neu-card p-6 space-y-3">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center space-x-1">
          <Sparkles className="w-3.5 h-3.5 text-[#E31B23]" />
          <span>Quick Actions Panel</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Create Client', desc: 'Save client profile', icon: Users, path: '/clients?action=new' },
            { label: 'Create Quotation', desc: 'Send estimate quote', icon: FileText, path: '/quotations/create' },
            { label: 'Create Invoice', desc: 'Generate billing invoice', icon: CreditCard, path: '/invoices/create' },
            { label: 'Create Balance Inv', desc: 'Bill remaining dues', icon: Scale, path: '/balance-invoices/create' },
            { label: 'Record Payment', desc: 'Log cash/UPI/Bank', icon: IndianRupee, path: '/payments?action=new' },
          ].map((act, i) => {
            const Icon = act.icon;
            return (
              <motion.button
                key={i}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(act.path)}
                className="neu-panel p-3.5 text-left hover:border-[#E31B23]/40 cursor-pointer"
              >
                <Icon className="w-5 h-5 mb-1.5 text-[#E31B23]" />
                <p className="text-xs font-black text-gray-900 dark:text-gray-100">{act.label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{act.desc}</p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Recent Invoices & Recent Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Invoices List */}
        <div className="lg:col-span-2 neu-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200/80 dark:border-[#2C2C34] pb-4">
            <div>
              <h3 className="text-base font-black text-gray-900 dark:text-gray-100">Recent Invoices</h3>
              <p className="text-xs text-gray-400 font-medium">Track payment balance and client invoice status</p>
            </div>
            <motion.button
              whileHover={{ x: 4 }}
              onClick={() => navigate('/invoices')}
              className="text-xs font-black text-[#E31B23] hover:underline flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-gray-400 uppercase text-[10px] font-black border-b border-gray-200/80 dark:border-[#2C2C34]">
                <tr>
                  <th className="pb-2.5">Invoice #</th>
                  <th className="pb-2.5">Client</th>
                  <th className="pb-2.5 text-right">Total Amount</th>
                  <th className="pb-2.5 text-right">Balance Due</th>
                  <th className="pb-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#26262E]">
                {invoices.slice(0, 5).map((inv) => (
                  <motion.tr
                    key={inv.id}
                    whileHover={{ backgroundColor: 'rgba(227, 27, 35, 0.03)' }}
                    onClick={() => navigate(`/invoices`)}
                    className="cursor-pointer transition duration-150"
                  >
                    <td className="py-3.5 font-bold text-gray-900 dark:text-gray-100">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 font-semibold text-gray-700 dark:text-gray-300">
                      {inv.client.name}
                      <span className="block text-[10px] text-gray-400 font-normal">{inv.client.companyName}</span>
                    </td>
                    <td className="py-3.5 text-right font-black text-gray-900 dark:text-gray-100">
                      ₹{inv.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 text-right font-black text-[#E31B23]">
                      ₹{inv.balanceAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 text-center">
                      <StatusBadge status={inv.paymentStatus} type="payment" />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Recent Client Activity Audit */}
        <div className="neu-card p-6 space-y-4">
          <div className="border-b border-gray-200/80 dark:border-[#2C2C34] pb-4">
            <h3 className="text-base font-black text-gray-900 dark:text-gray-100">Recent Activity</h3>
            <p className="text-xs text-gray-400 font-medium">Real-time audit log events</p>
          </div>

          <div className="space-y-3">
            {activityLogs.slice(0, 5).map((log) => (
              <motion.div 
                key={log.id} 
                whileHover={{ scale: 1.01 }}
                className="neu-panel p-3.5 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-[#E31B23] uppercase tracking-wide">{log.action}</span>
                  <span className="text-[10px] text-gray-400">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-xs font-black text-gray-800 dark:text-gray-200">{log.clientName}</p>
                <p className="text-[11px] text-gray-500 leading-snug">{log.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Pending Balance Details Modal */}
      <Modal
        isOpen={isBalanceModalOpen}
        onClose={() => setIsBalanceModalOpen(false)}
        title="Pending Balance Details"
        maxWidth="4xl"
      >
        <div className="space-y-6">
          {/* Top Summary Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="neu-panel p-4 space-y-1">
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Pending Invoice Value</span>
              <p className="text-xl font-black text-gray-900 dark:text-gray-100">
                ₹{pendingInvoiceValue.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="neu-panel p-4 space-y-1">
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Received Against Pending Invoices</span>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                ₹{receivedAgainstPendingInvoices.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="neu-panel p-4 space-y-1 border-red-200/80 dark:border-red-900/40">
              <span className="text-[10px] font-black uppercase text-[#E31B23] tracking-wider">Outstanding Balance</span>
              <p className="text-xl font-black text-[#E31B23]">
                ₹{outstandingBalanceSum.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Indicators Bar */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-semibold px-1">
            <div className="flex items-center space-x-4">
              <span>Unique Clients: <strong className="text-gray-900 dark:text-gray-100 font-black">{uniqueClientsCount}</strong></span>
              <span>Pending Invoices: <strong className="text-gray-900 dark:text-gray-100 font-black">{pendingInvoicesList.length}</strong></span>
            </div>
          </div>

          {/* Financial Table Breakdown */}
          {pendingInvoicesList.length > 0 ? (
            <div className="neu-table-container">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-[#15181E] text-gray-400 uppercase text-[10px] font-black border-b border-gray-200/80 dark:border-[#30343E]">
                    <tr>
                      <th className="p-3">Client Name & Company</th>
                      <th className="p-3">Invoice Number</th>
                      <th className="p-3 text-right">Total Amount (₹)</th>
                      <th className="p-3 text-right">Paid Amount (₹)</th>
                      <th className="p-3 text-right">Pending Balance (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-[#26262E]">
                    {pendingInvoicesList.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02]">
                        <td className="p-3 font-bold text-gray-900 dark:text-gray-100">
                          {inv.client.name}
                          {inv.client.companyName && (
                            <span className="block text-[10px] text-gray-400 font-normal">{inv.client.companyName}</span>
                          )}
                        </td>
                        <td className="p-3 font-semibold text-gray-700 dark:text-gray-300">{inv.invoiceNumber}</td>
                        <td className="p-3 text-right font-semibold text-gray-800 dark:text-gray-200">
                          ₹{inv.totalAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                          ₹{(inv.paidAmount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 text-right font-black text-[#E31B23]">
                          ₹{inv.balanceAmount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50/80 dark:bg-[#15181E] font-black border-t border-gray-200 dark:border-[#30343E]">
                    <tr>
                      <td colSpan={2} className="p-3 text-gray-700 dark:text-gray-300 uppercase text-[10px]">Total Dues Summary</td>
                      <td className="p-3 text-right text-gray-900 dark:text-gray-100">
                        ₹{pendingInvoiceValue.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-right text-emerald-600 dark:text-emerald-400">
                        ₹{receivedAgainstPendingInvoices.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-right text-[#E31B23] text-sm">
                        ₹{outstandingBalanceSum.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center space-y-2 neu-panel">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">No outstanding balances</h4>
              <p className="text-xs text-gray-400">All client invoice payments have been fully settled.</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Pending Invoices Modal */}
      <Modal
        isOpen={isPendingModalOpen}
        onClose={() => setIsPendingModalOpen(false)}
        title="Pending Invoices"
        maxWidth="4xl"
      >
        <div className="space-y-4">
          {pendingInvoicesList.length > 0 ? (
            <div className="neu-table-container">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-[#15181E] text-gray-400 uppercase text-[10px] font-black border-b border-gray-200/80 dark:border-[#30343E]">
                    <tr>
                      <th className="p-3">Invoice Number</th>
                      <th className="p-3">Client Name & Company</th>
                      <th className="p-3 text-right">Total Amount (₹)</th>
                      <th className="p-3 text-right">Paid Amount (₹)</th>
                      <th className="p-3 text-right">Balance Due (₹)</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-[#26262E]">
                    {pendingInvoicesList.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02]">
                        <td className="p-3 font-bold text-gray-900 dark:text-gray-100">{inv.invoiceNumber}</td>
                        <td className="p-3 font-semibold text-gray-700 dark:text-gray-300">
                          {inv.client.name}
                          {inv.client.companyName && (
                            <span className="block text-[10px] text-gray-400 font-normal">{inv.client.companyName}</span>
                          )}
                        </td>
                        <td className="p-3 text-right font-semibold text-gray-800 dark:text-gray-200">
                          ₹{inv.totalAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                          ₹{(inv.paidAmount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 text-right font-black text-[#E31B23]">
                          ₹{inv.balanceAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 text-center">
                          <StatusBadge status={inv.paymentStatus} type="payment" />
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => setSelectedInvoiceForPreview(inv)}
                            className="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:text-[#E31B23] hover:bg-red-50 dark:hover:bg-red-950/30 transition inline-flex items-center space-x-1 font-bold"
                            title="Preview Invoice PDF"
                            aria-label={`Preview invoice ${inv.invoiceNumber}`}
                          >
                            <Eye className="w-4 h-4" />
                            <span className="text-[11px]">Preview</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center space-y-2 neu-panel">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">No pending invoices</h4>
              <p className="text-xs text-gray-400">All invoices are currently fully paid.</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Document Preview Modal Reuse */}
      <DocumentPreviewModal
        isOpen={!!selectedInvoiceForPreview}
        onClose={() => setSelectedInvoiceForPreview(null)}
        document={selectedInvoiceForPreview}
        documentType="Invoice"
      />
    </div>
  );
};
