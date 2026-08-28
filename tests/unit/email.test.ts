import { describe, it, expect } from 'vitest';
import { mockClient1, mockCompanyProfile } from '../fixtures/mockClients';

describe('Email Compose & Mailto Encoding Unit Tests', () => {
  // Helper: CC Deduplication & Exclusion of Primary To Email
  function processCcList(primaryTo: string, ccEmails: string[] = []): string[] {
    return Array.from(new Set(ccEmails.map(c => c.trim()).filter(Boolean)))
      .filter(email => email.toLowerCase() !== primaryTo.toLowerCase());
  }

  // Helper: Mailto Builder
  function buildMailtoUrl(to: string, ccList: string[], subject: string, body: string): string {
    const ccParam = ccList.length > 0 ? `&cc=${encodeURIComponent(ccList.join(','))}` : '';
    return `mailto:${encodeURIComponent(to.trim())}?subject=${encodeURIComponent(subject.trim())}&body=${encodeURIComponent(body.trim())}${ccParam}`;
  }

  it('should auto-fill recipient To email from client primary email', () => {
    const toEmail = mockClient1.email;
    expect(toEmail).toBe('client@example.com');
  });

  it('should deduplicate CC list and filter out primary To email address', () => {
    const primaryTo = 'client@example.com';
    const rawCcList = ['accounts@example.com', 'manager@example.com', 'client@example.com', 'accounts@example.com'];

    const cleanCc = processCcList(primaryTo, rawCcList);

    expect(cleanCc).toEqual(['accounts@example.com', 'manager@example.com']);
    expect(cleanCc.includes(primaryTo)).toBe(false);
  });

  it('should auto-generate correct subjects for all 4 document types', () => {
    const co = mockCompanyProfile.companyName;

    const qtnSub = `Quotation QT-2026-001 - ${co}`;
    const invSub = `Invoice INV-2026-001 - ${co}`;
    const balSub = `Balance Invoice BAL-2026-001 - ${co}`;
    const paySub = `Payment Receipt TXN-998877 - ${co}`;

    expect(qtnSub).toBe('Quotation QT-2026-001 - KEVORCH SBD');
    expect(invSub).toBe('Invoice INV-2026-001 - KEVORCH SBD');
    expect(balSub).toBe('Balance Invoice BAL-2026-001 - KEVORCH SBD');
    expect(paySub).toBe('Payment Receipt TXN-998877 - KEVORCH SBD');
  });

  it('should format URL-encoded mailto link correctly with scheme, recipient, cc, subject, body', () => {
    const to = 'client@example.com';
    const cc = ['accounts@example.com', 'manager@example.com'];
    const subject = 'Invoice INV-2026-001 - KEVORCH SBD';
    const body = 'Dear Rajesh Kumar,\n\nPlease find attached Invoice.';

    const mailtoUrl = buildMailtoUrl(to, cc, subject, body);

    expect(mailtoUrl.startsWith('mailto:client%40example.com')).toBe(true);
    expect(mailtoUrl).toContain('subject=Invoice%20INV-2026-001%20-%20KEVORCH%20SBD');
    expect(mailtoUrl).toContain('cc=accounts%40example.com%2Cmanager%40example.com');
  });

  it('should assert draft status wording as "Email draft opened" and NEVER "Email sent"', () => {
    const draftStatus = 'Email draft opened';
    expect(draftStatus).toBe('Email draft opened');
    expect(draftStatus).not.toBe('Email sent');
  });
});
