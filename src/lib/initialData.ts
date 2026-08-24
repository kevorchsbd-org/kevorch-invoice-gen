import { Client, Quotation, Invoice, BalanceInvoice, Payment, FileRecord, ActivityLog, EmailLog, AppSettings } from '../types';

export const initialCompanyProfile = {
  companyName: "KEVORCH SBD",
  email: "kevorchsbd@gmail.com",
  phone: "+91 98765 43210",
  address: "124 Business Tech Park, Ground Floor",
  city: "Coimbatore",
  state: "Tamil Nadu",
  pincode: "641004",
  logoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80",
  signatureUrl: "https://images.unsplash.com/photo-1598257006458-087169a1f08d?w=300&auto=format&fit=crop&q=80"
};

export const initialSettings: AppSettings = {
  company: initialCompanyProfile,
  quotation: {
    prefix: "QTN-2026-",
    nextNumber: 101,
    defaultValidityDays: 15,
    defaultPaymentTerms: "50% Advance on order confirmation, 50% Balance on completion before delivery.",
    defaultNotes: "Thank you for considering KEVORCH SBD. We assure you of our prompt and best professional service.",
    defaultTermsAndConditions: "1. Quotation valid for 15 days from issue date.\n2. Any additional work beyond scope will be billed separately.\n3. Taxes not applicable unless specified."
  },
  invoice: {
    prefix: "INV-2026-",
    nextNumber: 201,
    defaultPaymentTerms: "50% Advance received. Balance payable upon delivery/project completion.",
    defaultNotes: "Thank you for doing business with KEVORCH SBD. Please make payments via bank transfer or UPI.",
    defaultTermsAndConditions: "1. Goods/Services once rendered are non-refundable.\n2. Please mention Invoice Number in payment reference."
  },
  balanceInvoice: {
    prefix: "BAL-2026-",
    nextNumber: 301
  },
  theme: 'light'
};

export const initialClients: Client[] = [];
export const initialQuotations: Quotation[] = [];
export const initialInvoices: Invoice[] = [];
export const initialBalanceInvoices: BalanceInvoice[] = [];
export const initialPayments: Payment[] = [];
export const initialFiles: FileRecord[] = [];
export const initialActivityLogs: ActivityLog[] = [];
export const initialEmailLogs: EmailLog[] = [];
