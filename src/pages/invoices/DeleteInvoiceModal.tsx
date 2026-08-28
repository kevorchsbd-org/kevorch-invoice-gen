import React, { useState } from 'react';
import { Invoice } from '../../types';
import { useData } from '../../context/DataContext';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';

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
  const [error, setError] = useState<string | null>(null);

  if (!invoice) return null;

  // Check if invoice has payments recorded
  const hasPayments = payments.some(p => p.invoiceId === invoice.id) || invoice.paidAmount > 0;

  const warningMessage = hasPayments
    ? "This invoice has recorded payments. Deleting it may affect payment history and balance calculations."
    : "This action cannot be undone.";

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await deleteInvoice(invoice.id);
      setIsDeleting(false);
      onClose();
      if (onSuccess) {
        onSuccess(invoice.invoiceNumber);
      }
    } catch (err: any) {
      setIsDeleting(false);
      setError(err.message || "Failed to delete invoice. Please try again.");
    }
  };

  return (
    <ConfirmationModal
      open={isOpen}
      title="Delete Invoice?"
      recordLabel={invoice.invoiceNumber}
      description="Are you sure you want to delete invoice"
      warning={warningMessage}
      confirmText="Delete Invoice"
      cancelText="Cancel"
      loading={isDeleting}
      error={error}
      onConfirm={handleDelete}
      onCancel={() => {
        setError(null);
        onClose();
      }}
    />
  );
};
