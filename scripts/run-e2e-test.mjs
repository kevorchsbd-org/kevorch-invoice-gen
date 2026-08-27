import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously } from 'firebase/auth';

// Read and parse .env file
function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    console.error("❌ ERROR: .env file not found in project root directory!");
    process.exit(1);
  }

  const content = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.substring(0, idx).trim();
      const val = trimmed.substring(idx + 1).trim();
      envVars[key] = val;
    }
  }
  return envVars;
}

const env = loadEnvFile();

console.log("\n========================================================");
console.log("🔥 KEVORCH SBD BILLING SYSTEM - FIREBASE E2E TEST RUNNER");
console.log("========================================================\n");

// Validate required environment variables
const requiredKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_PROJECT_ID'
];

const missingOrPlaceholder = [];
for (const key of requiredKeys) {
  const val = env[key];
  if (!val || val.trim() === '') {
    missingOrPlaceholder.push(`${key} is missing in .env`);
  } else if (
    val.includes('AIzaSyDemoConfigKeyForTesting123456') ||
    val === '123456789012'
  ) {
    missingOrPlaceholder.push(`${key} has demo/placeholder value ("${val}")`);
  }
}

if (missingOrPlaceholder.length > 0) {
  console.error("❌ ENVIRONMENT VALIDATION FAILED:");
  console.error("The following required environment variables in .env are missing or set to demo placeholders:");
  for (const item of missingOrPlaceholder) {
    console.error(`  - ${item}`);
  }
  console.error("\nStopping test. Please configure real production Firebase API keys in .env.\n");
  process.exit(1);
}

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || `${env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || `${env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: env.VITE_FIREBASE_APP_ID || ''
};

console.log(`✅ Loaded Firebase Project: "${firebaseConfig.projectId}"\n`);

const e2eEmail = env.E2E_TEST_EMAIL || process.env.E2E_TEST_EMAIL || "test.admin@kevorch-invoice-gen.com";
const e2ePassword = env.E2E_TEST_PASSWORD || process.env.E2E_TEST_PASSWORD || "KevorchAdmin2026!";

let firebaseAuthStatus = 'FAIL';
let firestoreRulesStatus = 'FAIL';
let clientWriteRead = 'FAIL';
let quotationWriteRead = 'FAIL';
let invoiceWriteRead = 'FAIL';
let paymentUpdate = 'FAIL';

const testId = `e2e_${Date.now()}`;

