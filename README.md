# 💼 Enterprise Invoice & Financial Management System

An enterprise-grade, full-stack **Invoice & Financial Tracking Web Application** built with **React**, **TypeScript**, **Vite**, **Tailwind CSS**, and **Firebase** (with **IndexedDB** local storage fallback).

---

## 📋 Table of Contents

- [✨ Core Features](#-core-features)
- [🔄 End-to-End Workflow Architecture](#-end-to-end-workflow-architecture)
- [📊 Module Breakdown](#-module-breakdown)
  - [1. Executive Dashboard & Analytics](#1-executive-dashboard--analytics)
  - [2. Client 360° Management & Workspace](#2-client-360-management--workspace)
  - [3. Quotation Management System](#3-quotation-management-system)
  - [4. Invoice Management & Automated Calculations](#4-invoice-management--automated-calculations)
  - [5. Payment Receipt & Ledger Tracking](#5-payment-receipt--ledger-tracking)
  - [6. Balance Invoice Generation](#6-balance-invoice-generation)
  - [7. Centralized File Library & Vault](#7-centralized-file-library--vault)
  - [8. System Settings & Customization](#8-system-settings--customization)
- [🏗️ Hybrid Storage & Data Architecture](#-hybrid-storage--data-architecture)
- [📄 Document Engine & PDF Export](#-document-engine--pdf-export)
- [📁 Project Folder Structure](#-project-folder-structure)
- [⚡ Quick Start & Setup Guide](#-quick-start--setup-guide)
- [🛠️ Tech Stack & Dependencies](#-tech-stack--dependencies)
- [🚀 Deployment](#-deployment)

---

## ✨ Core Features

- 📑 **Complete Document Lifecycle**: Create Quotations $\rightarrow$ Convert to Invoices $\rightarrow$ Record Payments $\rightarrow$ Generate Balance Invoices.
- 💰 **Automated Balance & Payment Status**: Real-time status updates (`unpaid`, `partially_paid`, `fully_paid`) based on cumulative payment entries.
- 🏢 **Client Workspaces**: 360-degree view of client profiles, transaction histories, stored files, and activity logs.
- 🖨️ **PDF Generation**: High-fidelity PDF document export with company branding, client logos, and authorized signatures.
- 🔒 **Hybrid Data Sync**: Uses **Firebase Firestore & Storage** as primary cloud layer with automatic **IndexedDB** fallback for offline operation.
- 🎨 **Modern Design & Micro-Interactions**: Built using Tailwind CSS, Framer Motion animations, Lucide icons, and celebratory confetti upon full invoice payments.

---

## 🔄 End-to-End Workflow Architecture

```text
┌────────────────────────┐
│  Create Quotation      │ ── (Proposal with line items, terms & logo)
└───────────┬────────────┘
            │ 
            ▼  (Convert to Invoice)
┌────────────────────────┐
│  Invoice Generated     │ ── Total Amount: ₹50,000 | Paid: ₹0 | Balance: ₹50,000
└───────────┬────────────┘    Status: UNPAID
            │
            ├───► Record Payment #1: ₹20,000 (Via UPI/Cash/Bank)
            │          │
            │          ▼
            │     Invoice Updated ── Total Amount: ₹50,000 | Paid: ₹20,000 | Balance: ₹30,000
            │          │             Status: PARTIALLY_PAID
            │          │
            │          ├───► Generate Balance Invoice ── (Items remaining dues: ₹30,000)
            │          │
            │          └───► Record Payment #2: ₹30,000 (Final Settlement)
            │                     │
            │                     ▼
            └───────────► Invoice Updated ── Total Amount: ₹50,000 | Paid: ₹50,000 | Balance: ₹0
                                          Status: FULLY_PAID 🎉
```

---

## 📊 Module Breakdown

### 1. Executive Dashboard & Analytics
- **Financial Metric Cards**: Instant summary of Total Revenue, Collected Payments, Pending Balances, Active Clients, and Overdue Invoices.
- **Interactive Visual Charts**: Monthly revenue trends, quotation acceptance rates, and payment breakdown.
- **Recent Activity Stream**: Audit logs of recent document creations, payment receipts, and client modifications.

### 2. Client 360° Management & Workspace
- **Client Directory**: Search, filter, add, edit, and delete client business profiles.
- **Dedicated Client Workspace**:
  - Profile details & business contact info.
  - Linked Quotations, Invoices, and Balance Invoices.
  - Dedicated Payment History ledger.
  - Client-specific document vault.
  - Activity log tracking every interaction with the client.

### 3. Quotation Management System
- **Proposal Creation**: Multi-item quotations with customizable quantity, rate, line-item totals, and descriptions.
- **Branding Integration**: Auto-populates company header, logo, client logo, and authorized signature.
- **Lifecycle Tracking**: Statuses include `Draft`, `Sent`, `Accepted`, `Rejected`, `Expired`, and `Converted`.
- **One-Click Conversion**: Instantly convert accepted quotations into official Tax Invoices.

### 4. Invoice Management & Automated Calculations
- **Invoice Lifecycle**: Handles direct invoice creation as well as converted quotations.
- **Automated Math**: Calculates gross total, cumulative paid amount, and remaining balance automatically.
- **Due Date Alerting**: Tracks payment terms and highlights overdue invoices.
- **Real-time Status Sync**: Updates invoice status seamlessly as payments are recorded.

### 5. Payment Receipt & Ledger Tracking
- **Multi-Method Support**: Record receipts via **Cash**, **UPI**, **Bank Transfer (NEFT/RTGS/IMPS)**, **Card**, or **Other**.
- **Reference Tracking**: Store bank transaction IDs, cheque numbers, or UPI reference numbers.
- **Payment Receipts**: Print and download itemized payment receipt vouchers.

### 6. Balance Invoice Generation
- **Automated Partial-Payment Billing**: When an invoice is partially paid (`balanceAmount > 0`), easily generate a dedicated **Balance Invoice**.
- **Itemized Ledger**: Clearly breaks down Original Invoice Amount, Total Paid to Date, and Net Balance Due.
- **Distinct Numbering**: Managed with configurable prefix sequence (e.g., `BAL-2026-001`).

### 7. Centralized File Library & Vault
- **Categorized Document Storage**: Organize files under *Company Logo*, *Client Logo*, *Signature*, *Company Documents*, *Client Documents*, and *Other Files*.
- **Direct Uploads**: Integrates with Firebase Storage & IndexedDB local store.
- **Quick Attachment**: Pick existing logos or signatures directly inside document editors.

### 8. System Settings & Customization
- **Company Profile**: Customize business name, tax details, address, phone, logo, and digital signature.
- **Document Prefixes & Auto-Numbering**: Customize sequence prefixes (e.g., `QTN-`, `INV-`, `BAL-`) and next sequence numbers.
- **Default Terms & Validity**: Define standard validity periods and default payment terms & conditions.

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
│   │   └── storage.ts          # Unified hybrid storage interface
│   ├── pages/                  # Router Page Components
│   │   ├── auth/               # Login & Authentication pages
│   │   ├── balanceInvoices/    # Balance Invoice listings & detail view
│   │   ├── clients/            # Client list, Client Form modal, Client Workspace
│   │   ├── documents/          # Shared document creation/viewing
│   │   ├── files/              # File Library & Document Vault
│   │   ├── invoices/           # Invoice management & payment recording
│   │   ├── payments/           # Global Payments ledger & history
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

## ⚡ Quick Start & Setup Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **yarn** / **pnpm**

### Installation Steps

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/kevorchsbd-org/kevorch-invoice-gen.git
   cd "invoice projcet"
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory (refer to `.env.example`):
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_firebase_app_id
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

5. **Type Check & Production Build**:
   ```bash
   npm run build
   ```

---

## 🛠️ Tech Stack & Dependencies

- **Frontend Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Cloud Backend**: [Firebase 12](https://firebase.google.com/) (Auth, Firestore, Web Storage, Hosting)
- **Local Database**: Browser [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **PDF Generation**: [html2pdf.js](https://eeko.github.io/html2pdf.js/)
- **Form Handling & Validation**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)

---

## 🚀 Deployment

The project is pre-configured for **Firebase Hosting**:

```bash
# Build production bundle
npm run build

# Deploy to Firebase Hosting
npx firebase deploy --only hosting
```

---

*Developed for Enterprise Financial Management & Seamless Invoicing.*
