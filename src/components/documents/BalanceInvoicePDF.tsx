import React, { useState, useEffect } from 'react';
import { BalanceInvoice } from '../../types';
import { getClientAsset, revokeObjectUrl } from '../../lib/indexedDb';

interface DocumentProps {
  balanceInvoice: BalanceInvoice;
}

export const BalanceInvoicePDF: React.FC<DocumentProps> = ({ balanceInvoice }) => {
  const {
    client,
    items,
    originalInvoiceNumber,
    originalInvoiceAmount,
    amountAlreadyPaid,
    balanceAmountDue,
    fromDetails,
    balanceInvoiceNumber,
    date,
    dueDate,
    paymentTerms,
    notes,
    termsAndConditions,
    clientLogoUrl
  } = balanceInvoice;

  const [activeClientLogo, setActiveClientLogo] = useState<string | null>(clientLogoUrl || client?.logoUrl || null);
  const [logoFailed, setLogoFailed] = useState<boolean>(false);

  useEffect(() => {
    setLogoFailed(false);
    let createdUrl: string | null = null;

    const resolveClientLogo = async () => {
      if (client?.id) {
        try {
          const asset = await getClientAsset(client.id);
          if (asset?.url) {
            createdUrl = asset.url;
            setActiveClientLogo(asset.url);
            return;
          }
        } catch (e) {
          console.warn('BalanceInvoicePDF logo load notice:', e);
        }
      }
      const rawUrl = clientLogoUrl || client?.logoUrl;
      if (rawUrl && !rawUrl.startsWith('blob:') && rawUrl !== 'indexeddb') {
        setActiveClientLogo(rawUrl);
      }
    };

    resolveClientLogo();

    return () => {
      if (createdUrl) revokeObjectUrl(createdUrl);
    };
  }, [client?.id, clientLogoUrl, client?.logoUrl]);

  return (
    <div id="balance-invoice-pdf-canvas" className="printable-area bg-white text-black p-8 max-w-[800px] mx-auto border border-gray-200 rounded-none shadow-none font-sans text-xs">
      {/* Top Red Header Accent Bar */}
      <div className="h-3 bg-[#E31B23] -mx-8 -mt-8 mb-6"></div>

      {/* Header Section: Left Hierarchy vs Right Hierarchy */}
      <div className="grid grid-cols-2 gap-8 border-b border-gray-300 pb-6 mb-6">
        {/* Left Column */}
        <div className="space-y-4">
          {/* 1. KEVORCH Company Logo */}
          <div>
            {fromDetails.logoUrl ? (
              <img
                src={fromDetails.logoUrl}
                alt="KEVORCH Logo"
                className="h-14 w-auto object-contain"
              />
            ) : (
              <span className="text-base font-extrabold text-black uppercase tracking-wide">
                {fromDetails.companyName || 'KEVORCH SBD'}
              </span>
            )}
          </div>

          {/* 2. Left Metadata Block (Balance Invoice Date, Due Date, Payment Terms) */}
          <div className="space-y-1 text-black text-[11px]">
            <p><span className="font-bold">Balance Invoice Date:</span> {date}</p>
            <p><span className="font-bold">Due Date:</span> {dueDate}</p>
            <p><span className="font-bold">Payment Terms:</span> {paymentTerms || 'N/A'}</p>
          </div>

          {/* 3. FROM Block */}
          <div className="pt-2 text-black text-[11px] space-y-0.5">
            <p className="font-extrabold text-xs uppercase tracking-wider text-black">FROM</p>
            <p className="font-bold text-xs text-black">{fromDetails.companyName || 'KEVORCH SBD'}</p>
            {fromDetails.address && (
              <p className="text-black">
                {fromDetails.address}
                {fromDetails.city ? `, ${fromDetails.city}` : ''}
                {fromDetails.state ? `, ${fromDetails.state}` : ''}
                {fromDetails.pincode ? ` - ${fromDetails.pincode}` : ''}
              </p>
            )}
            {(fromDetails.email || fromDetails.phone) && (
              <p className="text-black">
                {fromDetails.email ? `Email: ${fromDetails.email}` : ''}
                {fromDetails.email && fromDetails.phone ? ' | ' : ''}
                {fromDetails.phone ? `Phone: ${fromDetails.phone}` : ''}
              </p>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4 text-right flex flex-col justify-between items-end">
          {/* Top Right: Client Logo & Document Number */}
          <div className="w-full flex flex-col items-end">
            {activeClientLogo && !logoFailed ? (
              <div className="mb-2">
                <img
                  src={activeClientLogo}
                  alt="Client Logo"
                  className="h-14 max-w-[140px] object-contain"
                  onError={() => setLogoFailed(true)}
                />
              </div>
            ) : null}

            {balanceInvoiceNumber && (
              <p className="text-black font-extrabold text-sm tracking-wide uppercase">
                {balanceInvoiceNumber}
              </p>
            )}
          </div>

          {/* BALANCE INVOICE FOR Block */}
          <div className="text-right text-black text-[11px] space-y-0.5 w-full">
            <p className="font-extrabold text-xs uppercase tracking-wider text-black">BALANCE INVOICE FOR</p>
            <p className="font-bold text-xs text-black">{client.name}</p>
            {client.companyName ? (
              <p className="font-semibold text-black">{client.companyName}</p>
            ) : null}
            {client.address && (
              <p className="text-black">
                {client.address}
                {client.city ? `, ${client.city}` : ''}
                {client.state ? `, ${client.state}` : ''}
                {client.pincode ? ` - ${client.pincode}` : ''}
              </p>
            )}
            {(client.email || client.mobile) && (
              <p className="text-black">
                {client.mobile ? `Phone: ${client.mobile}` : ''}
                {client.mobile && client.email ? ' | ' : ''}
                {client.email ? `Email: ${client.email}` : ''}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Service Items Table */}
      <div className="mb-6">
        <table className="w-full text-left border-collapse border border-gray-300">
          <thead>
            <tr className="bg-[#E31B23] text-white font-bold text-[11px] uppercase border-b border-red-700">
              <th className="py-2.5 px-3 w-10 text-center border-r border-red-600/50">#</th>
              <th className="py-2.5 px-3 w-[25%] border-r border-red-600/50">SERVICE NAME</th>
              <th className="py-2.5 px-3 w-[55%] border-r border-red-600/50">DESCRIPTION & DELIVERABLES</th>
              <th className="py-2.5 px-3 text-right w-[20%]">AMOUNT (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((item, idx) => {
              const points = item.description
                ? item.description.split('\n').map(p => p.trim()).filter(Boolean)
                : [];
              return (
                <tr key={item.id || idx} className="bg-white text-black">
                  <td className="py-3 px-3 text-center text-black font-semibold border-r border-gray-200 align-middle">{idx + 1}</td>
                  <td className="py-3 px-3 border-r border-gray-200 align-middle">
                    <p className="font-bold text-black text-xs">{item.serviceName}</p>
                  </td>
                  <td className="py-3 px-3 border-r border-gray-200 align-middle">
                    {points.length > 0 ? (
                      <ul className="space-y-1 text-black text-[11px]">
                        {points.map((pt, pIdx) => (
                          <li key={pIdx} className="flex items-start space-x-1.5 leading-relaxed">
                            <span className="text-black font-bold select-none">•</span>
                            <span>{pt.replace(/^[•\-*\s]+/, '')}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-black text-xs align-middle">
                    ₹{Number(item.amount).toLocaleString('en-IN')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Financial Summary Block */}
      <div className="flex justify-end mb-6">
        <div className="w-80 bg-gray-50 border border-gray-300 rounded-none p-3 text-black space-y-1.5 text-xs">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-black font-bold">Original Invoice:</span>
            <span className="text-black font-bold">{originalInvoiceNumber}</span>
          </div>
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-black font-bold">Original Amount:</span>
            <span className="text-black font-bold">₹{originalInvoiceAmount.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-black font-bold">Already Paid:</span>
            <span className="text-black font-bold">₹{amountAlreadyPaid.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between items-center text-sm font-extrabold pt-1 border-t border-gray-300">
            <span className="text-black font-bold">Balance Due:</span>
            <span className="text-[#E31B23] text-base font-black">₹{balanceAmountDue.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Notes & Terms */}
      <div className="grid grid-cols-2 gap-6 text-[10px] text-black border-t border-gray-300 pt-4 mb-8">
        <div>
          <p className="font-bold text-black text-xs mb-1 uppercase tracking-wider">NOTES / REMARKS:</p>
          <p className="whitespace-pre-line leading-relaxed text-black">{notes || 'N/A'}</p>
        </div>
        <div>
          <p className="font-bold text-black text-xs mb-1 uppercase tracking-wider">TERMS & CONDITIONS:</p>
          <p className="whitespace-pre-line leading-relaxed text-black">{termsAndConditions || 'N/A'}</p>
        </div>
      </div>

      {/* Footer Section */}
      <div className="border-t border-gray-300 pt-4 text-black">
        <p className="text-[10px] text-black font-medium">Computer generated document for KEVORCH SBD.</p>
      </div>
    </div>
  );
};

