# Invoice Project

An enterprise-grade Invoice Management Application built with **React**, **TypeScript**, **Vite**, **Firebase**, and **Supabase**.

---

## ⚡ Overview & Hybrid Cloud Architecture

This application utilizes a dual-cloud strategy for maximum performance, security, and scalability:

- **Firebase Authentication**: Single primary authentication system for all users.
- **Firebase Cloud Firestore**: Primary database for business records (Clients, Quotations, Invoices, Payments, Settings).
- **Firebase Cloud Functions**: Trusted backend layer for secure storage operations, email dispatch, and secret management.
- **Supabase Storage**: Private, secure document and file storage in the `documents` bucket.

```
React Frontend (Vite)
    │
    ├── (1) Firebase Auth ID Token Validation
    ▼
Firebase Cloud Function (HTTPS Callable)
    │
    ├── (2) Validates context.auth + payload size/MIME type
    ├── (3) Executes with SUPABASE_SERVICE_ROLE_KEY (Server Secret)
    ▼
Supabase Private Bucket ("documents")
```

---

## 💳 Payment & Balance Management Workflow

The application implements an automated, real-time financial tracking workflow that connects **Quotations**, **Invoices**, **Client Payments**, **Balance Invoices**, and **Dashboard Analytics**.

```
[Quotation Created]
       │ (Convert to Invoice)
       ▼
[Invoice Created] ──► Total: ₹50,000 | Paid: ₹0 | Balance: ₹50,000 | Status: UNPAID
       │
       ├──► [Client Pays ₹20,000] (Record Payment)
       │          │
       │          ▼
       │    Invoice Updated ──► Total: ₹50,000 | Paid: ₹20,000 | Balance: ₹30,000 | Status: PARTIALLY_PAID
       │          │
       │          ├──► [Generate Balance Invoice] ──► Bills remaining ₹30,000 due
       │          │
       │          └──► [Client Pays ₹30,000] (Record Final Payment)
       │                     │
       │                     ▼
       └────────► Invoice Updated ──► Total: ₹50,000 | Paid: ₹50,000 | Balance: ₹0 | Status: FULLY_PAID
```

### Detailed Lifecycle Stages:

1. **Quotation Stage (`Quotations`)**:
   - Create a proposal with multi-point deliverables (`\n` newline bullets) and projected total amount (`totalAmount`).
   - Printable PDF preview with left/right hierarchy and brand red accent header.

2. **Invoice Generation Stage (`Invoices`)**:
   - Convert Quotation or create an Invoice directly.
   - Initial Invoice state:
     - `totalAmount`: Gross value of project items.
     - `paidAmount`: `0`
     - `balanceAmount`: `totalAmount`
     - `paymentStatus`: `'unpaid'`

3. **Payment Receipt Stage (`addPayment`)**:
   - Record payments via Cash, UPI, Bank Transfer (NEFT/RTGS/IMPS), Card, or Other.
   - Real-time automatic recalculation across the parent Invoice:
     - `paidAmount` = `sum(all payments linked to this invoice)`
     - `balanceAmount` = `max(0, totalAmount - paidAmount)`
     - `paymentStatus`:
       - `paidAmount === 0` $\rightarrow$ `'unpaid'`
       - `0 < paidAmount < totalAmount` $\rightarrow$ `'partially_paid'`
       - `paidAmount >= totalAmount` $\rightarrow$ `'fully_paid'` (triggers confetti 🎉)

4. **Balance Invoice Stage (`createBalanceInvoiceFromInvoice`)**:
   - When an invoice is in `'partially_paid'` state (`balanceAmount > 0`), click **"Bal Inv"** / **Create Balance Invoice**.
   - Generates a dedicated **Balance Invoice** document explicitly itemizing:
     - `originalInvoiceNumber`
     - `originalTotalAmount`
     - `totalPaidSoFar`
     - `balanceAmountDue`

5. **Payment Deletion / Recalculation**:
   - Deleting or editing a payment entry triggers an automatic recalculation across `paidAmount`, `balanceAmount`, `paymentStatus`, and client metrics.

6. **Dashboard & Financial KPI Analytics**:
   - **Total Gross Invoice Value**: Sum of `totalAmount` across all invoices.
   - **Amount Received**: Sum of all recorded client payment receipts (symbolized with `IndianRupee` ₹).
   - **Balance Outstanding**: `Total Gross Invoice Value - Amount Received`.
   - **Pending Invoices**: Count of all unpaid or partially paid invoices.

---

## 🔒 Supabase Storage Backend-Mediated Security Model

- **Bucket Name**: `documents`
- **Visibility**: `private` (`public = false`)
- **File Size Limit**: `50 MB` (52,428,800 bytes)
- **Allowed MIME Types**: `image/png`, `image/jpeg`, `image/jpg`, `image/webp`, `application/pdf`
- **Access Control**: All privileged storage operations (`uploadStorageFile`, `deleteStorageFile`, `getSignedStorageUrl`) are mediated via Firebase HTTPS Callable Functions.
- **Zero Browser Secret Exposure**: The Supabase Service-Role Key (`SUPABASE_SERVICE_ROLE_KEY`) is stored strictly in server-side configuration / Secret Manager and is **NEVER** exposed to the React frontend, `VITE_*` environment variables, build output (`dist`), or browser console.

---

## ⚙️ Environment Configuration

### Frontend `.env` (Public Configuration Only)
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id

# Supabase Storage Configuration (Public URL & Publishable Key only)
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

### Firebase Cloud Functions Secrets Configuration
Store server secrets securely using Firebase Secret Manager:
```bash
firebase functions:secrets:set SUPABASE_URL
firebase functions:secrets:set SUPABASE_SERVICE_ROLE_KEY
```

---

## 🛠️ Backend Cloud Functions & Client API

### Firebase Callable Cloud Functions ([`functions/src/index.ts`](file:///d:/company%20projects/kevorch%20documents/invoice%20projcet/functions/src/index.ts))
- `uploadStorageFile`: Validates Firebase user token, verifies file size (<50MB) and MIME type, and uploads to `documents` bucket.
- `deleteStorageFile`: Validates Firebase user token and deletes target file from `documents` bucket.
- `getSignedStorageUrl`: Validates Firebase user token and returns a 1-hour signed URL for file access.

### Client Helper Module ([`src/lib/supabase.ts`](file:///d:/company%20projects/kevorch%20documents/invoice%20projcet/src/lib/supabase.ts))
- `uploadDocumentFile(path, fileOrBase64, fileType)`: Converts browser File/Base64 and calls `uploadStorageFile`.
- `deleteDocumentFile(filePath)`: Calls `deleteStorageFile`.
- `getFileAccessUrl(filePath, expiresInSeconds)`: Calls `getSignedStorageUrl` for secure temporary viewing URLs.

---

## 🚀 Build & Verification Commands

1. **Build Backend Functions**:
   ```bash
   cd functions
   npm install
   npm run build
   ```

2. **Frontend Type Check & Production Build**:
   ```bash
   npx tsc --noEmit
   npm run build
   ```

3. **Deploy Functions & Hosting**:
   ```bash
   firebase deploy --only functions
   firebase deploy --only hosting
   ```
