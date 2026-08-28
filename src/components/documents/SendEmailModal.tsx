import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quotation, Invoice, BalanceInvoice, Payment, Client } from '../../types';
import { useData } from '../../context/DataContext';
import { Modal } from '../common/Modal';
import {
  FileText, CheckCircle2, AlertCircle, Download, ExternalLink,
  Plus, X, Info, Eye
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { saveQuotationPdf, saveInvoicePdf, saveBalanceInvoicePdf, saveLocalDocumentFile } from '../../lib/indexedDb';
import { PaymentReceiptPDF } from './PaymentReceiptPDF';
import { QuotationPDF } from './QuotationPDF';
import { InvoicePDF } from './InvoicePDF';
import { BalanceInvoicePDF } from './BalanceInvoicePDF';

export interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Quotation | Invoice | BalanceInvoice | Payment;
  documentType: 'Quotation' | 'Invoice' | 'Balance Invoice' | 'Payment Receipt';
}

export const SendEmailModal: React.FC<SendEmailModalProps> = ({
  isOpen,
  onClose,
  document: docItem,
  documentType
}) => {
  const { addEmailLog, logActivity, settings, updateClient, clients } = useData();
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Helper to extract document number
  const docNumber = 'quotationNumber' in docItem
    ? (docItem as Quotation).quotationNumber
    : 'invoiceNumber' in docItem
    ? (docItem as Invoice).invoiceNumber
    : 'balanceInvoiceNumber' in docItem
    ? (docItem as BalanceInvoice).balanceInvoiceNumber
    : (docItem as Payment).referenceNumber || `PAY-${(docItem as any).id.slice(-6).toUpperCase()}`;

  // Helper to extract document amount
  const docAmount = 'totalAmount' in docItem
    ? (docItem as any).totalAmount
    : 'balanceAmountDue' in docItem
    ? (docItem as BalanceInvoice).balanceAmountDue
    : (docItem as Payment).amount || 0;

  const docAmountStr = Number(docAmount || 0).toLocaleString('en-IN');

  // Helper to extract client
  const client: Client | undefined = 'client' in docItem
    ? (docItem as any).client
    : clients.find(c => c.id === (docItem as Payment).clientId);

  const clientName = client?.name || ('clientName' in docItem ? (docItem as Payment).clientName : 'Valued Client');

  // Form State
  const [toEmail, setToEmail] = useState('');
  const [ccList, setCcList] = useState<string[]>([]);
  const [newCcInput, setNewCcInput] = useState('');
  const [isAddingCc, setIsAddingCc] = useState(false);
  const [saveCcToClient, setSaveCcToClient] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isDraftOpened, setIsDraftOpened] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const pdfFilename = `${docNumber}_KEVORCH_SBD.pdf`;

  // Focus & Accessibility Setup
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      const timer = setTimeout(() => modalRef.current?.focus(), 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleKeyDown);
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
      };
    }
  }, [isOpen, onClose]);

  // Auto-fill fields on document change
  useEffect(() => {
    if (isOpen && docItem) {
      setIsDraftOpened(false);
      setErrorMsg('');
      setIsAddingCc(false);

      // 1. Primary To Email
      const primaryTo = client?.email || '';
      setToEmail(primaryTo);

      // 2. CC Email list initialization from Client ccEmails
      let initialCc: string[] = [];
      if (client?.ccEmails && Array.isArray(client.ccEmails)) {
        initialCc = client.ccEmails;
      }
      const cleanCc = Array.from(new Set(initialCc.map(c => c.trim()).filter(Boolean)))
        .filter(email => email.toLowerCase() !== primaryTo.toLowerCase());
      setCcList(cleanCc);

      // 3. Auto-Generate Subject
      const companyName = settings.company.companyName || 'KEVORCH SBD';
      let autoSubject = '';
      if (documentType === 'Quotation') {
        autoSubject = `Quotation ${docNumber} - ${companyName}`;
      } else if (documentType === 'Invoice') {
        autoSubject = `Invoice ${docNumber} - ${companyName}`;
      } else if (documentType === 'Balance Invoice') {
        autoSubject = `Balance Invoice ${docNumber} - ${companyName}`;
      } else {
        autoSubject = `Payment Receipt ${docNumber} - ${companyName}`;
      }
      setSubject(autoSubject);

      // 4. Auto-Generate Message Body
      let bodyText = `Dear ${clientName},\n\nPlease find details for your ${documentType} (${docNumber}) below.\n\nAmount: ₹${docAmountStr}`;

      if ('dueDate' in docItem && (docItem as any).dueDate) {
        bodyText += `\nDue Date: ${(docItem as any).dueDate}`;
      }

      if ('paymentTerms' in docItem && (docItem as any).paymentTerms) {
        bodyText += `\nPayment Terms: ${(docItem as any).paymentTerms}`;
      }

      bodyText += `\n\nIf you have any questions or require assistance, please contact us at ${settings.company.email} or ${settings.company.phone}.\n\nBest regards,\n${settings.company.companyName}`;

      setMessage(bodyText);
    }
  }, [isOpen, docItem, documentType, docNumber, docAmountStr, client, clientName, settings]);

  // CC Tag Handlers
  const handleAddCc = () => {
    if (!newCcInput.trim()) return;
    const emailToAdd = newCcInput.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailToAdd)) {
      setErrorMsg('Please enter a valid CC email address.');
      return;
    }

    if (emailToAdd.toLowerCase() === toEmail.toLowerCase()) {
      setErrorMsg('CC email cannot be the same as the primary recipient To email.');
      return;
    }

    if (!ccList.some(c => c.toLowerCase() === emailToAdd.toLowerCase())) {
      setCcList(prev => [...prev, emailToAdd]);
    }
    setNewCcInput('');
    setIsAddingCc(false);
    setErrorMsg('');
  };

  const handleRemoveCc = (indexToRemove: number) => {
    setCcList(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // PDF Generation & Download Helper
  const handleGenerateAndDownloadPdf = async (): Promise<boolean> => {
    setIsDownloadingPdf(true);
    try {
      let elementId = 'quotation-pdf-canvas';
      if (documentType === 'Invoice') elementId = 'invoice-pdf-canvas';
      if (documentType === 'Balance Invoice') elementId = 'balance-invoice-pdf-canvas';
      if (documentType === 'Payment Receipt') elementId = 'payment-receipt-pdf-canvas';

      let element = window.document.getElementById(elementId);
      if (!element) {
        element = window.document.getElementById(`${elementId}-preview`);
      }

      if (!element) {
        console.warn(`PDF Canvas element #${elementId} not found in DOM.`);
        setIsDownloadingPdf(false);
        return false;
      }

      const opt = {
        margin: 0,
        filename: pdfFilename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      const pdfBlob: Blob = await (html2pdf() as any).set(opt).from(element).outputPdf('blob');

      // Save locally to IndexedDB
      try {
        if (documentType === 'Invoice') await saveInvoicePdf(docItem.id, pdfBlob, pdfFilename);
        else if (documentType === 'Quotation') await saveQuotationPdf(docItem.id, pdfBlob, pdfFilename);
        else if (documentType === 'Balance Invoice') await saveBalanceInvoicePdf(docItem.id, pdfBlob, pdfFilename);
        else await saveLocalDocumentFile(docItem.id, pdfBlob, pdfFilename);
      } catch (err) {
        console.warn('IndexedDB PDF save notice:', err);
      }

      // Trigger browser file download
      const downloadUrl = URL.createObjectURL(pdfBlob);
      const a = window.document.createElement('a');
      a.href = downloadUrl;
      a.download = pdfFilename;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      setIsDownloadingPdf(false);
      return true;
    } catch (err) {
      console.error('PDF generation error:', err);
      setIsDownloadingPdf(false);
      return false;
    }
  };

  // Primary Action: Open Email Client
  const handleOpenEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validate To
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!toEmail.trim() || !emailRegex.test(toEmail.trim())) {
      setErrorMsg('Please enter a valid recipient email.');
      return;
    }

    // 2. Validate CC list
    const invalidCc = ccList.find(c => !emailRegex.test(c.trim()));
    if (invalidCc) {
      setErrorMsg('Please check the CC email addresses.');
      return;
    }

    // 3. Validate Subject
    if (!subject.trim()) {
      setErrorMsg('Please enter a subject.');
      return;
    }

    setErrorMsg('');

    // Clean & Deduplicate CC list
    const finalCc = Array.from(new Set(ccList.map(c => c.trim()).filter(Boolean)))
      .filter(c => c.toLowerCase() !== toEmail.trim().toLowerCase());

    // Save CC list to client profile if checked
    if (saveCcToClient && client?.id) {
      try {
        await updateClient(client.id, { ccEmails: finalCc });
      } catch (err) {
        console.warn('Failed to update client CC emails:', err);
      }
    }

    // Auto-generate & download PDF locally before opening mail app
    await handleGenerateAndDownloadPdf();

    // Build URL-encoded mailto string
    const ccParam = finalCc.length > 0 ? `&cc=${encodeURIComponent(finalCc.join(','))}` : '';
    const mailtoUrl = `mailto:${encodeURIComponent(toEmail.trim())}?subject=${encodeURIComponent(subject.trim())}&body=${encodeURIComponent(message.trim())}${ccParam}`;

    // Open user email application
    window.open(mailtoUrl, '_blank');

    // Log Activity & Email Draft Log
    addEmailLog({
      recipient: toEmail.trim(),
      cc: finalCc.length > 0 ? finalCc.join(', ') : undefined,
      documentType,
      documentNumber: docNumber,
      documentId: docItem.id,
      subject: subject.trim(),
      status: 'Draft Opened'
    });

    if (client) {
      logActivity(
        client.id,
        client.name,
        `${documentType} Email Draft Opened`,
        `Prepared email draft for ${documentType} ${docNumber} to ${toEmail.trim()}`
      );
    }

    setIsDraftOpened(true);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div
            className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-6 font-sans"
            role="dialog"
            aria-modal="true"
            aria-labelledby="compose-email-title"
          >
            {/* Off-screen canvas elements for pdf generator */}
            <div className="hidden" aria-hidden="true">
              {documentType === 'Quotation' && <QuotationPDF quotation={docItem as Quotation} />}
              {documentType === 'Invoice' && <InvoicePDF invoice={docItem as Invoice} />}
              {documentType === 'Balance Invoice' && <BalanceInvoicePDF balanceInvoice={docItem as BalanceInvoice} />}
              {documentType === 'Payment Receipt' && (
                <PaymentReceiptPDF
                  payment={docItem as Payment}
                  client={client}
                  companyProfile={settings.company}
                />
              )}
            </div>

            {/* Viewport fixed semi-transparent backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Viewport Centered Professional Enterprise Card */}
            <motion.div
              ref={modalRef}
              tabIndex={-1}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative z-10 w-full max-w-[680px] max-h-[90vh] bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl shadow-2xl flex flex-col overflow-hidden focus:outline-none"
              onClick={(e) => e.stopPropagation()}
            >
              {/* FIXED HEADER */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#2A2A2A] bg-white dark:bg-[#1A1A1A] flex-shrink-0">
                <div>
                  <h2 id="compose-email-title" className="text-base font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                    Compose {documentType} Email
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium flex items-center space-x-1.5">
                    <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{docNumber}</span>
                    <span>•</span>
                    <span className="font-mono font-bold text-[#E31B23]">₹{docAmountStr}</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#252525] transition"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* SCROLLABLE MIDDLE CONTENT AREA */}
              <form onSubmit={handleOpenEmail} className="flex flex-col flex-grow overflow-hidden">
                <div className="flex-grow overflow-y-auto p-6 space-y-4 text-xs">
                  {/* SENDER: Compact Read-Only Line */}
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center space-x-1.5 py-1 px-3 bg-gray-50 dark:bg-[#222] rounded-lg border border-gray-200/60 dark:border-[#2A2A2A]">
                    <span className="font-bold text-gray-400 uppercase text-[10px]">From:</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100">{settings.company.companyName}</span>
                    <span className="text-gray-500 font-mono text-[11px]">&lt;{settings.company.email}&gt;</span>
                  </div>

                  {errorMsg && (
                    <div className="p-3 bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-200 text-xs font-semibold rounded-xl flex items-center space-x-2 border border-red-200">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* RECIPIENTS SECTION */}
                  <div className="space-y-3 bg-gray-50/60 dark:bg-[#222]/50 p-4 rounded-xl border border-gray-200/70 dark:border-[#2A2A2A]">
                    {/* To Field */}
                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        To
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="client@gmail.com"
                        value={toEmail}
                        onChange={(e) => setToEmail(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#333] rounded-lg focus:ring-1 focus:ring-[#E31B23]"
                      />
                    </div>

                    {/* CC Field Tag Chips */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-gray-700 dark:text-gray-300">
                          CC
                        </label>
                        {client && (
                          <label className="flex items-center space-x-1.5 text-[10px] text-gray-500 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={saveCcToClient}
                              onChange={(e) => setSaveCcToClient(e.target.checked)}
                              className="rounded text-[#E31B23] focus:ring-0"
                            />
                            <span>Save CC list to Client Profile</span>
                          </label>
                        )}
                      </div>

                      {/* CC Tag Chips & Add CC Button */}
                      <div className="flex flex-wrap items-center gap-1.5 p-2 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#333] rounded-lg min-h-[40px]">
                        {ccList.map((ccEmail, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-gray-100 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-md font-semibold text-gray-800 dark:text-gray-200 text-[11px]"
                          >
                            <span>{ccEmail}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveCc(idx)}
                              className="text-gray-400 hover:text-red-600 rounded p-0.5 transition"
                              title="Remove CC address"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}

                        {isAddingCc ? (
                          <div className="flex items-center space-x-1">
                            <input
                              type="email"
                              autoFocus
                              placeholder="cc@example.com"
                              value={newCcInput}
                              onChange={(e) => setNewCcInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddCc();
                                }
                                if (e.key === 'Escape') {
                                  setIsAddingCc(false);
                                }
                              }}
                              className="px-2 py-0.5 text-[11px] bg-gray-50 dark:bg-[#252525] border border-gray-300 dark:border-[#444] rounded outline-none w-48"
                            />
                            <button
                              type="button"
                              onClick={handleAddCc}
                              className="px-2 py-0.5 bg-[#E31B23] text-white font-bold text-[10px] rounded hover:bg-red-700 transition"
                            >
                              Add
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsAddingCc(false)}
                              className="text-gray-400 hover:text-gray-600 p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setIsAddingCc(true)}
                            className="inline-flex items-center space-x-1 px-2 py-0.5 text-xs text-[#E31B23] font-bold hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add CC</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* MESSAGE SECTION */}
                  <div className="space-y-3">
                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        Subject
                      </label>
                      <input
                        type="text"
                        required
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#333] rounded-lg focus:ring-1 focus:ring-[#E31B23]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        Message Body
                      </label>
                      <textarea
                        rows={5}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#333] rounded-lg focus:ring-1 focus:ring-[#E31B23] leading-relaxed resize-none"
                      />
                    </div>
                  </div>

                  {/* DOCUMENT SECTION: Compact Horizontal Card */}
                  <div className="p-3.5 bg-gray-50 dark:bg-[#222] rounded-xl border border-gray-200 dark:border-[#2A2A2A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-red-100 dark:bg-red-950/40 text-[#E31B23] rounded-lg flex-shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-extrabold text-gray-900 dark:text-gray-100 text-xs font-mono">{pdfFilename}</p>
                        <span className="inline-flex items-center space-x-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>PDF Ready</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setIsPreviewOpen(true)}
                        className="px-3 py-1.5 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#333] hover:bg-gray-100 dark:hover:bg-[#333] text-gray-800 dark:text-gray-200 rounded-lg font-bold text-xs flex items-center space-x-1 transition"
                      >
                        <Eye className="w-3.5 h-3.5 text-gray-500" />
                        <span>Preview PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleGenerateAndDownloadPdf}
                        disabled={isDownloadingPdf}
                        className="px-3 py-1.5 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#333] hover:bg-gray-100 dark:hover:bg-[#333] text-gray-800 dark:text-gray-200 rounded-lg font-bold text-xs flex items-center space-x-1 transition"
                      >
                        <Download className="w-3.5 h-3.5 text-[#E31B23]" />
                        <span>{isDownloadingPdf ? 'Downloading...' : 'Download PDF'}</span>
                      </button>
                    </div>
                  </div>

                  {/* HELPER NOTICE */}
                  <div className="p-2.5 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 rounded-lg text-[11px] text-amber-800 dark:text-amber-300 flex items-center space-x-2">
                    <Info className="w-3.5 h-3.5 flex-shrink-0 text-amber-600" />
                    <span>The PDF is ready. Download it and attach it to your email before sending.</span>
                  </div>
                </div>

                {/* STICKY / FIXED FOOTER */}
                <div className="px-6 py-3.5 bg-gray-50 dark:bg-[#222] border-t border-gray-200 dark:border-[#2A2A2A] flex items-center justify-between flex-shrink-0">
                  <div className="text-[11px]">
                    {isDraftOpened ? (
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Email draft opened</span>
                      </span>
                    ) : (
                      <span className="text-gray-400">Pre-fills recipient, subject & body in mail app</span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2.5">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#333] text-gray-700 dark:text-gray-300 rounded-xl font-bold text-xs hover:bg-gray-100 dark:hover:bg-[#333] transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#E31B23] hover:bg-red-700 text-white rounded-xl font-bold text-xs flex items-center space-x-1.5 shadow-md transition"
                    >
                      <span>Open Email</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PDF Document Preview Modal */}
      {isPreviewOpen && (
        <Modal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title={`Preview PDF: ${docNumber}`}
          maxWidth="4xl"
        >
          <div className="space-y-4">
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={handleGenerateAndDownloadPdf}
                className="px-3.5 py-1.5 bg-[#E31B23] hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-xs transition"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
            </div>
            <div className="border border-gray-200 dark:border-[#2A2A2A] rounded-xl overflow-hidden shadow-inner bg-gray-100 dark:bg-[#111] p-4 sm:p-6 max-h-[70vh] overflow-y-auto">
              {documentType === 'Quotation' && <QuotationPDF quotation={docItem as Quotation} />}
              {documentType === 'Invoice' && <InvoicePDF invoice={docItem as Invoice} />}
              {documentType === 'Balance Invoice' && <BalanceInvoicePDF balanceInvoice={docItem as BalanceInvoice} />}
              {documentType === 'Payment Receipt' && (
                <PaymentReceiptPDF
                  payment={docItem as Payment}
                  client={client}
                  companyProfile={settings.company}
                />
              )}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
