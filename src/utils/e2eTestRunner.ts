import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { createClient } from '@supabase/supabase-js';

export interface E2ETestResults {
  firebase: {
    connection: 'PASS' | 'FAIL';
    clientWriteRead: 'PASS' | 'FAIL';
    quotationWriteRead: 'PASS' | 'FAIL';
    invoiceWriteRead: 'PASS' | 'FAIL';
    paymentUpdate: 'PASS' | 'FAIL';
    cleanup: 'PASS' | 'FAIL';
  };
  supabase: {
    storageConnection: 'PASS' | 'FAIL';
    fileUpload: 'PASS' | 'FAIL';
    fileVerification: 'PASS' | 'FAIL';
    fileCleanup: 'PASS' | 'FAIL';
  };
  errors: string[];
}

export function validateEnvironmentConfig(env: Record<string, string | undefined>): { valid: boolean; missing: string[] } {
  const requiredKeys = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_PUBLISHABLE_KEY'
  ];

  const missing: string[] = [];

  for (const key of requiredKeys) {
    const val = env[key];
    if (!val || val.trim() === '') {
      missing.push(`${key} (Missing)`);
    } else if (
      val.includes('AIzaSyDemoConfigKeyForTesting123456') ||
      val === '123456789012'
    ) {
      missing.push(`${key} (Contains demo/placeholder value: ${val})`);
    }
  }

  return {
    valid: missing.length === 0,
    missing
  };
}

