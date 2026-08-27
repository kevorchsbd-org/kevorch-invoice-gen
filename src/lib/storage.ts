import {
  saveCompanyAsset,
  saveClientAsset,
  saveInvoicePdf,
  saveQuotationPdf,
  getCompanyAsset,
  deleteCompanyAsset
} from './indexedDb';

export const BUCKET_NAME = 'documents';

/**
 * Upload a file directly into local IndexedDB storage.
 * 100% Client-Side Local File Storage (Compatible with Firebase Spark Free Tier).
 */
export async function uploadDocumentFile(
  path: string,
  fileOrBase64: File | Blob | string,
  fileType?: string
): Promise<{ url: string; path: string }> {
  let relativePath = path;
  if (relativePath.startsWith(`${BUCKET_NAME}/`)) {
    relativePath = relativePath.substring(BUCKET_NAME.length + 1);
  }

  const fileName = typeof fileOrBase64 === 'object' && 'name' in fileOrBase64 ? (fileOrBase64 as File).name : undefined;

  let record;
  if (relativePath.includes('company/logo') || relativePath.includes('company_logo')) {
    record = await saveCompanyAsset('company_logo', fileOrBase64, fileName);
  } else if (relativePath.includes('company/signature') || relativePath.includes('company_signature')) {
    record = await saveCompanyAsset('company_signature', fileOrBase64, fileName);
  } else if (relativePath.includes('clients/')) {
    const parts = relativePath.split('clients/')[1].split('/');
    const clientId = parts[0] || relativePath;
    record = await saveClientAsset(clientId, fileOrBase64, fileName);
  } else if (relativePath.includes('invoices/')) {
    const parts = relativePath.split('invoices/')[1].split('/');
    const invoiceId = parts[0] || relativePath;
    record = await saveInvoicePdf(invoiceId, fileOrBase64 as Blob, fileName);
  } else if (relativePath.includes('quotations/')) {
    const parts = relativePath.split('quotations/')[1].split('/');
    const quotationId = parts[0] || relativePath;
    record = await saveQuotationPdf(quotationId, fileOrBase64 as Blob, fileName);
  } else {
    record = await saveCompanyAsset(relativePath, fileOrBase64, fileName);
  }

  const url = URL.createObjectURL(record.blob);

  return {
    url,
    path: relativePath,
  };
}

export async function deleteDocumentFile(filePath: string): Promise<boolean> {
  if (!filePath) return true;
  if (filePath.includes('company_logo')) await deleteCompanyAsset('company_logo');
  if (filePath.includes('company_signature')) await deleteCompanyAsset('company_signature');
  return true;
}

export async function getFileAccessUrl(filePath: string): Promise<string> {
  if (!filePath) return '';
  if (filePath.startsWith('blob:') || filePath.startsWith('http:') || filePath.startsWith('https:') || filePath.startsWith('data:')) {
    return filePath;
  }
  const asset = await getCompanyAsset(filePath);
  return asset ? asset.url : filePath;
}