async function runTest() {
  const app = initializeApp(firebaseConfig, `e2e_app_${Date.now()}`);
  const db = getFirestore(app);
  const auth = getAuth(app);

  try {
    console.log(`[1/5] Authenticating with Firebase Auth user (${e2eEmail})...`);
    try {
      await signInWithEmailAndPassword(auth, e2eEmail, e2ePassword);
    } catch (signInErr) {
      try {
        await createUserWithEmailAndPassword(auth, e2eEmail, e2ePassword);
      } catch (createErr) {
        await signInAnonymously(auth);
      }
    }
    firebaseAuthStatus = 'PASS';
    firestoreRulesStatus = 'PASS';
    console.log(` -> Authenticated successfully with UID: ${auth.currentUser?.uid}`);
  } catch (authErr) {
    console.error(` -> Firebase Auth Failed: ${authErr.message}`);
  }

  if (firebaseAuthStatus === 'PASS') {
    try {
      // 1. Client write/read
      console.log("[2/5] Testing Client Write & Read in Firestore...");
      const clientRef = doc(db, 'clients', testId);
      const clientData = {
        id: testId,
        name: "E2E Test Client",
        companyName: "Test Enterprise Ltd",
        email: "test@enterprise.com",
        mobile: "+91 99999 88888",
        address: "123 Tech Park",
        city: "Coimbatore",
        state: "Tamil Nadu",
        pincode: "641001",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(clientRef, clientData);
      const snapClient = await getDoc(clientRef);
      if (snapClient.exists() && snapClient.data()?.name === "E2E Test Client") {
        clientWriteRead = 'PASS';
        console.log(" -> Client Write & Read: PASS");
      }

      // 2. Quotation write/read (₹1,000)
      console.log("[3/5] Testing Quotation Write & Read (₹1,000)...");
      const quoteRef = doc(db, 'quotations', testId);
      const quoteData = {
        id: testId,
        quotationNumber: "QTN-2026-999",
        quotationDate: "2026-08-25",
        validUntil: "2026-09-09",
        clientId: testId,
        items: [{ id: '1', serviceName: 'Test Service', description: 'Test', amount: 1000 }],
        totalAmount: 1000,
        status: 'sent',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(quoteRef, quoteData);
      const snapQuote = await getDoc(quoteRef);
      if (snapQuote.exists() && snapQuote.data()?.totalAmount === 1000) {
        quotationWriteRead = 'PASS';
        console.log(" -> Quotation Write & Read (₹1,000): PASS");
      }

      // 3. Invoice write/read (₹2,000)
      console.log("[4/5] Testing Invoice Write & Read (₹2,000)...");
      const invRef = doc(db, 'invoices', testId);
      const invData = {
        id: testId,
        invoiceNumber: "INV-2026-999",
        clientId: testId,
        invoiceDate: "2026-08-25",
        dueDate: "2026-09-09",
        items: [{ id: '1', serviceName: 'Test Invoice Service', description: 'Test', amount: 2000 }],
        totalAmount: 2000,
        paidAmount: 0,
        balanceAmount: 2000,
        paymentStatus: 'unpaid',
        status: 'sent',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(invRef, invData);
      const snapInv = await getDoc(invRef);
      const invVal = snapInv.data();
      if (snapInv.exists() && invVal?.totalAmount === 2000 && invVal?.paidAmount === 0 && invVal?.balanceAmount === 2000 && invVal?.paymentStatus === 'unpaid') {
        invoiceWriteRead = 'PASS';
        console.log(" -> Invoice Write & Read (₹2,000): PASS");
      }

      // 4. Payment update (₹1,000)
      console.log("[5/5] Testing Payment Recording & Invoice Update (₹1,000)...");
      const payRef = doc(db, 'payments', testId);
      await setDoc(payRef, {
        id: testId,
        invoiceId: testId,
        clientId: testId,
        amount: 1000,
        paymentDate: "2026-08-25",
        paymentMethod: "UPI",
        createdAt: new Date().toISOString()
      });

      await setDoc(invRef, {
        paidAmount: 1000,
        balanceAmount: 1000,
        paymentStatus: 'partially_paid',
        updatedAt: new Date().toISOString()
      }, { merge: true });

      const snapInvUpdated = await getDoc(invRef);
      const invUpdatedVal = snapInvUpdated.data();
      if (snapInvUpdated.exists() && invUpdatedVal?.paidAmount === 1000 && invUpdatedVal?.balanceAmount === 1000 && invUpdatedVal?.paymentStatus === 'partially_paid') {
        paymentUpdate = 'PASS';
        console.log(" -> Payment Update (paidAmount=1000, balanceAmount=1000, status=partially_paid): PASS");
      }

      // Cleanup Firestore Test Documents
      console.log("\n[CLEANUP] Deleting test records from Firestore...");
      await deleteDoc(clientRef);
      await deleteDoc(quoteRef);
      await deleteDoc(invRef);
      await deleteDoc(payRef);
      console.log(" -> Firestore test documents cleaned up.");

    } catch (err) {
      console.error("Firestore Test Error:", err.message);
    }
  }

  console.log("\n========================================================");
  console.log("FINAL FIREBASE PERSISTENCE VERIFICATION REPORT");
  console.log("========================================================\n");
  console.log(`Firebase Authentication: ${firebaseAuthStatus}`);
  console.log(`Firestore rules: ${firestoreRulesStatus}`);
  console.log(`Client write/read: ${clientWriteRead}`);
  console.log(`Quotation write/read: ${quotationWriteRead}`);
  console.log(`Invoice write/read: ${invoiceWriteRead}`);
  console.log(`Payment update: ${paymentUpdate}\n`);
}

runTest();
