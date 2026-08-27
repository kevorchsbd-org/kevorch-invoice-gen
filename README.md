# Invoice Project

An enterprise-grade Invoice Management Application built with **React**, **TypeScript**, **Vite**, and **Firebase**.

---

## ⚡ Overview & Firebase Architecture

This application operates 100% on **Firebase** (compatible with Firebase Spark Free Tier):

- **Firebase Authentication**: Primary authentication system for email/password and anonymous user login.
- **Firebase Cloud Firestore**: Primary database for business records (Clients, Quotations, Invoices, Payments, System Settings, Activity Logs).
- **Firebase Web Storage**: Direct browser-based file storage for company logos, signatures, client documents, and file library assets.
- **Firebase Hosting**: Production web hosting for single-page applications (SPA).

---

## 💳 Payment & Balance Management Workflow

The application implements an automated, real-time financial tracking workflow connecting **Quotations**, **Invoices**, **Client Payments**, **Balance Invoices**, and **Dashboard Analytics**.

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
       │          ├──► [Generate Balance Invoice] ──► Bills remaining ₹30,000 due
       │          │
       │          └──► [Client Pays ₹30,000] (Record Final Payment)
       │                     │
       │                     ▼
       └────────► Invoice Updated ──► Total: ₹50,000 | Paid: ₹50,000 | Balance: ₹0 | Status: FULLY_PAID
```

### Detailed Lifecycle Stages

1. **Quotation Stage (`Quotations`)**:
   - Create proposals with line items and projected total amount (`totalAmount`).
   - Printable PDF preview with custom branding red accent header.

2. **Invoice Generation Stage (`Invoices`)**:
   - Convert Quotations or create Invoices directly.
   - Real-time tracking of `totalAmount`, `paidAmount`, `balanceAmount`, and `paymentStatus`.

3. **Payment Receipt Stage (`addPayment`)**:
   - Record payments via Cash, UPI, Bank Transfer (NEFT/RTGS/IMPS), Card, or Other.
   - Real-time automatic recalculation of invoice status (`unpaid`, `partially_paid`, `fully_paid`).

4. **Balance Invoice Stage**:
   - When an invoice is partially paid (`balanceAmount > 0`), generate a dedicated **Balance Invoice** itemizing remaining dues.

---

## ⚙️ Environment Configuration

### Frontend `.env`

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

---

## 🚀 Build & Verification Commands

1. **Frontend Type Check & Production Build**:

   ```bash
   npx tsc --noEmit
   npm run build
   ```

2. **Deploy to Firebase Hosting (Spark Plan Free Tier)**:

   ```bash
   npx firebase deploy --only hosting
   ```