export async function runE2EPersistenceTest(envConfig?: Record<string, string>): Promise<E2ETestResults> {
  const env = envConfig || {
    VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
    VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  };

  const results: E2ETestResults = {
    firebase: {
      connection: 'FAIL',
      clientWriteRead: 'FAIL',
      quotationWriteRead: 'FAIL',
      invoiceWriteRead: 'FAIL',
      paymentUpdate: 'FAIL',
      cleanup: 'FAIL'
    },
    supabase: {
      storageConnection: 'FAIL',
      fileUpload: 'FAIL',
      fileVerification: 'FAIL',
      fileCleanup: 'FAIL'
    },
    errors: []
  };

  const validation = validateEnvironmentConfig(env);
  if (!validation.valid) {
    results.errors.push(`Environment validation failed. Missing or demo placeholders:\n- ${validation.missing.join('\n- ')}`);
    return results;
  }

  const testId = `e2e_test_${Date.now()}`;
  const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY!,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || `${env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
    projectId: env.VITE_FIREBASE_PROJECT_ID!,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || `${env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: env.VITE_FIREBASE_APP_ID || ''
  };

  let db: any;
  let supabase: any;

  // Initialize Firebase
  try {
    const app = initializeApp(firebaseConfig, `e2e-app-${Date.now()}`);
    db = getFirestore(app);
    results.firebase.connection = 'PASS';
  } catch (err: any) {
    results.errors.push(`Firebase initialization failed: ${err.message}`);
    return results;
  }

  // Initialize Supabase
  try {
    supabase = createClient(env.VITE_SUPABASE_URL!, env.VITE_SUPABASE_PUBLISHABLE_KEY!);
    results.supabase.storageConnection = 'PASS';
  } catch (err: any) {
    results.errors.push(`Supabase client initialization failed: ${err.message}`);
  }

  // TEST 1: Client Write & Read
  const clientRef = doc(db, 'clients', testId);
  try {
    const clientData = {
      id: testId,
      name: "E2E Test Client",
      companyName: "Test Enterprise Ltd",
      email: "e2e@testcorp.com",
      mobile: "+91 98765 43210",
      address: "100 Tech Park",
      city: "Coimbatore",
      state: "Tamil Nadu",
      pincode: "641001",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await setDoc(clientRef, clientData);
    const snap = await getDoc(clientRef);
    if (snap.exists() && snap.data()?.name === "E2E Test Client") {
      results.firebase.clientWriteRead = 'PASS';
    } else {
      results.errors.push("Client read back failed or data mismatch.");
    }
  } catch (err: any) {
    results.errors.push(`Client write/read failed: ${err.message}`);
  }

  // TEST 2: Quotation Write & Read (₹1,000)
  const quoteRef = doc(db, 'quotations', testId);
  try {
    const quoteData = {
      id: testId,
      quotationNumber: "QTN-2026-999",
      quotationDate: "2026-08-25",
      validUntil: "2026-09-09",
      paymentTerms: "100% Advance",
      clientId: testId,
      items: [{ id: 'itm_1', serviceName: 'Test Service', description: 'E2E Testing Service', amount: 1000 }],
      totalAmount: 1000,
      status: 'sent',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await setDoc(quoteRef, quoteData);
    const snap = await getDoc(quoteRef);
    if (snap.exists() && snap.data()?.totalAmount === 1000) {
      results.firebase.quotationWriteRead = 'PASS';
    } else {
      results.errors.push("Quotation read back failed or totalAmount != 1000.");
    }
  } catch (err: any) {
    results.errors.push(`Quotation write/read failed: ${err.message}`);
  }

  // TEST 3: Invoice Write & Read (₹2,000)
  const invRef = doc(db, 'invoices', testId);
  try {
    const invData = {
      id: testId,
      invoiceNumber: "INV-2026-999",
      clientId: testId,
      invoiceDate: "2026-08-25",
      dueDate: "2026-09-09",
      items: [{ id: 'itm_1', serviceName: 'Test Billing Service', description: 'E2E Invoice', amount: 2000 }],
      totalAmount: 2000,
      paidAmount: 0,
      balanceAmount: 2000,
      paymentStatus: 'unpaid',
      status: 'sent',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await setDoc(invRef, invData);
    const snap = await getDoc(invRef);
    const data = snap.data();
    if (snap.exists() && data?.totalAmount === 2000 && data?.paidAmount === 0 && data?.balanceAmount === 2000 && data?.paymentStatus === 'unpaid') {
      results.firebase.invoiceWriteRead = 'PASS';
    } else {
      results.errors.push("Invoice read back failed or initial amount/status mismatch.");
    }
  } catch (err: any) {
    results.errors.push(`Invoice write/read failed: ${err.message}`);
  }

  // TEST 4: Payment Update (₹1,000) -> paidAmount=1000, balanceAmount=1000, paymentStatus="partially_paid"
  const payRef = doc(db, 'payments', testId);
  try {
    const payData = {
      id: testId,
      invoiceId: testId,
      clientId: testId,
      clientName: "E2E Test Client",
      amount: 1000,
      paymentDate: "2026-08-25",
      paymentMethod: "UPI",
      referenceNumber: "UPI-998877",
      createdAt: new Date().toISOString()
    };
    await setDoc(payRef, payData);

    await setDoc(invRef, {
      paidAmount: 1000,
      balanceAmount: 1000,
      paymentStatus: 'partially_paid',
      updatedAt: new Date().toISOString()
    }, { merge: true });

    const snap = await getDoc(invRef);
    const data = snap.data();
    if (snap.exists() && data?.paidAmount === 1000 && data?.balanceAmount === 1000 && data?.paymentStatus === 'partially_paid') {
      results.firebase.paymentUpdate = 'PASS';
    } else {
      results.errors.push("Payment update failed or invoice state mismatch.");
    }
  } catch (err: any) {
    results.errors.push(`Payment update failed: ${err.message}`);
  }

  // TEST 5, 6, 7: Supabase Upload, Verification, & Cleanup
  if (supabase) {
    const storagePath = `company/logo/e2e_test_${Date.now()}.png`;
    const dummyContent = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    try {
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('documents')
        .upload(storagePath, dummyContent, { contentType: 'image/png', upsert: true });

      if (uploadErr) {
        results.errors.push(`Supabase Storage upload error: ${uploadErr.message}`);
      } else {
        results.supabase.fileUpload = 'PASS';

        // Verify file exists
        const { data: listData, error: listErr } = await supabase.storage
          .from('documents')
          .list('company/logo');

        const found = listData?.some((f: any) => storagePath.endsWith(f.name));
        if (found) {
          results.supabase.fileVerification = 'PASS';
        } else {
          results.errors.push("Uploaded file not found in Supabase Storage list check.");
        }

        // Cleanup Supabase File
        const { error: removeErr } = await supabase.storage
          .from('documents')
          .remove([storagePath]);

        if (!removeErr) {
          results.supabase.fileCleanup = 'PASS';
        } else {
          results.errors.push(`Supabase Storage file cleanup error: ${removeErr.message}`);
        }
      }
    } catch (err: any) {
      results.errors.push(`Supabase operations error: ${err.message}`);
    }
  }

  // Cleanup Firestore Records
  try {
    await deleteDoc(clientRef);
    await deleteDoc(quoteRef);
    await deleteDoc(invRef);
    await deleteDoc(payRef);
    results.firebase.cleanup = 'PASS';
  } catch (err: any) {
    results.errors.push(`Firestore cleanup error: ${err.message}`);
  }

  return results;
}
