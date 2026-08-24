import React, { useState, useEffect } from 'react';
import { Quotation, Invoice, BalanceInvoice } from '../../types';
import { useData } from '../../context/DataContext';
import { Modal } from '../common/Modal';
import { Send, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Quotation | Invoice | BalanceInvoice;
  documentType: 'Quotation' | 'Invoice' | 'Balance Invoice';
}

export const SendEmailModal: React.FC<SendEmailModalProps> = ({
  isOpen,
  onClose,
  document,
  documentType
}) => {
  const { addEmailLog, logActivity, settings } = useData();

  const docNumber = 'quotationNumber' in document
    ? document.quotationNumber
    : 'invoiceNumber' in document
    ? document.invoiceNumber
    : document.balanceInvoiceNumber;

  const [toEmail, setToEmail] = useState('');
  const [ccEmail, setCcEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (document && document.client) {
      setToEmail(document.client.email || '');
      const docAmount = 'totalAmount' in document ? document.totalAmount : document.balanceAmountDue;
      setMessage(
        `Dear ${document.client.name},\n\nPlease find attached ${documentType} (${docNumber}) for your reference.\n\nTotal Amount: ₹${docAmount ? docAmount.toLocaleString('en-IN') : '0'}\n\nIf you have any questions or require further assistance, please feel free to reach out to us at ${settings.company.email} or ${settings.company.phone}.\n\nBest regards,\n${settings.company.companyName}`
      );
    }
  }, [document, documentType, docNumber, settings]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!toEmail) {
      setErrorMsg('Please enter a recipient email address.');
      return;
    }

    setSending(true);
    setErrorMsg('');

    // Simulate serverless Resend/Brevo dispatch & log record
    setTimeout(() => {
      addEmailLog({
        recipient: toEmail,
        cc: ccEmail || undefined,
        documentType,
        documentNumber: docNumber,
        documentId: document.id,
        subject,
        status: 'Sent'
      });

      logActivity(
        document.clientId,
        document.client.name,
        `${documentType} Emailed`,
        `Sent ${documentType} ${docNumber} to ${toEmail}`
      );

      setSending(false);
      setSentSuccess(true);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });

      setTimeout(() => {
        setSentSuccess(false);
        onClose();
      }, 2000);
    }, 1200);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Email ${documentType} (${docNumber})`} maxWidth="lg">
      {sentSuccess ? (
        <div className="py-8 text-center space-y-3">
          <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Email Dispatched Successfully!</h3>
          <p className="text-xs text-gray-500">
            {documentType} {docNumber} sent to <span className="font-bold text-gray-800 dark:text-gray-200">{toEmail}</span>. Log entry recorded.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSend} className="space-y-4 text-xs">
          {/* Sender Banner */}
          <div className="bg-red-50 dark:bg-red-950/30 p-3 rounded-xl border border-red-100 dark:border-red-900/40 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400">Sender:</span>
              <p className="font-bold text-gray-900 dark:text-gray-100">{settings.company.companyName} &lt;{settings.company.email}&gt;</p>
            </div>
            <span className="text-[10px] font-bold text-[#E31B23] bg-white dark:bg-[#1A1A1A] px-2 py-1 rounded border border-red-200">
              Verified Sender
            </span>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-100 text-red-800 text-xs font-semibold rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
              To (Recipient Email) *
            </label>
            <input
              type="email"
              required
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-lg focus:ring-1 focus:ring-[#E31B23] focus:border-[#E31B23]"
            />
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
              CC (Optional)
            </label>
            <input
              type="email"
              placeholder="billing@example.com"
              value={ccEmail}
              onChange={(e) => setCcEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-lg focus:ring-1 focus:ring-[#E31B23] focus:border-[#E31B23]"
            />
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
              Subject *
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-lg focus:ring-1 focus:ring-[#E31B23] focus:border-[#E31B23]"
            />
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
              Message Body
            </label>
            <textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-lg focus:ring-1 focus:ring-[#E31B23] focus:border-[#E31B23] leading-relaxed"
            />
          </div>

          {/* Attachment Preview Card */}
          <div className="flex items-center space-x-3 p-3 bg-gray-100 dark:bg-[#222] rounded-xl border border-gray-200 dark:border-[#333]">
            <FileText className="w-6 h-6 text-[#E31B23]" />
            <div>
              <p className="font-bold text-gray-800 dark:text-gray-200">{docNumber}_KEVORCH_SBD.pdf</p>
              <p className="text-[10px] text-gray-500">Auto-generated PDF document attachment</p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100 dark:border-[#2A2A2A]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 dark:bg-[#252525] text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-[#333]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="px-5 py-2 bg-[#E31B23] hover:bg-red-700 text-white rounded-xl font-bold flex items-center space-x-2 shadow-md transition"
            >
              <Send className="w-4 h-4" />
              <span>{sending ? 'Sending Email...' : 'Send Email Now'}</span>
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
