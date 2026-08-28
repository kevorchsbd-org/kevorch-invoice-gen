import React, { useState, useEffect, useRef } from 'react';
import { Invoice } from '../../types';
import { useData } from '../../context/DataContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertTriangle, AlertCircle, X } from 'lucide-react';

interface DeleteInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onSuccess?: (invoiceNumber: string) => void;
}

export const DeleteInvoiceModal: React.FC<DeleteInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onSuccess
}) => {
  const { deleteInvoice, payments } = useData();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Check if invoice has payments recorded
  const hasPayments = invoice
    ? (payments.some(p => p.invoiceId === invoice.id) || invoice.paidAmount > 0)
    : false;

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      setError('');
      setIsDeleting(false);

      const timer = setTimeout(() => {
        modalRef.current?.focus();
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !isDeleting) {
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
  }, [isOpen, isDeleting, onClose]);

  if (!invoice) return null;

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    setError('');

    try {
      await deleteInvoice(invoice.id);
      setIsDeleting(false);
      onClose();
      if (onSuccess) {
        onSuccess(invoice.invoiceNumber);
      }
    } catch (err: any) {
      setIsDeleting(false);
      setError(err.message || 'Failed to delete invoice. Please try again.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 font-sans"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-invoice-title"
          aria-describedby="delete-invoice-desc"
        >
          {/* Full-screen semi-transparent backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => !isDeleting && onClose()}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Centered Modal Card */}
          <motion.div
            ref={modalRef}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative z-10 w-full max-w-md bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-3xl shadow-2xl overflow-hidden focus:outline-none p-6 text-center space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              disabled={isDeleting}
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#252525] transition disabled:opacity-50"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Trash Icon Entrance Animation */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: [0, 1.2, 1], rotate: 0 }}
              transition={{ duration: 0.4, ease: 'backOut' }}
              className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-950/40 text-[#E31B23] rounded-2xl flex items-center justify-center shadow-inner"
            >
              <Trash2 className="w-8 h-8" />
            </motion.div>

            {/* Title & Message */}
            <div className="space-y-2">
              <h2 id="delete-invoice-title" className="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                Delete Invoice?
              </h2>

              <p id="delete-invoice-desc" className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                Are you sure you want to delete invoice{' '}
                <span className="font-mono font-black text-[#E31B23] bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-md border border-red-200 dark:border-red-900/40 inline-block mx-0.5">
                  {invoice.invoiceNumber}
                </span>
                ?
              </p>
              <p className="text-[11px] font-bold text-gray-400">
                This action cannot be undone.
              </p>
            </div>

            {/* Recorded Payments Warning Banner */}
            {hasPayments && (
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl text-left flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    Recorded Payments Warning
                  </span>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                    This invoice has recorded payments. Deleting it may affect payment history and balance calculations.
                  </p>
                </div>
              </div>
            )}

            {/* Inline Error Message */}
            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-200 text-xs font-semibold rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-[#E31B23] flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={onClose}
                className="w-1/2 py-2.5 bg-gray-100 dark:bg-[#252525] hover:bg-gray-200 dark:hover:bg-[#333] text-gray-700 dark:text-gray-300 font-bold rounded-xl text-xs transition disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="w-1/2 py-2.5 bg-[#E31B23] hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-lg transition flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Invoice</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
