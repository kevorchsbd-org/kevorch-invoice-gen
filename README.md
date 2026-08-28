# Kevorch Invoice Management Application

An enterprise-grade Invoice Management Application built with **React**, **TypeScript**, **Vite**, **Tailwind CSS**, **Firebase**, and **Browser IndexedDB**.

---

## ⚡ Overview & Approved Architecture

This application operates 100% on the **Firebase Spark (Free) Plan** combined with **Browser Local Storage**:

- **Firebase Authentication**: User login and authentication management.
- **Firebase Cloud Firestore**: Cloud source of truth for business metadata and transactions (`clients`, `quotations`, `invoices`, `balanceInvoices`, `payments`, `files`, `activityLogs`, `emailLogs`).
- **Firebase Hosting**: Production web hosting for single-page applications (SPA).
- **Browser IndexedDB (`kevorch-invoice-local`)**: Device-local binary storage for company logos, signatures, client logos, generated PDFs (`quotationFiles`, `invoiceFiles`, `balanceInvoiceFiles`), and document attachments (`otherFiles`).
- **Client-Side PDF Generation**: Pure client-side PDF rendering via HTML/CSS canvas and `html2pdf.js`.
- **Browser Mail Workflow**: Email preparation via browser `mailto` client.

### 🚫 Omitted Cloud Services (100% Spark Free Plan Compatible)
- **No Firebase Storage**
- **No Supabase Storage**
- **No Cloud Functions**
- **No Paid Backend / Blaze Services**

---

## 📱 Device-Local Storage Rules & Limitations

> [!IMPORTANT]
> **Data Separation & Device Limitation**:
> 1. **Firestore Cloud Records**: Business records (Clients, Quotations, Invoices, Payments, Settings) are stored in Cloud Firestore and sync across authenticated sessions.
> 2. **IndexedDB Local Files**: Logos, signatures, generated PDFs, and custom attachments are stored in the browser's IndexedDB database (`kevorch-invoice-local`).
> 3. **Device Limitation**: Locally stored assets/PDFs do NOT automatically synchronize to another computer or browser.
> 4. **Browser Data Safeguard**: Clearing browser cache or site data may remove locally stored IndexedDB files. Firestore business records remain untouched in the cloud.

---

## 💳 Payment & Balance Management Workflow

The application implements an automated financial tracking workflow connecting **Quotations**, **Invoices**, **Client Payments**, **Balance Invoices**, and **Dashboard Analytics**.

```text
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
       │          ├──► [Generate Balance Invoice] ──► Bills remaining ₹30,000 due (BAL-2026-001)
       │          │
       │          └──► [Client Pays ₹30,000] (Record Final Payment)
       │                     │
       │                     ▼
       └────────► Invoice Updated ──► Total: ₹50,000 | Paid: ₹50,000 | Balance: ₹0 | Status: FULLY_PAID
```

---

## 🧮 Payment Calculation & Ledger Integrity Rules

### Executive Dashboard Metrics
```text
Total Invoice Value  =  sum(invoice.totalAmount)
Amount Received      =  sum(invoice.paidAmount)
Outstanding Balance  =  sum(invoice.balanceAmount)
```

### Invoice Payment Status Rules
- **`unpaid`**: `paidAmount === 0`
- **`partially_paid`**: `paidAmount > 0 && paidAmount < totalAmount`
- **`fully_paid`**: `paidAmount >= totalAmount`

### Payment Validation & Double-Click Protection
1. **Balance Limit Enforcement**: No payment can exceed the invoice's current outstanding balance (`paymentAmount <= invoice.balanceAmount`). If a user attempts to record a payment exceeding the balance, the transaction is rejected with: `"Payment amount cannot exceed the remaining invoice balance."`
2. **Double-Click & Rapid Submission Protection**: `RecordPaymentModal` locks form inputs and disables submit buttons during active network requests. Each payment generates an idempotent client-side operation token (`operationToken`) to prevent duplicate Firestore document creation.
3. **Ledger Synchronization**: Whenever a payment entry is recorded or removed, the system calculates the sum of all valid payment records linked to that `invoiceId`, updating `invoice.paidAmount`, `invoice.balanceAmount`, and `invoice.paymentStatus` atomically.
4. **Multi-Tab Realtime Synchronization**: Powered by Firebase Firestore `onSnapshot` real-time listeners. Any payment recorded or updated in one browser tab instantly syncs and refreshes the Dashboard and Invoice statuses across all open tabs.
5. **Safe Date Handling**: All timestamps (`createdAt`, `paymentDate`, `invoiceDate`, `dueDate`) are normalized using `getSafeTime()` helpers to support string ISO dates, Firebase Timestamp objects, and numerical values without producing `NaN` errors.

