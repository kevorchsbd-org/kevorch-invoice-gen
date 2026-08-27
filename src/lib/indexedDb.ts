/**
 * Local IndexedDB Storage Service for Kevorch Invoice Application
 * 100% Client-Side Local Storage for Company Assets, Client Assets, and Generated PDFs.
 * Zero Cloud File Storage dependencies (Compatible with Firebase Spark Free Tier).
 */

const DB_NAME = 'kevorch-invoice-local';
const DB_VERSION = 1;

export const STORES = {
  COMPANY_ASSETS: 'companyAssets',
  CLIENT_ASSETS: 'clientAssets',
  INVOICE_FILES: 'invoiceFiles',
  QUOTATION_FILES: 'quotationFiles',
} as const;

export interface LocalAssetRecord {
  id: string;
  blob: Blob;
  fileName: string;
  mimeType: string;
  size: number;
  updatedAt: string;
}

export interface LocalStorageStats {
  companyAssetsCount: number;
  clientAssetsCount: number;
  invoicePdfsCount: number;
  quotationPdfsCount: number;
  totalSizeBytes: number;
}

/**
 * Open or upgrade connection to local IndexedDB instance
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error("Local file storage (IndexedDB) is unavailable in this browser. Please use a supported modern browser."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORES.COMPANY_ASSETS)) {
        db.createObjectStore(STORES.COMPANY_ASSETS);
      }
      if (!db.objectStoreNames.contains(STORES.CLIENT_ASSETS)) {
        db.createObjectStore(STORES.CLIENT_ASSETS);
      }
      if (!db.objectStoreNames.contains(STORES.INVOICE_FILES)) {
        db.createObjectStore(STORES.INVOICE_FILES);
      }
      if (!db.objectStoreNames.contains(STORES.QUOTATION_FILES)) {
        db.createObjectStore(STORES.QUOTATION_FILES);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Failed to open IndexedDB"));
  });
}

/**
 * Helper to convert File/Blob/Base64/DataURL to Blob
 */
async function toBlob(input: Blob | File | string, defaultMime: string = 'application/octet-stream'): Promise<{ blob: Blob; mimeType: string }> {
  if (typeof input !== 'string') {
    return { blob: input, mimeType: input.type || defaultMime };
  }

  if (input.startsWith('data:')) {
    const response = await fetch(input);
    const blob = await response.blob();
    return { blob, mimeType: blob.type || defaultMime };
  }

  const blob = new Blob([input], { type: defaultMime });
  return { blob, mimeType: defaultMime };
}

/**
 * Save an item into a specified IndexedDB store
 */
async function putItem(storeName: string, key: string, fileOrBlob: Blob | File | string, fileName?: string): Promise<LocalAssetRecord> {
  const db = await openDB();
  const { blob, mimeType } = await toBlob(fileOrBlob);
  const record: LocalAssetRecord = {
    id: key,
    blob,
    fileName: fileName || `${key}.${mimeType.split('/')[1] || 'bin'}`,
    mimeType,
    size: blob.size,
    updatedAt: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(record, key);

    req.onsuccess = () => resolve(record);
    req.onerror = () => reject(req.error || new Error(`Failed to store asset in ${storeName}`));
  });
}

/**
 * Get an item from a specified IndexedDB store
 */
async function getItem(storeName: string, key: string): Promise<(LocalAssetRecord & { url: string }) | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(key);

    req.onsuccess = () => {
      const record = req.result as LocalAssetRecord | undefined;
      if (!record || !record.blob) {
        resolve(null);
        return;
      }
      const url = URL.createObjectURL(record.blob);
      resolve({ ...record, url });
    };

    req.onerror = () => reject(req.error || new Error(`Failed to retrieve asset from ${storeName}`));
  });
}

/**
 * Delete an item from a specified IndexedDB store
 */
async function deleteItem(storeName: string, key: string): Promise<boolean> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(key);

    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error || new Error(`Failed to delete asset from ${storeName}`));
  });
}

/**
 * Revoke object URL safely to prevent browser memory leaks
 */
export function revokeObjectUrl(url?: string | null) {
  if (url && url.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn('URL.revokeObjectURL notice:', e);
    }
  }
}

/* ====================================================================
   COMPANY ASSETS (Logo, Signature)
   ==================================================================== */
