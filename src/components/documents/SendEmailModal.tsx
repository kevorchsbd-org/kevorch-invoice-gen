import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quotation, Invoice, BalanceInvoice, Payment, Client } from '../../types';
import { useData } from '../../context/DataContext';
import { Modal } from '../common/Modal';
import {
  FileText, CheckCircle2, AlertCircle, Download, ExternalLink,
  X, Info, Eye
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
  const [saveCcToClient, setSaveCcToClient] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isDraftOpened, setIsDraftOpened] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);

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
      setShowSaveConfirmModal(false);

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

      let phoneDisplay = settings.company.phone || '';
      if (settings.company.phone2?.trim()) {
        phoneDisplay = phoneDisplay ? `${phoneDisplay} / ${settings.company.phone2.trim()}` : settings.company.phone2.trim();
      }

      bodyText += `\n\nIf you have any questions or require assistance, please contact us at ${settings.company.email}${phoneDisplay ? ` or ${phoneDisplay}` : ''}.\n\nBest regards,\n${settings.company.companyName}`;

      setMessage(bodyText);
    }
  }, [isOpen, docItem, documentType, docNumber, docAmountStr, client, clientName, settings]);

  // CC Tag Logic (Automatic Chip Addition without an Add button)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const tryAddCcTag = (input: string): boolean => {
    const emailToAdd = input.trim();
    if (!emailToAdd) return false;

    if (!emailRegex.test(emailToAdd)) {
      setErrorMsg(`Invalid CC email format: "${emailToAdd}"`);
      return false;
    }

    if (emailToAdd.toLowerCase() === toEmail.trim().toLowerCase()) {
      setErrorMsg('CC email cannot be the same as the primary recipient To email.');
      return false;
    }

    if (ccList.some(c => c.toLowerCase() === emailToAdd.toLowerCase())) {
      setErrorMsg(`CC email "${emailToAdd}" is already added.`);
      return false;
    }

    setCcList(prev => [...prev, emailToAdd]);
    setNewCcInput('');
    setErrorMsg('');
    return true;
  };

  const handleCcInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.includes(',')) {
      const parts = val.split(',');
      for (let i = 0; i < parts.length - 1; i++) {
        tryAddCcTag(parts[i]);
      }
      setNewCcInput(parts[parts.length - 1]);
    } else {
      setNewCcInput(val);
      setErrorMsg('');
    }
  };

  const handleCcKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (newCcInput.trim()) {
        tryAddCcTag(newCcInput);
      }
    } else if (e.key === 'Tab') {
      if (newCcInput.trim()) {
        const added = tryAddCcTag(newCcInput);
        if (!added) {
          e.preventDefault();
        }
      }
    }
  };

  const handleCcBlur = () => {
    if (newCcInput.trim()) {
      tryAddCcTag(newCcInput);
    }
  };

  const handleRemoveCc = (indexToRemove: number) => {
    setCcList(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Helper to generate PDF Blob canvas
  const generatePdfBlob = async (): Promise<Blob | null> => {
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
      return null;
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

    return pdfBlob;
  };

  // Execute PDF Save with File System Access API (showSaveFilePicker) & fallback
  const executeSavePdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const pdfBlob = await generatePdfBlob();
      if (!pdfBlob) {
        setErrorMsg('Could not render document canvas for download.');
        setIsDownloadingPdf(false);
        return;
      }

      // 1. Preferred File System Access API
      if ('showSaveFilePicker' in window) {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: pdfFilename,
            types: [
              {
                description: 'PDF Document',
                accept: { 'application/pdf': ['.pdf'] }
              }
            ]
          });
          const writable = await handle.createWritable();
          await writable.write(pdfBlob);
          await writable.close();
          setIsDownloadingPdf(false);
          setShowSaveConfirmModal(false);
          return;
        } catch (err: any) {
          if (err.name === 'AbortError') {
            // User cancelled save dialog
            setIsDownloadingPdf(false);
            return;
          }
          console.warn('showSaveFilePicker failed, falling back to Blob download:', err);
        }
      }

      // 2. Standard Blob URL fallback download
      const downloadUrl = URL.createObjectURL(pdfBlob);
      const a = window.document.createElement('a');
      a.href = downloadUrl;
      a.download = pdfFilename;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      setIsDownloadingPdf(false);
      setShowSaveConfirmModal(false);
    } catch (err) {
      console.error('PDF Save error:', err);
      setIsDownloadingPdf(false);
    }
  };

  // Primary Action: Open Email Client Draft
  const handleOpenEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newCcInput.trim()) {
      tryAddCcTag(newCcInput);
    }

    // 1. Validate To
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

    // Show Confirmation Modal to ask if user wants to download/save PDF
    setShowSaveConfirmModal(true);
  };

  // Helper to parse message and highlight clickable email and phone links
  const renderMessageWithClickableContacts = (text: string) => {
    const lines = text.split('\n');
    const combinedRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})|(\+?\d{1,4}[-.\s]?\(?\d{2,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{3,5})/g;

    return lines.map((line, lIdx) => {
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      combinedRegex.lastIndex = 0;

      while ((match = combinedRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }
        const matchedText = match[0];
        if (match[1]) {
          // Email match
          parts.push(
            <a
              key={`email-${lIdx}-${match.index}`}
              href={`mailto:${matchedText}`}
              className="text-blue-600 dark:text-blue-400 font-semibold underline hover:text-blue-800 transition"
              title={`Compose email to ${matchedText}`}
            >
              {matchedText}
            </a>
          );
        } else if (match[2] && matchedText.replace(/\D/g, '').length >= 7) {
          // Phone match
          const cleanPhone = matchedText.replace(/[^\d+]/g, '');
          parts.push(
            <a
              key={`phone-${lIdx}-${match.index}`}
              href={`tel:${cleanPhone}`}
              className="text-[#E31B23] dark:text-red-400 font-bold underline hover:text-red-700 transition"
              title={`Call ${matchedText}`}
            >
              {matchedText}
            </a>
          );
        } else {
          parts.push(matchedText);
        }
        lastIndex = combinedRegex.lastIndex;
      }

      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }

      return (
        <div key={lIdx} className="min-h-[1.25rem]">
          {parts.length > 0 ? parts : line}
        </div>
      );
    });
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
                        To *
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

                    {/* CC Field Tag Chips (Automatic CC Addition) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-gray-700 dark:text-gray-300">
                          CC (Automatic Tags)
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

                      {/* CC Chips Container with Inline Input */}
                      <div className="flex flex-wrap items-center gap-1.5 p-2 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#333] rounded-lg min-h-[42px]">
                        {ccList.map((ccEmail, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-md font-semibold text-gray-800 dark:text-gray-200 text-[11px]"
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

                        <input
                          type="email"
                          placeholder={ccList.length === 0 ? "Type CC email and press Enter or comma..." : "Add another CC email..."}
                          value={newCcInput}
                          onChange={handleCcInputChange}
                          onKeyDown={handleCcKeyDown}
                          onBlur={handleCcBlur}
                          className="flex-grow min-w-[200px] px-2 py-1 text-xs bg-transparent border-none outline-none focus:ring-0 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">
                        Type an email address and press Enter, comma, or Tab to add it automatically.
                      </p>
                    </div>
                  </div>

                  {/* MESSAGE SECTION */}
                  <div className="space-y-3">
                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        Subject *
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
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#333] rounded-lg focus:ring-1 focus:ring-[#E31B23] leading-relaxed resize-y min-h-[100px]"
                      />
                    </div>

                    {/* Interactive Message Body Contact Highlight Preview */}
                    <div className="p-3.5 bg-gray-50/80 dark:bg-[#222]/60 rounded-xl border border-gray-200/80 dark:border-[#2A2A2A] space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-gray-700 dark:text-gray-300">
                        <span>Message Preview &amp; Contact Links</span>
                        <span className="text-gray-400 text-[10px] font-normal">Click phone/email to trigger dialer or mail app</span>
                      </div>
                      <div className="p-3 bg-white dark:bg-[#1A1A1A] rounded-lg border border-gray-200 dark:border-[#333] text-xs leading-relaxed text-gray-800 dark:text-gray-200 font-sans shadow-xs">
                        {renderMessageWithClickableContacts(message)}
                      </div>
                    </div>
                  </div>

                  {/* DOCUMENT SECTION: Compact Card */}
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
                        onClick={executeSavePdf}
                        disabled={isDownloadingPdf}
                        className="px-3 py-1.5 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#333] hover:bg-gray-100 dark:hover:bg-[#333] text-gray-800 dark:text-gray-200 rounded-lg font-bold text-xs flex items-center space-x-1 transition"
                      >
                        <Download className="w-3.5 h-3.5 text-[#E31B23]" />
                        <span>{isDownloadingPdf ? 'Saving...' : 'Save PDF'}</span>
                      </button>
                    </div>
                  </div>

                  {/* HELPER NOTICE */}
                  <div className="p-2.5 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 rounded-lg text-[11px] text-amber-800 dark:text-amber-300 flex items-center space-x-2">
                    <Info className="w-3.5 h-3.5 flex-shrink-0 text-amber-600" />
                    <span>Opening your mail draft will ask if you want to save a copy of the PDF document.</span>
                  </div>
                </div>

                {/* STICKY FOOTER */}
                <div className="px-6 py-3.5 bg-gray-50 dark:bg-[#222] border-t border-gray-200 dark:border-[#2A2A2A] flex items-center justify-between flex-shrink-0">
                  <div className="text-[11px]">
                    {isDraftOpened ? (
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Email draft opened in mail app</span>
                      </span>
                    ) : (
                      <span className="text-gray-400">Pre-fills recipient, subject &amp; message in mail app</span>
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
                      <span>Open Email Draft</span>
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
                onClick={executeSavePdf}
                disabled={isDownloadingPdf}
                className="px-3.5 py-1.5 bg-[#E31B23] hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-xs transition"
              >
                <Download className="w-4 h-4" />
                <span>{isDownloadingPdf ? 'Saving...' : 'Save PDF'}</span>
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

      {/* Save PDF Confirmation Modal */}
      {showSaveConfirmModal && (
        <Modal
          isOpen={showSaveConfirmModal}
          onClose={() => setShowSaveConfirmModal(false)}
          title="Save Document Copy?"
          maxWidth="md"
        >
          <div className="space-y-4 text-xs font-sans p-1">
            <div className="flex items-start space-x-3 bg-red-50 dark:bg-red-950/30 p-3.5 rounded-xl border border-red-200 dark:border-red-900/40">
              <Download className="w-5 h-5 text-[#E31B23] flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-extrabold text-gray-900 dark:text-gray-100 text-sm">
                  Save a copy of {docNumber}?
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                  Your email draft has been opened in your email client. Would you like to save/download a copy of the generated PDF document (<span className="font-mono font-bold text-gray-900 dark:text-gray-100">{pdfFilename}</span>)?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSaveConfirmModal(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-[#252525] border border-gray-200 dark:border-[#333] text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-[#333] transition"
              >
                No, Skip Download
              </button>
              <button
                type="button"
                onClick={executeSavePdf}
                disabled={isDownloadingPdf}
                className="px-5 py-2 bg-[#E31B23] hover:bg-red-700 text-white font-bold rounded-xl flex items-center space-x-1.5 shadow-md transition"
              >
                <Download className="w-4 h-4" />
                <span>{isDownloadingPdf ? 'Saving...' : 'Yes, Save PDF'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
