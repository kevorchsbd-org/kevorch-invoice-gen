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
