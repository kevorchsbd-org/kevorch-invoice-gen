export type PaymentStatus = 'unpaid' | 'partially_paid' | 'fully_paid';
export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'converted' | 'expired';
export type InvoiceStatus = 'draft' | 'sent' | 'overdue' | 'paid';
export type BalanceInvoiceStatus = 'draft' | 'sent' | 'paid';
export type PaymentMethod = 'Cash' | 'UPI' | 'Bank Transfer' | 'Card' | 'Other';
export type FileCategory =
  | 'Company Logo'
  | 'Client Logo'
  | 'Signature'
  | 'Company Documents'
  | 'Client Documents'
  | 'Quotation PDFs'
  | 'Invoice PDFs'
  | 'Balance Invoice PDFs'
  | 'Other Files';


export interface Client {
  id: string;
  name: string;
  companyName: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  logoUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceItem {
  id: string;
  serviceName: string;
  description: string;
  quantity?: number;
  rate?: number;
  amount: number;
}

export interface Quotation {
  id: string;
  quotationNumber: string; // e.g. QTN-2026-001
  quotationDate: string;
  validUntil: string;
  paymentTerms: string;
  clientId: string;
  client: Client;
  items: ServiceItem[];
  totalAmount: number;
  fromDetails: CompanyProfile;
  notes: string;
  termsAndConditions: string;
  companyLogoUrl?: string;
  clientLogoUrl?: string;
  signatureUrl?: string;
  status: QuotationStatus;
  convertedToInvoiceId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. INV-2026-001
  quotationId?: string;
  invoiceDate: string;
  dueDate: string;
  paymentTerms: string;
  clientId: string;
  client: Client;
  items: ServiceItem[];
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: PaymentStatus;
  status: InvoiceStatus;
  fromDetails: CompanyProfile;
  notes: string;
  termsAndConditions: string;
  companyLogoUrl?: string;
  clientLogoUrl?: string;
  signatureUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BalanceInvoice {
  id: string;
  balanceInvoiceNumber: string; // e.g. BAL-2026-001
  originalInvoiceId: string;
  originalInvoiceNumber: string;
  date: string;
  dueDate: string;
  paymentTerms: string;
  clientId: string;
  client: Client;
  items: ServiceItem[];
  originalInvoiceAmount: number;
  amountAlreadyPaid: number;
  balanceAmountDue: number;
  fromDetails: CompanyProfile;
  notes: string;
  termsAndConditions: string;
  companyLogoUrl?: string;
  clientLogoUrl?: string;
  signatureUrl?: string;
  status: BalanceInvoiceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  note?: string;
  operationToken?: string;
  createdAt: string;
}

export interface FileRecord {
  id: string;
  fileName: string;
  category: FileCategory;
  url: string;
  fileSize: number; // bytes
  fileType: string;
  clientId?: string;
  filePath?: string; // Local IndexedDB storage path
  uploadedAt: string;
}

export interface EmailLog {
  id: string;
  recipient: string;
  cc?: string;
  documentType: 'Quotation' | 'Invoice' | 'Balance Invoice';
  documentNumber: string;
  documentId: string;
  subject: string;
  sentDate: string;
  status: 'Sent' | 'Failed' | 'Pending';
}

export interface ActivityLog {
  id: string;
  clientId: string;
  clientName: string;
  action: string;
  description: string;
  timestamp: string;
}

export interface CompanyProfile {
  companyName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  logoUrl?: string;
  signatureUrl?: string;
}

export interface AppSettings {
  company: CompanyProfile;
  quotation: {
    prefix: string;
    nextNumber: number;
    defaultValidityDays: number;
    defaultPaymentTerms: string;
    defaultNotes: string;
    defaultTermsAndConditions: string;
  };
  invoice: {
    prefix: string;
    nextNumber: number;
    defaultPaymentTerms: string;
    defaultNotes: string;
    defaultTermsAndConditions: string;
  };
  balanceInvoice: {
    prefix: string;
    nextNumber: number;
  };
  theme: 'light' | 'dark';
}
