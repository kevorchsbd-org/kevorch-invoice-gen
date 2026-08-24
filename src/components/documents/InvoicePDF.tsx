import React from 'react';
import { Invoice } from '../../types';

interface DocumentProps {
  invoice: Invoice;
}

export const InvoicePDF: React.FC<DocumentProps> = ({ invoice }) => {
  const {
    client, items, totalAmount, paidAmount, balanceAmount, paymentStatus,
    fromDetails, invoiceNumber, invoiceDate, dueDate, paymentTerms, notes, termsAndConditions
  } = invoice;

  return (
    <div id="invoice-pdf-canvas" className="printable-area bg-white text-gray-900 p-8 max-w-[800px] mx-auto border border-gray-200 rounded-none shadow-none font-sans text-xs">
      {/* Top Red Header Accent Bar */}
      <div className="h-3 bg-[#E31B23] -mx-8 -mt-8 mb-6"></div>

      {/* Header Block: Logo & Title */}
      <div className="flex justify-between items-start border-b border-gray-200 pb-6 mb-6">
        <div className="flex items-center space-x-4">
          {fromDetails.logoUrl ? (
            <img src={fromDetails.logoUrl} alt="Company Logo" className="h-14 w-auto object-contain rounded" />
          ) : (
            <div className="w-12 h-12 bg-[#E31B23] text-white font-extrabold flex items-center justify-center text-xl rounded">
              K
            </div>
          )}
          <div>
            <h1 className="text-xl font-extrabold text-[#E31B23] tracking-wide uppercase">{fromDetails.companyName}</h1>
            <p className="text-[11px] text-gray-600">{fromDetails.address}, {fromDetails.city}, {fromDetails.state} - {fromDetails.pincode}</p>
            <p className="text-[11px] text-gray-600">Email: {fromDetails.email} | Phone: {fromDetails.phone}</p>
          </div>
        </div>

        <div className="text-right">
          <span className="inline-block bg-red-50 text-[#E31B23] text-xs font-black uppercase px-3 py-1 rounded border border-red-200 mb-2">
            INVOICE
          </span>
          <p className="font-extrabold text-sm text-gray-900">{invoiceNumber}</p>
          <p className="text-gray-500 text-[11px]">Date: <span className="font-semibold text-gray-800">{invoiceDate}</span></p>
          <p className="text-gray-500 text-[11px]">Due Date: <span className="font-semibold text-gray-800">{dueDate}</span></p>
        </div>
      </div>

      {/* From & To Section */}
      <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg border border-gray-100 mb-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#E31B23] mb-1">INVOICE TO:</p>
          <h3 className="font-bold text-sm text-gray-900">{client.name}</h3>
          <p className="font-semibold text-xs text-gray-700">{client.companyName}</p>
          <p className="text-gray-600 text-[11px] mt-1">{client.address}</p>
          <p className="text-gray-600 text-[11px]">{client.city}, {client.state} - {client.pincode}</p>
          <p className="text-gray-600 text-[11px]">Phone: {client.mobile}</p>
          <p className="text-gray-600 text-[11px]">Email: {client.email}</p>
        </div>

        <div className="border-l border-gray-200 pl-6 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">PAYMENT STATUS & TERMS:</p>
            <div className="mb-2">
              <span className={`inline-block px-2.5 py-0.5 text-[11px] font-bold uppercase rounded ${
                paymentStatus === 'fully_paid' ? 'bg-emerald-100 text-emerald-800' :
                paymentStatus === 'partially_paid' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
              }`}>
                {paymentStatus === 'fully_paid' ? 'FULLY PAID' : paymentStatus === 'partially_paid' ? 'PARTIALLY PAID' : 'UNPAID'}
              </span>
            </div>
            <p className="text-gray-800 text-[11px] font-medium leading-relaxed">{paymentTerms || "Standard payment terms apply"}</p>
          </div>
          {client.logoUrl && (
            <div className="mt-2 text-right">
              <img src={client.logoUrl} alt="Client Logo" className="h-10 w-auto object-contain inline-block opacity-90" />
            </div>
          )}
        </div>
      </div>

      {/* Service Items Table */}
      <div className="mb-6">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#E31B23] text-white font-bold text-[11px] uppercase">
              <th className="py-2.5 px-3 w-10 text-center rounded-tl">#</th>
              <th className="py-2.5 px-3">Service Name & Description</th>
              <th className="py-2.5 px-3 text-right w-36 rounded-tr">Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 border-b border-gray-200">
            {items.map((item, idx) => (
              <tr key={item.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                <td className="py-3 px-3 text-center text-gray-400 font-semibold">{idx + 1}</td>
                <td className="py-3 px-3">
                  <p className="font-bold text-gray-900">{item.serviceName}</p>
                  {item.description && <p className="text-gray-600 text-[11px] mt-0.5 whitespace-pre-line">{item.description}</p>}
                </td>
                <td className="py-3 px-3 text-right font-extrabold text-gray-900">
                  ₹{Number(item.amount).toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payment Summary Block */}
      <div className="flex justify-end mb-6">
        <div className="w-72 bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2 text-xs">
          <div className="flex justify-between items-center text-gray-600">
            <span>Total Invoice Amount:</span>
            <span className="font-bold text-gray-900">₹{totalAmount.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between items-center text-emerald-700">
            <span>Amount Received / Paid:</span>
            <span className="font-bold">₹{paidAmount.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between items-center text-sm font-extrabold border-t pt-2 border-gray-300">
            <span className="text-gray-900">Balance Amount Due:</span>
            <span className="text-[#E31B23] text-base">₹{balanceAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Notes & Terms */}
      <div className="grid grid-cols-2 gap-6 text-[10px] text-gray-600 border-t border-gray-200 pt-4 mb-8">
        <div>
          <p className="font-bold text-gray-900 text-xs mb-1 uppercase tracking-wider">NOTES / PAYMENT INSTRUCTIONS:</p>
          <p className="whitespace-pre-line leading-relaxed">{notes || 'N/A'}</p>
        </div>
        <div>
          <p className="font-bold text-gray-900 text-xs mb-1 uppercase tracking-wider">TERMS & CONDITIONS:</p>
          <p className="whitespace-pre-line leading-relaxed">{termsAndConditions || 'N/A'}</p>
        </div>
      </div>

      {/* Signature Section */}
      <div className="flex justify-between items-end border-t border-gray-200 pt-6">
        <div>
          <p className="text-[10px] text-gray-400">Computer generated document for KEVORCH SBD.</p>
        </div>
        <div className="text-center">
          {fromDetails.signatureUrl ? (
            <img src={fromDetails.signatureUrl} alt="Authorized Signature" className="h-12 w-auto mx-auto mb-1 object-contain" />
          ) : (
            <div className="h-10 w-32 border-b border-gray-400 mx-auto mb-1"></div>
          )}
          <p className="font-bold text-gray-900 text-xs">{fromDetails.companyName}</p>
          <p className="text-[10px] text-gray-500 font-semibold">Authorized Signatory</p>
        </div>
      </div>
    </div>
  );
};
