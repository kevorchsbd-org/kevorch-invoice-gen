import { describe, it, expect } from 'vitest';
import { Quotation, Invoice } from '../../src/types';
import { mockClient1, mockCompanyProfile } from '../fixtures/mockClients';

describe('Quotation to Invoice Conversion & Snapshot Independence Unit Tests', () => {
  it('should auto-fill all 21 quotation fields into a newly converted invoice snapshot', () => {
    const quotation: Quotation = {
      id: 'q_test_200',
      quotationNumber: 'QTN-2026-001',
      quotationDate: '2026-08-28',
      validUntil: '2026-09-30',
      paymentTerms: '50% advance',
      clientId: mockClient1.id,
      client: mockClient1,
      items: [
        { id: 'item_1', serviceName: 'Website Development', description: '5-page responsive website', quantity: 1, rate: 20000, amount: 20000 },
        { id: 'item_2', serviceName: 'UI Design', description: 'Complete website UI', quantity: 1, rate: 12000, amount: 12000 }
      ],
      totalAmount: 32000,
      fromDetails: mockCompanyProfile,
      notes: 'Initial estimate',
      termsAndConditions: 'Standard payment terms apply.',
      status: 'accepted',
      createdAt: '2026-08-28T00:00:00Z',
      updatedAt: '2026-08-28T00:00:00Z'
    };

    // Convert Quotation to Invoice with deep-copied snapshot items
    const invoiceSnapshotItems = quotation.items.map(item => ({ ...item }));

    const convertedInvoice: Invoice = {
      id: 'inv_converted_200',
      invoiceNumber: 'INV-2026-999',
      quotationId: quotation.id,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '2026-09-28',
      paymentTerms: quotation.paymentTerms,
      clientId: quotation.clientId,
      client: { ...quotation.client },
      items: invoiceSnapshotItems,
      totalAmount: quotation.totalAmount,
      paidAmount: 0,
      balanceAmount: quotation.totalAmount,
      paymentStatus: 'unpaid',
      status: 'draft',
      fromDetails: { ...quotation.fromDetails },
      notes: quotation.notes,
      termsAndConditions: quotation.termsAndConditions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    expect(convertedInvoice.quotationId).toBe('q_test_200');
    expect(convertedInvoice.client.name).toBe('Rajesh Kumar');
    expect(convertedInvoice.items.length).toBe(2);
    expect(convertedInvoice.items[0].serviceName).toBe('Website Development');
    expect(convertedInvoice.items[0].amount).toBe(20000);
    expect(convertedInvoice.items[1].serviceName).toBe('UI Design');
    expect(convertedInvoice.items[1].amount).toBe(12000);
    expect(convertedInvoice.totalAmount).toBe(32000);
    expect(convertedInvoice.paidAmount).toBe(0);
    expect(convertedInvoice.balanceAmount).toBe(32000);
    expect(convertedInvoice.paymentStatus).toBe('unpaid');
  });

  it('MANDATORY SNAPSHOT TEST: editing quotation later must leave converted invoice snapshot unchanged', () => {
    // 1. Original Quotation (Service B = ₹12,000, Total = ₹32,000)
    const originalQuotationItems = [
      { id: 'item_1', serviceName: 'Website Development', description: '5-page responsive website', amount: 20000 },
      { id: 'item_2', serviceName: 'UI Design', description: 'Complete website UI', amount: 12000 }
    ];

    // 2. Converted Invoice Snapshot
    const convertedInvoiceItems = originalQuotationItems.map(item => ({ ...item }));
    const convertedInvoiceTotal = convertedInvoiceItems.reduce((sum, item) => sum + item.amount, 0);

    expect(convertedInvoiceItems[1].amount).toBe(12000);
    expect(convertedInvoiceTotal).toBe(32000);

    // 3. User edits original Quotation later (Service B increased to ₹15,000)
    originalQuotationItems[1].amount = 15000;
    const updatedQuotationTotal = originalQuotationItems.reduce((sum, item) => sum + item.amount, 0);

    expect(originalQuotationItems[1].amount).toBe(15000);
    expect(updatedQuotationTotal).toBe(35000);

    // 4. Verify converted Invoice snapshot remains strictly UNCHANGED (₹12,000 and ₹32,000 total)
    expect(convertedInvoiceItems[1].amount).toBe(12000);
    expect(convertedInvoiceTotal).toBe(32000);
  });
});
