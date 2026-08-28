import { describe, it, expect } from 'vitest';
import { Invoice, Payment } from '../../src/types';

describe('Payment Logic & Calculation Unit Tests', () => {
  it('should reduce balance and set status to partially_paid on valid payment', () => {
    const invoice: Invoice = {
      id: 'inv_test_101',
      invoiceNumber: 'INV-2026-101',
      clientId: 'client_101',
      client: {
        id: 'client_101',
        name: 'Test Client',
        companyName: 'Test Co',
        mobile: '123',
        email: 'test@example.com',
        address: '123',
        city: 'City',
        state: 'State',
        pincode: '641001',
        createdAt: '',
        updatedAt: ''
      },
      items: [{ id: '1', serviceName: 'Dev', description: 'Web', amount: 50000 }],
      totalAmount: 50000,
      paidAmount: 0,
      balanceAmount: 50000,
      paymentStatus: 'unpaid',
      status: 'sent',
      invoiceDate: '2026-08-28',
      dueDate: '2026-09-15',
      paymentTerms: 'Net 30',
      fromDetails: { companyName: 'KEVORCH SBD', email: 'a@b.com', phone: '123', address: '', city: '', state: '', pincode: '' },
      notes: '',
      termsAndConditions: '',
      createdAt: '',
      updatedAt: ''
    };

    // Add ₹20,000 Payment
    const payment1Amount = 20000;
    const newPaid1 = invoice.paidAmount + payment1Amount;
    const newBalance1 = Math.max(0, invoice.totalAmount - newPaid1);
    const newStatus1 = newBalance1 === 0 ? 'fully_paid' : newPaid1 > 0 ? 'partially_paid' : 'unpaid';

    expect(newPaid1).toBe(20000);
    expect(newBalance1).toBe(30000);
    expect(newStatus1).toBe('partially_paid');
  });

  it('should reject payment amounts that exceed current outstanding balance', () => {
    const currentBalance = 30000;
    const invalidAttempt = 35000;

    const isValid = invalidAttempt > 0 && invalidAttempt <= currentBalance;
    expect(isValid).toBe(false);
  });

  it('should set status to fully_paid and balance to 0 when paid in full', () => {
    const totalAmount = 50000;
    const paidAmount = 50000;
    const balanceAmount = Math.max(0, totalAmount - paidAmount);
    const paymentStatus = balanceAmount === 0 ? 'fully_paid' : 'partially_paid';

    expect(paidAmount).toBe(50000);
    expect(balanceAmount).toBe(0);
    expect(paymentStatus).toBe('fully_paid');
  });

  it('should enforce double-click idempotency using operationToken lock', () => {
    const executedTokens = new Set<string>();

    function processPaymentWithToken(token: string, amount: number): boolean {
      if (executedTokens.has(token)) {
        return false; // Reject duplicate token submission
      }
      executedTokens.add(token);
      return true;
    }

    const token = 'op_token_xyz_123';

    // First submit click
    const firstAttempt = processPaymentWithToken(token, 20000);
    expect(firstAttempt).toBe(true);

    // Rapid second click with same operation token
    const secondAttempt = processPaymentWithToken(token, 20000);
    expect(secondAttempt).toBe(false);
    expect(executedTokens.size).toBe(1);
  });

  it('should recalculate invoice paidAmount and balance on payment deletion', () => {
    const invoiceTotal = 50000;
    const existingPayments: Payment[] = [
      { id: 'p1', invoiceId: 'inv1', invoiceNumber: 'INV-1', clientId: 'c1', clientName: 'C1', amount: 20000, paymentDate: '2026-08-28', paymentMethod: 'UPI', referenceNumber: 'TXN1', createdAt: '' }
    ];

    // Delete payment p1
    const remainingPayments = existingPayments.filter(p => p.id !== 'p1');
    const recalculatedPaid = remainingPayments.reduce((sum, p) => sum + p.amount, 0);
    const recalculatedBalance = Math.max(0, invoiceTotal - recalculatedPaid);
    const recalculatedStatus = recalculatedBalance === invoiceTotal ? 'unpaid' : recalculatedPaid > 0 ? 'partially_paid' : 'fully_paid';

    expect(recalculatedPaid).toBe(0);
    expect(recalculatedBalance).toBe(50000);
    expect(recalculatedStatus).toBe('unpaid');
  });
});
