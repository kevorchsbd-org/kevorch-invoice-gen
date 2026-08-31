import React from 'react';
import { Payment, Client, CompanyProfile } from '../../types';
import { DynamicTextSection } from '../common/DynamicTextSection';

interface PaymentReceiptPDFProps {
  payment: Payment;
  client?: Client;
  companyProfile: CompanyProfile;
}

export const PaymentReceiptPDF: React.FC<PaymentReceiptPDFProps> = ({
  payment,
  client,
  companyProfile
}) => {
  const receiptNumber = payment.referenceNumber || `PAY-${payment.id.slice(-6).toUpperCase()}`;

  return (
    <div id="payment-receipt-pdf-canvas" className="printable-area bg-white text-black p-8 max-w-[800px] mx-auto border border-gray-200 rounded-none shadow-none font-sans text-xs">
      {/* Header Accent Bar */}
      <div className="h-3 bg-[#E31B23] -mx-8 -mt-8 mb-6"></div>

      {/* Top Header */}
      <div className="grid grid-cols-2 gap-8 border-b border-gray-300 pb-6 mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-[#E31B23] tracking-tight">{companyProfile.companyName}</h1>
          <p className="text-[11px] text-gray-600 mt-1">{companyProfile.address}, {companyProfile.city}, {companyProfile.state} - {companyProfile.pincode}</p>
          <p className="text-[11px] text-gray-600">
            Email: {companyProfile.email}
            {companyProfile.email && (companyProfile.phone || companyProfile.phone2) ? ' | ' : ''}
            {companyProfile.phone ? `Phone: ${companyProfile.phone}` : ''}
            {companyProfile.phone && companyProfile.phone2?.trim() ? ` / ${companyProfile.phone2.trim()}` : !companyProfile.phone && companyProfile.phone2?.trim() ? `Phone: ${companyProfile.phone2.trim()}` : ''}
          </p>
        </div>

        <div className="text-right">
          <h2 className="text-2xl font-black text-gray-900 tracking-wider uppercase">Official Payment Receipt</h2>
          <p className="text-xs font-bold text-gray-700 mt-1">Receipt #: <span className="font-mono text-gray-900">{receiptNumber}</span></p>
          <p className="text-xs text-gray-500">Date: {payment.paymentDate}</p>
        </div>
      </div>

      {/* Recipient & Payment Breakdown Card */}
      <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
        <div>
          <span className="text-[10px] uppercase font-extrabold text-gray-500">Received From:</span>
          <p className="text-sm font-bold text-gray-900 mt-0.5">{payment.clientName}</p>
          {client && (
            <p className="text-xs text-gray-600 mt-0.5">{client.companyName} | {client.mobile} | {client.email}</p>
          )}
        </div>

        <div className="text-right space-y-1">
          <div>
            <span className="text-[10px] uppercase font-extrabold text-gray-500">Invoice Reference:</span>
            <p className="text-xs font-bold text-gray-900">{payment.invoiceNumber}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-extrabold text-gray-500">Payment Method:</span>
            <p className="text-xs font-bold text-gray-900">{payment.paymentMethod}</p>
          </div>
          {payment.referenceNumber && (
            <div>
              <span className="text-[10px] uppercase font-extrabold text-gray-500">Transaction Ref:</span>
              <p className="text-xs font-mono font-bold text-gray-800">{payment.referenceNumber}</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Amount Box */}
      <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-center mb-6">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Amount Received with Thanks</span>
        <h3 className="text-3xl font-black text-emerald-700 mt-1 font-mono">₹{payment.amount.toLocaleString('en-IN')}</h3>
      </div>

      {payment.note && (
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 mb-6 h-auto">
          <DynamicTextSection
            title="PAYMENT NOTE:"
            content={payment.note}
            titleClassName="text-[10px] uppercase font-bold text-gray-500 mb-1"
            contentClassName="text-xs text-gray-700 whitespace-pre-wrap break-words leading-relaxed [overflow-wrap:anywhere]"
          />
        </div>
      )}

      {/* Footer Acknowledgement */}
      <div className="pt-8 border-t border-gray-300 flex justify-between items-end">
        <div>
          <p className="text-[10px] text-gray-400">This is a computer-generated official receipt.</p>
          <p className="text-[10px] text-gray-400">Thank you for your business!</p>
        </div>
        <div className="text-right">
          <div className="h-10"></div>
          <p className="text-xs font-bold text-gray-900 border-t border-gray-400 pt-1 px-4 inline-block">Authorized Signatory</p>
          <p className="text-[10px] text-gray-500">{companyProfile.companyName}</p>
        </div>
      </div>
    </div>
  );
};
