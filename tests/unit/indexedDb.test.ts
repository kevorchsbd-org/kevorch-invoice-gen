import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveCompanyAsset,
  getCompanyAsset,
  deleteCompanyAsset,
  saveClientAsset,
  getClientAsset,
  deleteClientAsset,
  saveInvoicePdf,
  getInvoicePdf,
  deleteInvoicePdf
} from '../../src/lib/indexedDb';

describe('IndexedDB Local Storage Unit Tests (fake-indexeddb)', () => {
  it('should save, retrieve, and delete company logo blob locally in IndexedDB', async () => {
    const blob = new Blob(['mock logo data'], { type: 'image/png' });
    const fileName = 'company_logo.png';

    // 1. Save
    await saveCompanyAsset('company_logo', blob, fileName);

    // 2. Retrieve
    const retrieved = await getCompanyAsset('company_logo');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.fileName).toBe(fileName);

    // 3. Delete
    await deleteCompanyAsset('company_logo');
    const afterDelete = await getCompanyAsset('company_logo');
    expect(afterDelete).toBeNull();
  });

  it('should save, retrieve, and delete client logo asset locally in IndexedDB', async () => {
    const clientId = 'client_test_99';
    const blob = new Blob(['client logo data'], { type: 'image/png' });

    // 1. Save
    await saveClientAsset(clientId, blob, 'client_logo.png');

    // 2. Retrieve
    const retrieved = await getClientAsset(clientId);
    expect(retrieved).not.toBeNull();

    // 3. Delete
    await deleteClientAsset(clientId);
    const afterDelete = await getClientAsset(clientId);
    expect(afterDelete).toBeNull();
  });

  it('should save, retrieve, and delete generated PDF blob locally in IndexedDB', async () => {
    const invoiceId = 'inv_pdf_101';
    const pdfBlob = new Blob(['%PDF-1.4 mock pdf bytes'], { type: 'application/pdf' });
    const pdfFilename = 'INV-2026-101_KEVORCH_SBD.pdf';

    // 1. Save PDF
    await saveInvoicePdf(invoiceId, pdfBlob, pdfFilename);

    // 2. Get PDF
    const retrievedPdf = await getInvoicePdf(invoiceId);
    expect(retrievedPdf).not.toBeNull();
    expect(retrievedPdf?.fileName).toBe(pdfFilename);

    // 3. Delete PDF
    await deleteInvoicePdf(invoiceId);
    const afterDelete = await getInvoicePdf(invoiceId);
    expect(afterDelete).toBeNull();
  });
});