---

## ⚙️ Environment Configuration

### Frontend `.env`

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

---

## 🏗️ Hybrid Storage & Data Architecture

```text
┌────────────────────────────────────────────────────────────┐
│                    React Web Application                   │
└──────────────┬──────────────────────────────┬──────────────┘
               │                              │
               ▼ (Primary Cloud Sync)         ▼ (Offline Fallback)
  ┌─────────────────────────┐    ┌─────────────────────────┐
  │   Firebase Firestore    │    │   IndexedDB (Browser)   │
  │     & Web Storage       │    │     Local Storage       │
  └─────────────────────────┘    └─────────────────────────┘
```

- **Cloud First**: When online and configured, all records are safely synced to **Firebase Cloud Firestore** and **Firebase Storage**.
- **Offline Resilience**: Seamless fallback to browser **IndexedDB** guarantees fast, uninterrupted performance without cloud dependencies.

---

## 📄 Document Engine & PDF Export

- Built with **`html2pdf.js`** to convert styled HTML invoice templates into pixel-perfect PDF documents.
- **Custom Branding**: Professional layout with customizable red accent headers, corporate logos, line item tables, notes, payment terms, and authorized digital signatures.
- **Document Modal**: Full-screen preview modal with print and export capabilities.

---

## 📁 Project Folder Structure

```text
invoice-project/
├── .firebase/                  # Firebase hosting configuration cache
├── functions/                  # Firebase Cloud Functions source & tsconfig
├── public/                     # Static public assets
├── src/
│   ├── components/             # Reusable UI Components
│   │   ├── common/             # Modals, Client Logo, Buttons, Loaders
│   │   ├── documents/          # PDF Templates (Invoice, Balance Invoice, Quotation)
│   │   └── layout/             # Header, Navigation Sidebar, Main Layout
│   ├── context/                # Global React Context (DataContext for state & sync)
│   ├── lib/                    # Storage & Database abstractions
│   │   ├── firebase.ts         # Firebase initialization & cloud operations
│   │   ├── indexedDb.ts        # IndexedDB storage provider
│   │   ├── reconciliationUtils.ts # Multi-attribute duplicate analysis & backup export
│   │   └── storage.ts          # Unified hybrid storage interface
│   ├── pages/                  # Router Page Components
│   │   ├── auth/               # Login & Authentication pages
│   │   ├── balanceInvoices/    # Balance Invoice listings & detail view
│   │   ├── clients/            # Client list, Client Form modal, Client Workspace
│   │   ├── documents/          # Shared document creation/viewing
│   │   ├── files/              # File Library & Document Vault
│   │   ├── invoices/           # Invoice management & payment recording
│   │   ├── payments/           # Global Payments ledger, history & Reconciliation UI
│   │   ├── quotations/         # Quotation management & conversion
│   │   ├── Dashboard.tsx       # Main Executive Analytics Dashboard
│   │   └── Settings.tsx        # System configuration page
│   ├── types/                  # TypeScript interface & type definitions
│   ├── App.tsx                 # Core App router & layout container
│   ├── index.css               # Base CSS styles & Tailwind configuration
│   └── main.tsx                # Application entry point
├── firebase.json               # Firebase deployment & hosting setup
├── package.json                # npm dependencies & build scripts
├── README.md                   # Project documentation
├── tsconfig.json               # TypeScript configuration
└── vite.config.ts              # Vite bundle configuration
```

---

## 🚀 Build & Deployment Commands

1. **Type Check & Production Build**:

   ```bash
   npx tsc --noEmit
   npm run build
   ```

2. **Deploy to Firebase Hosting (Spark Plan Free Tier)**:

   ```bash
   npx firebase deploy --only hosting
   ```
