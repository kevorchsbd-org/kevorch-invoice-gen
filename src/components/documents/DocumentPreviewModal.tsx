import React, { useState } from 'react';
import { Quotation, Invoice, BalanceInvoice } from '../../types';
import { QuotationPDF } from './QuotationPDF';
import { InvoicePDF } from './InvoicePDF';
import { BalanceInvoicePDF } from './BalanceInvoicePDF';
import { SendEmailModal } from './SendEmailModal';
import { Modal } from '../common/Modal';
import { Printer, Download, Mail, CheckCircle2 } from 'lucide-react';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Quotation | Invoice | BalanceInvoice | null;
  documentType: 'Quotation' | 'Invoice' | 'Balance Invoice';
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  document: docItem,
  documentType
}) => {
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!docItem) return null;

  const docNumber = 'quotationNumber' in docItem
    ? docItem.quotationNumber
    : 'invoiceNumber' in docItem
    ? docItem.invoiceNumber
    : docItem.balanceInvoiceNumber;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    setDownloading(true);
    let elementId = 'quotation-pdf-canvas';
    if (documentType === 'Invoice') elementId = 'invoice-pdf-canvas';
    if (documentType === 'Balance Invoice') elementId = 'balance-invoice-pdf-canvas';

    const element = window.document.getElementById(elementId);
    if (!element) {
      setDownloading(false);
      return;
    }

    const opt = {
      margin: 0,
      filename: `${docNumber}_KEVORCH_SBD.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    (html2pdf() as any).set(opt).from(element).save().then(() => {
      setDownloading(false);
      setSuccessMessage('PDF Downloaded successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    }).catch(() => {
      setDownloading(false);
    });
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`Preview ${documentType}: ${docNumber}`} maxWidth="4xl">
        <div className="space-y-4">
          {/* Action Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 dark:bg-[#222] p-3 rounded-xl border border-gray-200 dark:border-[#2A2A2A] no-print">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Recipient: <span className="text-[#E31B23] font-bold">{docItem.client.email}</span>
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 bg-white dark:bg-[#2A2A2A] text-gray-700 dark:text-gray-200 hover:bg-gray-100 text-xs font-bold rounded-lg border border-gray-200 dark:border-[#333] flex items-center space-x-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>

              <button
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="px-3 py-1.5 bg-white dark:bg-[#2A2A2A] text-gray-700 dark:text-gray-200 hover:bg-gray-100 text-xs font-bold rounded-lg border border-gray-200 dark:border-[#333] flex items-center space-x-1.5 transition"
              >
                <Download className="w-3.5 h-3.5 text-[#E31B23]" />
                <span>{downloading ? 'Exporting...' : 'Download PDF'}</span>
              </button>

              <button
                onClick={() => setIsEmailModalOpen(true)}
                className="px-3 py-1.5 bg-[#E31B23] hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1.5 transition"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Send Email</span>
              </button>
            </div>
          </div>

          {successMessage && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Printable Document Body */}
          <div className="border border-gray-200 dark:border-[#2A2A2A] rounded-xl overflow-hidden shadow-inner bg-gray-100 dark:bg-[#111] p-4 sm:p-6">
            {documentType === 'Quotation' && <QuotationPDF quotation={docItem as Quotation} />}
            {documentType === 'Invoice' && <InvoicePDF invoice={docItem as Invoice} />}
            {documentType === 'Balance Invoice' && <BalanceInvoicePDF balanceInvoice={docItem as BalanceInvoice} />}
          </div>
        </div>
      </Modal>

      {/* Send Email Modal */}
      <SendEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        document={docItem}
        documentType={documentType}
      />
    </>
  );
};
