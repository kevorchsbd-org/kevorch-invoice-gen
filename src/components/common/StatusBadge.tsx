import React from 'react';
import { PaymentStatus, QuotationStatus, InvoiceStatus, BalanceInvoiceStatus } from '../../types';

interface StatusBadgeProps {
  status: PaymentStatus | QuotationStatus | InvoiceStatus | BalanceInvoiceStatus | string;
  type?: 'payment' | 'quotation' | 'invoice' | 'balance';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'payment' }) => {
  let badgeStyles = 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  let label = status;

  if (type === 'payment' || status === 'unpaid' || status === 'partially_paid' || status === 'fully_paid') {
    switch (status) {
      case 'fully_paid':
      case 'paid':
        badgeStyles = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50';
        label = 'Fully Paid';
        break;
      case 'partially_paid':
        badgeStyles = 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50';
        label = 'Partially Paid';
        break;
      case 'unpaid':
        badgeStyles = 'bg-red-50 text-[#E31B23] dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/50';
        label = 'Unpaid';
        break;
      default:
        break;
    }
  }

  if (type === 'quotation') {
    switch (status) {
      case 'converted':
        badgeStyles = 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50';
        label = 'Converted to Invoice';
        break;
      case 'sent':
        badgeStyles = 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50';
        label = 'Sent';
        break;
      case 'draft':
        badgeStyles = 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700';
        label = 'Draft';
        break;
      case 'expired':
        badgeStyles = 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50';
        label = 'Expired';
        break;
    }
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${badgeStyles}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80" />
      {label}
    </span>
  );
};
