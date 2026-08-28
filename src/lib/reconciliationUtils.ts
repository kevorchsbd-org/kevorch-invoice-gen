import { Payment, Invoice } from '../types';

export interface ReconciliationAnalysisItem {
  payment: Payment;
  invoiceNumber: string;
  isUnlinked: boolean;
  isCandidateDuplicate: boolean;
  confidenceScore: 'high' | 'medium' | 'low';
  evidenceReason: string;
  originalPaymentId?: string;
}

export interface ReconciliationSummary {
  totalPayments: number;
  legitimateCount: number;
  candidateDuplicatesCount: number;
  unlinkedCount: number;
  affectedInvoicesCount: number;
  analysisItems: ReconciliationAnalysisItem[];
}

/**
 * Perform a strict multi-attribute evidence analysis on payments.
 * IMPORTANT: Identical amount alone NEVER marks a payment as duplicate.
 */
export function analyzePaymentLedger(
  payments: Payment[],
  invoices: Invoice[]
): ReconciliationSummary {
  const invoiceMap = new Map<string, Invoice>();
  invoices.forEach(inv => invoiceMap.set(inv.id, inv));

  const items: ReconciliationAnalysisItem[] = [];
  const affectedInvoiceIds = new Set<string>();

  // Group by invoiceId
  const paymentsByInvoice = new Map<string, Payment[]>();
  let unlinkedCount = 0;

  // Sort payments by createdAt ascending for chronological comparison
  const sortedPayments = [...payments].sort((a, b) => {
    const tA = new Date(a.createdAt || 0).getTime();
    const tB = new Date(b.createdAt || 0).getTime();
    return tA - tB;
  });

  sortedPayments.forEach(p => {
    const list = paymentsByInvoice.get(p.invoiceId) || [];
    list.push(p);
    paymentsByInvoice.set(p.invoiceId, list);
  });

  for (const [invoiceId, pList] of paymentsByInvoice.entries()) {
    const invoice = invoiceMap.get(invoiceId);
    const isUnlinked = !invoice;
    if (isUnlinked) {
      unlinkedCount += pList.length;
    }

    const keptForInvoice: Payment[] = [];

    pList.forEach(p => {
      let isCandidateDup = false;
      let confidenceScore: 'high' | 'medium' | 'low' = 'low';
      let evidenceReason = isUnlinked ? 'Unlinked / Orphan Payment' : 'Legitimate Ledger Entry';
      let originalId: string | undefined = undefined;

      if (!isUnlinked) {
        // Compare against already processed payments for this invoice
        for (const kept of keptForInvoice) {
          const sameAmount = Number(kept.amount) === Number(p.amount);
          const timeA = new Date(kept.createdAt || 0).getTime();
          const timeB = new Date(p.createdAt || 0).getTime();
          const timeDiffSeconds = Math.abs(timeB - timeA) / 1000;

          const sameToken = Boolean(p.operationToken && kept.operationToken && p.operationToken === kept.operationToken);
          const sameRef = Boolean(p.referenceNumber && kept.referenceNumber && p.referenceNumber.trim() === kept.referenceNumber.trim());
          const sameDate = p.paymentDate === kept.paymentDate;
          const sameMethod = p.paymentMethod === kept.paymentMethod;

          // Multi-Attribute Evidence Scoring Rules:
          // Rule 1: Same operation token (High Confidence)
          if (sameToken) {
            isCandidateDup = true;
            confidenceScore = 'high';
            evidenceReason = `Identical submission token (${p.operationToken})`;
            originalId = kept.id;
            break;
          }

          // Rule 2: Same amount AND created within 120 seconds (High Confidence)
          if (sameAmount && timeDiffSeconds <= 120) {
            isCandidateDup = true;
            confidenceScore = 'high';
            evidenceReason = `Identical amount ₹${p.amount.toLocaleString('en-IN')} submitted within ${Math.round(timeDiffSeconds)} seconds of #${kept.id.slice(-6)}`;
            originalId = kept.id;
            break;
          }

          // Rule 3: Same amount, same date, same non-empty reference number (Medium Confidence)
          if (sameAmount && sameDate && sameRef) {
            isCandidateDup = true;
            confidenceScore = 'medium';
            evidenceReason = `Identical transaction ref (${p.referenceNumber}) and amount on ${p.paymentDate}`;
            originalId = kept.id;
            break;
          }

          // Rule 4: Same amount, same date, same payment method, created within 15 minutes with blank ref
          if (sameAmount && sameDate && sameMethod && !p.referenceNumber && !kept.referenceNumber && timeDiffSeconds <= 900) {
            isCandidateDup = true;
            confidenceScore = 'medium';
            evidenceReason = `Rapid duplicate payment without transaction ref on ${p.paymentDate}`;
            originalId = kept.id;
            break;
          }
        }
      }

      if (isCandidateDup) {
        affectedInvoiceIds.add(p.invoiceId);
      } else {
        keptForInvoice.push(p);
      }

      items.push({
        payment: p,
        invoiceNumber: invoice ? invoice.invoiceNumber : 'UNLINKED',
        isUnlinked,
        isCandidateDuplicate: isCandidateDup,
        confidenceScore,
        evidenceReason,
        originalPaymentId: originalId
      });
    });
  }

  const candidateDuplicatesCount = items.filter(i => i.isCandidateDuplicate).length;
  const legitimateCount = items.length - candidateDuplicatesCount;

  return {
    totalPayments: payments.length,
    legitimateCount,
    candidateDuplicatesCount,
    unlinkedCount,
    affectedInvoicesCount: affectedInvoiceIds.size,
    analysisItems: items
  };
}

/**
 * Generate and trigger download of selected payments as JSON backup file.
 */
export function exportPaymentsJSON(selectedPayments: Payment[]) {
  const jsonStr = JSON.stringify(selectedPayments, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `payment_backup_${new Date().toISOString().slice(0,10)}_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate and trigger download of selected payments as CSV backup file.
 */
export function exportPaymentsCSV(selectedPayments: Payment[]) {
  const headers = ['ID', 'Invoice ID', 'Invoice Number', 'Client Name', 'Amount', 'Payment Date', 'Payment Method', 'Reference Number', 'Created At'];
  const rows = selectedPayments.map(p => [
    `"${p.id}"`,
    `"${p.invoiceId}"`,
    `"${p.invoiceNumber}"`,
    `"${p.clientName.replace(/"/g, '""')}"`,
    p.amount,
    `"${p.paymentDate}"`,
    `"${p.paymentMethod}"`,
    `"${(p.referenceNumber || '').replace(/"/g, '""')}"`,
    `"${p.createdAt}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `payment_backup_${new Date().toISOString().slice(0,10)}_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
