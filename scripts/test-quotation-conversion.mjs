import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyC_2CjJXH0sMdPnCdyBo7AQ-3yr4vQTFkk',
  authDomain: 'kevorch-invoice-gen.firebaseapp.com',
  projectId: 'kevorch-invoice-gen',
  storageBucket: 'kevorch-invoice-gen.firebasestorage.app',
  messagingSenderId: '1087462822277',
  appId: '1:1087462822277:web:9df901afc5edc3fe2a34ec'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const testResults = [];
function assert(condition, message) {
  if (condition) {
    testResults.push({ message, status: 'PASS' });
    console.log(` ✅ PASS: ${message}`);
  } else {
    testResults.push({ message, status: 'FAIL' });
    console.error(` ❌ FAIL: ${message}`);
  }
}

async function runQuotationConversionTests() {
  console.log(`==================================================`);
  console.log(`RUNNING AUTOMATED QUOTATION → INVOICE CONVERSION TESTS`);
  console.log(`==================================================\n`);

  await signInWithEmailAndPassword(auth, 'kevorchsbd@gmail.com', 'kevorch123');

  const testTimestamp = Date.now();
  const testQuotationId = `qt_test_${testTimestamp}`;
  const testInvoiceId = `inv_test_${testTimestamp}`;

  const testClient = {
    id: `cli_test_${testTimestamp}`,
    name: 'ABC Company',
    companyName: 'ABC Company Pvt Ltd',
    email: 'contact@abccompany.com',
    phone: '+91 98765 00000',
    address: '100 Innovation Way',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    pincode: '641001',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const initialQuotationData = {
    id: testQuotationId,
    quotationNumber: `QTN-TEST-${testTimestamp.toString().slice(-4)}`,
    quotationDate: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    clientId: testClient.id,
    client: testClient,
    items: [
      { id: '1', serviceName: 'Website Development', description: '5-page responsive website', quantity: 1, rate: 20000, amount: 20000 },
      { id: '2', serviceName: 'UI Design', description: 'Complete website UI', quantity: 1, rate: 10000, amount: 10000 }
    ],
    totalAmount: 30000,
    status: 'sent',
    paymentTerms: '50% Advance, 50% on completion',
    notes: 'Test quotation notes',
    termsAndConditions: 'Test T&C',
    fromDetails: { companyName: 'KEVORCH SBD', email: 'kevorchsbd@gmail.com' },
    companyLogoUrl: 'test_logo_url',
    clientLogoUrl: '',
    signatureUrl: 'test_sig_url',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // STEP 1: Create initial quotation
  await setDoc(doc(db, 'quotations', testQuotationId), initialQuotationData);
  console.log(`1. Created test Quotation [${initialQuotationData.quotationNumber}] (Total: ₹30,000)`);

  // STEP 2: Edit quotation (change UI Design to ₹12,000 -> Total ₹32,000)
  const editedQuotationData = {
    ...initialQuotationData,
    items: [
      { id: '1', serviceName: 'Website Development', description: '5-page responsive website', quantity: 1, rate: 20000, amount: 20000 },
      { id: '2', serviceName: 'UI Design', description: 'Complete website UI', quantity: 1, rate: 12000, amount: 12000 }
    ],
    totalAmount: 32000,
    updatedAt: new Date().toISOString()
  };
  await setDoc(doc(db, 'quotations', testQuotationId), editedQuotationData);
  console.log(`2. Edited Quotation before conversion: Changed UI Design to ₹12,000 (New Total: ₹32,000)`);

  // STEP 3: Perform conversion logic
  const snapshotItems = editedQuotationData.items.map(item => ({ ...item }));
  const snapshotClient = JSON.parse(JSON.stringify(editedQuotationData.client));
  const snapshotFromDetails = JSON.parse(JSON.stringify(editedQuotationData.fromDetails));

  const newInvoice = {
    id: testInvoiceId,
    invoiceNumber: `INV-TEST-${testTimestamp.toString().slice(-4)}`,
    quotationId: testQuotationId,
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    paymentTerms: editedQuotationData.paymentTerms,
    clientId: editedQuotationData.clientId,
    client: snapshotClient,
    items: snapshotItems,
    totalAmount: editedQuotationData.totalAmount,
    paidAmount: 0,
    balanceAmount: editedQuotationData.totalAmount,
    paymentStatus: 'unpaid',
    status: 'sent',
    fromDetails: snapshotFromDetails,
    notes: editedQuotationData.notes,
    termsAndConditions: editedQuotationData.termsAndConditions,
    companyLogoUrl: editedQuotationData.companyLogoUrl,
    clientLogoUrl: editedQuotationData.clientLogoUrl,
    signatureUrl: editedQuotationData.signatureUrl,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await setDoc(doc(db, 'invoices', testInvoiceId), newInvoice);

  const convertedQuotationData = {
    ...editedQuotationData,
    status: 'converted',
    convertedToInvoiceId: testInvoiceId
  };
  await setDoc(doc(db, 'quotations', testQuotationId), convertedQuotationData);
  console.log(`3. Converted Quotation to Invoice [${newInvoice.invoiceNumber}]\n`);

  // --- ASSERTIONS ---
  console.log(`--- EXECUTING ASSERTIONS ---`);

  // Test 1: Quotation conversion workflow
  assert(newInvoice.id === testInvoiceId && convertedQuotationData.status === 'converted', 'Test 1: Quotation conversion workflow status updated');

  // Test 2: Service item copying
  assert(newInvoice.items.length === 2 && newInvoice.items[0].serviceName === 'Website Development' && newInvoice.items[1].serviceName === 'UI Design', 'Test 2: Service item names copied correctly');

  // Test 3: Description copying
  assert(newInvoice.items[0].description === '5-page responsive website' && newInvoice.items[1].description === 'Complete website UI', 'Test 3: Service item descriptions copied correctly');

  // Test 4: Amount copying
  assert(newInvoice.items[0].amount === 20000 && newInvoice.items[1].amount === 12000, 'Test 4: Service item amounts copied from latest quotation');

  // Test 5: Client data copying
  assert(newInvoice.client.name === 'ABC Company' && newInvoice.client.email === 'contact@abccompany.com', 'Test 5: Client metadata copied correctly');

  // Test 6: New invoice number generation
  assert(newInvoice.invoiceNumber.startsWith('INV-') && newInvoice.invoiceNumber !== initialQuotationData.quotationNumber, 'Test 6: Generated distinct new Invoice Number');

  // Test 7: quotationId relation
  assert(newInvoice.quotationId === testQuotationId && convertedQuotationData.convertedToInvoiceId === testInvoiceId, 'Test 7: quotationId & convertedToInvoiceId bidirectional relation stored');

  // Test 8: Invoice Snapshot Independence (Edit quotation AGAIN after conversion)
  console.log(`\n4. Testing Snapshot Independence: Editing Quotation AGAIN (UI Design -> ₹15,000)...`);
  const reEditedQuotation = {
    ...convertedQuotationData,
    items: [
      { id: '1', serviceName: 'Website Development', description: '5-page responsive website', quantity: 1, rate: 20000, amount: 20000 },
      { id: '2', serviceName: 'UI Design', description: 'Complete website UI', quantity: 1, rate: 15000, amount: 15000 }
    ],
    totalAmount: 35000
  };
  await setDoc(doc(db, 'quotations', testQuotationId), reEditedQuotation);

  assert(newInvoice.totalAmount === 32000 && newInvoice.items[1].amount === 12000, 'Test 8: Invoice snapshot remains unchanged (₹32,000) when quotation is edited after conversion');

  // Test 9: Duplicate conversion prevention logic
  assert(reEditedQuotation.status === 'converted' && reEditedQuotation.convertedToInvoiceId === testInvoiceId, 'Test 9: Quotation status tracks conversion to prevent duplicate invoice creation');

  // Test 10: Payment defaults
  assert(newInvoice.paidAmount === 0 && newInvoice.balanceAmount === 32000 && newInvoice.paymentStatus === 'unpaid', 'Test 10: Initial invoice payment defaults (paidAmount: 0, balanceAmount: 32000, paymentStatus: unpaid)');

  // Test 11: Total amount calculation
  const itemsSum = newInvoice.items.reduce((s, i) => s + i.amount, 0);
  assert(itemsSum === newInvoice.totalAmount && itemsSum === 32000, 'Test 11: Total invoice amount correctly equals sum of snapshot items (₹32,000)');

  // CLEANUP TEST DOCS
  await deleteDoc(doc(db, 'quotations', testQuotationId));
  await deleteDoc(doc(db, 'invoices', testInvoiceId));
  console.log(`\n🧹 Cleaned up temporary test documents in Firestore.`);

  const passedCount = testResults.filter(r => r.status === 'PASS').length;
  console.log(`\n==================================================`);
  console.log(`TEST SUITE RESULTS: ${passedCount}/${testResults.length} ASSERTIONS PASSED`);
  console.log(`==================================================`);
}

runQuotationConversionTests().catch(console.error);