export async function saveCompanyAsset(key: 'company_logo' | 'company_signature' | string, fileOrBlob: Blob | File | string, fileName?: string) {
  return putItem(STORES.COMPANY_ASSETS, key, fileOrBlob, fileName);
}

export async function getCompanyAsset(key: 'company_logo' | 'company_signature' | string) {
  return getItem(STORES.COMPANY_ASSETS, key);
}

export async function deleteCompanyAsset(key: 'company_logo' | 'company_signature' | string) {
  return deleteItem(STORES.COMPANY_ASSETS, key);
}

/* ====================================================================
   CLIENT ASSETS (Client Logo, Attachments)
   ==================================================================== */
export async function saveClientAsset(clientId: string, fileOrBlob: Blob | File | string, fileName?: string) {
  return putItem(STORES.CLIENT_ASSETS, clientId, fileOrBlob, fileName);
}

export async function getClientAsset(clientId: string) {
  return getItem(STORES.CLIENT_ASSETS, clientId);
}

export async function deleteClientAsset(clientId: string) {
  return deleteItem(STORES.CLIENT_ASSETS, clientId);
}

/* ====================================================================
   INVOICE PDF FILES
   ==================================================================== */
export async function saveInvoicePdf(invoiceId: string, pdfBlob: Blob, fileName?: string) {
  return putItem(STORES.INVOICE_FILES, invoiceId, pdfBlob, fileName || `Invoice_${invoiceId}.pdf`);
}

export async function getInvoicePdf(invoiceId: string) {
  return getItem(STORES.INVOICE_FILES, invoiceId);
}

export async function deleteInvoicePdf(invoiceId: string) {
  return deleteItem(STORES.INVOICE_FILES, invoiceId);
}

/* ====================================================================
   QUOTATION PDF FILES
   ==================================================================== */
export async function saveQuotationPdf(quotationId: string, pdfBlob: Blob, fileName?: string) {
  return putItem(STORES.QUOTATION_FILES, quotationId, pdfBlob, fileName || `Quotation_${quotationId}.pdf`);
}

export async function getQuotationPdf(quotationId: string) {
  return getItem(STORES.QUOTATION_FILES, quotationId);
}

export async function deleteQuotationPdf(quotationId: string) {
  return deleteItem(STORES.QUOTATION_FILES, quotationId);
}

/* ====================================================================
   LISTING & STATS HELPERS
   ==================================================================== */
export async function getLocalStorageStats(): Promise<LocalStorageStats> {
  const db = await openDB();
  const stats: LocalStorageStats = {
    companyAssetsCount: 0,
    clientAssetsCount: 0,
    invoicePdfsCount: 0,
    quotationPdfsCount: 0,
    totalSizeBytes: 0,
  };

  const storeNames = Object.values(STORES);

  for (const storeName of storeNames) {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.openCursor();

      req.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const record = cursor.value as LocalAssetRecord;
          stats.totalSizeBytes += record.size || record.blob?.size || 0;

          if (storeName === STORES.COMPANY_ASSETS) stats.companyAssetsCount++;
          if (storeName === STORES.CLIENT_ASSETS) stats.clientAssetsCount++;
          if (storeName === STORES.INVOICE_FILES) stats.invoicePdfsCount++;
          if (storeName === STORES.QUOTATION_FILES) stats.quotationPdfsCount++;

          cursor.continue();
        } else {
          resolve();
        }
      };

      req.onerror = () => reject(req.error);
    });
  }

  return stats;
}

export async function listAllLocalAssets() {
  const db = await openDB();
  const list: Array<LocalAssetRecord & { storeName: string; url: string }> = [];
  const storeNames = Object.values(STORES);

  for (const storeName of storeNames) {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.openCursor();

      req.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const record = cursor.value as LocalAssetRecord;
          if (record && record.blob) {
            const url = URL.createObjectURL(record.blob);
            list.push({ ...record, storeName, url });
          }
          cursor.continue();
        } else {
          resolve();
        }
      };

      req.onerror = () => reject(req.error);
    });
  }

  return list;
}

export async function clearAllLocalAssets(): Promise<boolean> {
  const db = await openDB();
  const storeNames = Object.values(STORES);

  for (const storeName of storeNames) {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  return true;
}
