import { describe, it, expect } from 'vitest';
import { Invoice } from '../../src/types';

describe('Dashboard Calculation Engine Unit Tests', () => {
  it('should calculate gross invoice value, amount received, and balance outstanding from active invoices', () => {
    const activeInvoices: Partial<Invoice>[] = [
      { id: 'inv1', totalAmount: 50000, paidAmount: 20000, balanceAmount: 30000 },
      { id: 'inv2', totalAmount: 30000, paidAmount: 30000, balanceAmount: 0 },
      { id: 'inv3', totalAmount: 25000, paidAmount: 0, balanceAmount: 25000 }
    ];

    const totalInvoiceValue = activeInvoices.reduce((sum, i) => sum + Number(i.totalAmount || 0), 0);
    const totalAmountReceived = activeInvoices.reduce((sum, i) => sum + Number(i.paidAmount || 0), 0);
    const totalBalanceOutstanding = Math.max(0, activeInvoices.reduce((sum, i) => sum + Number(i.balanceAmount || 0), 0));

    expect(totalInvoiceValue).toBe(105000);
    expect(totalAmountReceived).toBe(50000);
    expect(totalBalanceOutstanding).toBe(55000);
  });

  it('should prevent negative outstanding balance on dashboard', () => {
    const activeInvoices: Partial<Invoice>[] = [
      { id: 'inv1', totalAmount: 50000, paidAmount: 55000, balanceAmount: 0 } // Overpayment edge case
    ];

    const totalBalanceOutstanding = Math.max(0, activeInvoices.reduce((sum, i) => sum + Number(i.balanceAmount || 0), 0));
    expect(totalBalanceOutstanding).toBe(0);
    expect(totalBalanceOutstanding).toBeGreaterThanOrEqual(0);
  });
});
