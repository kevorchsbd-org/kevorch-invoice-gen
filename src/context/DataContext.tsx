import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Client, Quotation, Invoice, BalanceInvoice, Payment, FileRecord,
  ActivityLog, EmailLog, AppSettings, PaymentStatus
} from '../types';
import {
  initialClients, initialQuotations, initialInvoices, initialBalanceInvoices,
  initialPayments, initialFiles, initialActivityLogs, initialEmailLogs, initialSettings
} from '../lib/initialData';
import { db, auth, isFirebaseConfigured } from '../lib/firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { deleteClientAsset } from '../lib/indexedDb';

interface DataContextType {
  clients: Client[];
  quotations: Quotation[];
  invoices: Invoice[];
  balanceInvoices: BalanceInvoice[];
  payments: Payment[];
  files: FileRecord[];
  activityLogs: ActivityLog[];
  emailLogs: EmailLog[];
  settings: AppSettings;
  isLoading: boolean;
  error: string | null;

  // Client Actions
  addClient: (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Client>;
  updateClient: (id: string, clientData: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  getClientById: (id: string) => Client | undefined;

  // Quotation Actions
  addQuotation: (quotationData: Omit<Quotation, 'id' | 'quotationNumber' | 'totalAmount' | 'createdAt' | 'updatedAt'>) => Promise<Quotation>;
  updateQuotation: (id: string, quotationData: Partial<Quotation>) => Promise<void>;
  deleteQuotation: (id: string) => Promise<void>;
  convertQuotationToInvoice: (quotationId: string) => Promise<Invoice>;

  // Invoice Actions
  addInvoice: (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'totalAmount' | 'paidAmount' | 'balanceAmount' | 'paymentStatus' | 'createdAt' | 'updatedAt'>) => Promise<Invoice>;
  updateInvoice: (id: string, invoiceData: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  createBalanceInvoiceFromInvoice: (invoiceId: string) => Promise<BalanceInvoice>;

  // Balance Invoice Actions
  addBalanceInvoice: (balanceData: Omit<BalanceInvoice, 'id' | 'balanceInvoiceNumber' | 'createdAt' | 'updatedAt'>) => Promise<BalanceInvoice>;
  updateBalanceInvoice: (id: string, balanceData: Partial<BalanceInvoice>) => Promise<void>;
  deleteBalanceInvoice: (id: string) => Promise<void>;

  // Payment Actions
  addPayment: (paymentData: Omit<Payment, 'id' | 'createdAt'>) => Promise<Payment>;
  deletePayment: (id: string) => Promise<void>;
  reconcileAndCleanupPayments: (selectedPaymentIds: string[], auditReasons?: Record<string, string>) => Promise<void>;

  // File Actions
  addFile: (fileData: Omit<FileRecord, 'id' | 'uploadedAt'>) => Promise<FileRecord>;
  deleteFile: (id: string) => Promise<void>;

  // Email Log Actions
  addEmailLog: (emailData: Omit<EmailLog, 'id' | 'sentDate'>) => Promise<EmailLog>;

  // Settings Actions
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  toggleTheme: () => void;

  // Reset Data Action
  resetAllData: () => Promise<void>;

  // Activity Log Helper
  logActivity: (clientId: string, clientName: string, action: string, description: string) => Promise<void>;

  // Application Usage Metrics (Tracked Session Operations)
  usageMetrics: {
    trackedReads: number;
    trackedWrites: number;
    trackedDeletes: number;
    lastUpdated: string;
  };
  refreshMetrics: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CLIENTS: 'kevorch_clients',
  QUOTATIONS: 'kevorch_quotations',
  INVOICES: 'kevorch_invoices',
  BALANCE_INVOICES: 'kevorch_balance_invoices',
  PAYMENTS: 'kevorch_payments',
  FILES: 'kevorch_files',
  ACTIVITY_LOGS: 'kevorch_activity_logs',
  EMAIL_LOGS: 'kevorch_email_logs',
  SETTINGS: 'kevorch_settings'
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    return saved ? JSON.parse(saved) : initialClients;
  });

  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.QUOTATIONS);
    return saved ? JSON.parse(saved) : initialQuotations;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INVOICES);
    return saved ? JSON.parse(saved) : initialInvoices;
  });

  const [balanceInvoices, setBalanceInvoices] = useState<BalanceInvoice[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BALANCE_INVOICES);
    return saved ? JSON.parse(saved) : initialBalanceInvoices;
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
    return saved ? JSON.parse(saved) : initialPayments;
  });

  const [files, setFiles] = useState<FileRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FILES);
    return saved ? JSON.parse(saved) : initialFiles;
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS);
    return saved ? JSON.parse(saved) : initialActivityLogs;
  });

  const [emailLogs, setEmailLogs] = useState<EmailLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EMAIL_LOGS);
    return saved ? JSON.parse(saved) : initialEmailLogs;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return saved ? JSON.parse(saved) : initialSettings;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [usageMetrics, setUsageMetrics] = useState({
    trackedReads: 0,
    trackedWrites: 0,
    trackedDeletes: 0,
    lastUpdated: new Date().toISOString()
  });

  const recordReads = (count: number) => {
    setUsageMetrics(prev => ({
      ...prev,
      trackedReads: prev.trackedReads + Math.max(1, count),
      lastUpdated: new Date().toISOString()
    }));
  };

  const recordWrites = (count: number = 1) => {
    setUsageMetrics(prev => ({
      ...prev,
      trackedWrites: prev.trackedWrites + count,
      lastUpdated: new Date().toISOString()
    }));
  };

  const recordDeletes = (count: number = 1) => {
    setUsageMetrics(prev => ({
      ...prev,
      trackedDeletes: prev.trackedDeletes + count,
      lastUpdated: new Date().toISOString()
    }));
  };

  const refreshMetrics = () => {
    setUsageMetrics(prev => ({
      ...prev,
      lastUpdated: new Date().toISOString()
    }));
  };

  const getSafeTime = (dateVal: any): number => {
    if (!dateVal) return 0;
    if (typeof dateVal === 'object' && 'seconds' in dateVal) {
      return dateVal.seconds * 1000;
    }
    const time = new Date(dateVal).getTime();
    return isNaN(time) ? 0 : time;
  };

  // Sync to Firestore in real-time when Firebase is configured & user is authenticated
  useEffect(() => {
    if (!isFirebaseConfigured() || typeof auth === 'undefined' || !auth) {
      setIsLoading(false);
      return;
    }

    let unsubscribers: (() => void)[] = [];

    const setupListeners = () => {
      unsubscribers.forEach(unsub => unsub());
      unsubscribers = [];

      try {
        // 1. Clients
        unsubscribers.push(
          onSnapshot(collection(db, 'clients'), (snapshot) => {
            const list: Client[] = [];
            snapshot.forEach(doc => list.push({ ...doc.data(), id: doc.id } as Client));
            setClients(list.sort((a, b) => getSafeTime(b.createdAt) - getSafeTime(a.createdAt)));
            recordReads(snapshot.docs.length);
            setIsLoading(false);
          }, err => {
            console.warn('Clients snapshot listener warning:', err);
            setIsLoading(false);
          })
        );

        // 2. Quotations
        unsubscribers.push(
          onSnapshot(collection(db, 'quotations'), (snapshot) => {
            const list: Quotation[] = [];
            snapshot.forEach(doc => list.push({ ...doc.data(), id: doc.id } as Quotation));
            setQuotations(list.sort((a, b) => getSafeTime(b.createdAt) - getSafeTime(a.createdAt)));
            recordReads(snapshot.docs.length);
            setIsLoading(false);
          }, err => console.warn('Quotations snapshot listener warning:', err))
        );

        // 3. Invoices
        unsubscribers.push(
          onSnapshot(collection(db, 'invoices'), (snapshot) => {
            const list: Invoice[] = [];
            snapshot.forEach(doc => list.push({ ...doc.data(), id: doc.id } as Invoice));
            setInvoices(list.sort((a, b) => getSafeTime(b.createdAt) - getSafeTime(a.createdAt)));
            recordReads(snapshot.docs.length);
            setIsLoading(false);
          }, err => console.warn('Invoices snapshot listener warning:', err))
        );

        // 4. Balance Invoices
        unsubscribers.push(
          onSnapshot(collection(db, 'balanceInvoices'), (snapshot) => {
            const list: BalanceInvoice[] = [];
            snapshot.forEach(doc => list.push({ ...doc.data(), id: doc.id } as BalanceInvoice));
            setBalanceInvoices(list.sort((a, b) => getSafeTime(b.createdAt) - getSafeTime(a.createdAt)));
            recordReads(snapshot.docs.length);
            setIsLoading(false);
          }, err => console.warn('BalanceInvoices snapshot listener warning:', err))
        );

        // 5. Payments
        unsubscribers.push(
          onSnapshot(collection(db, 'payments'), (snapshot) => {
            const list: Payment[] = [];
            snapshot.forEach(doc => list.push({ ...doc.data(), id: doc.id } as Payment));
            setPayments(list.sort((a, b) => getSafeTime(b.createdAt) - getSafeTime(a.createdAt)));
            recordReads(snapshot.docs.length);
            setIsLoading(false);
          }, err => console.warn('Payments snapshot listener warning:', err))
        );

        // 6. Files
        unsubscribers.push(
          onSnapshot(collection(db, 'files'), (snapshot) => {
            const list: FileRecord[] = [];
            snapshot.forEach(doc => list.push({ ...doc.data(), id: doc.id } as FileRecord));
            setFiles(list.sort((a, b) => getSafeTime(b.uploadedAt) - getSafeTime(a.uploadedAt)));
            recordReads(snapshot.docs.length);
            setIsLoading(false);
          }, err => console.warn('Files snapshot listener warning:', err))
        );

        // 7. Activity Logs
        unsubscribers.push(
          onSnapshot(collection(db, 'activityLogs'), (snapshot) => {
            const list: ActivityLog[] = [];
            snapshot.forEach(doc => list.push({ ...doc.data(), id: doc.id } as ActivityLog));
            setActivityLogs(list.sort((a, b) => getSafeTime(b.timestamp) - getSafeTime(a.timestamp)));
            recordReads(snapshot.docs.length);
            setIsLoading(false);
          }, err => console.warn('ActivityLogs snapshot listener warning:', err))
        );

        // 8. Email Logs
        unsubscribers.push(
          onSnapshot(collection(db, 'emailLogs'), (snapshot) => {
            const list: EmailLog[] = [];
            snapshot.forEach(doc => list.push({ ...doc.data(), id: doc.id } as EmailLog));
            setEmailLogs(list.sort((a, b) => getSafeTime(b.sentDate) - getSafeTime(a.sentDate)));
            recordReads(snapshot.docs.length);
            setIsLoading(false);
          }, err => console.warn('EmailLogs snapshot listener warning:', err))
        );

        // 9. Settings
        unsubscribers.push(
          onSnapshot(doc(db, 'settings', 'company_settings'), (snapshot) => {
            if (snapshot.exists()) {
              setSettings(snapshot.data() as AppSettings);
            }
            recordReads(1);
            setIsLoading(false);
          }, err => console.warn('Settings snapshot listener warning:', err))
        );
      } catch (err: any) {
        console.error('Firestore listener error:', err);
        setIsLoading(false);
      }
    };

    const authUnsubscribe = onAuthStateChanged(auth, (user: FirebaseUser | null) => {
      if (user) {
        setupListeners();
      } else {
        // Unsubscribe listeners when user logs out
        unsubscribers.forEach(unsub => unsub());
        unsubscribers = [];
        setIsLoading(false);
      }
    });

    return () => {
      authUnsubscribe();
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  // Sync to LocalStorage as cache / UI preferences
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients)); }, [clients]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.QUOTATIONS, JSON.stringify(quotations)); }, [quotations]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices)); }, [invoices]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.BALANCE_INVOICES, JSON.stringify(balanceInvoices)); }, [balanceInvoices]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments)); }, [payments]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files)); }, [files]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(activityLogs)); }, [activityLogs]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.EMAIL_LOGS, JSON.stringify(emailLogs)); }, [emailLogs]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  // Firestore Write Helpers
  const persistToFirestore = async (colName: string, docId: string, data: any) => {
    if (isFirebaseConfigured()) {
      if (!auth.currentUser) {
        console.warn(`[Firestore Write Warning] Unauthenticated request for ${colName}/${docId}. Attempting auth check...`);
      } else {
        console.log(`[Firestore Write] User: ${auth.currentUser.email} (${auth.currentUser.uid}) -> Writing ${colName}/${docId}`);
      }

      try {
        await setDoc(doc(db, colName, docId), data, { merge: true });
        recordWrites(1);
        console.log(`✅ [Firestore Write Success] ${colName}/${docId}`);
      } catch (err: any) {
        console.error(`❌ [Firestore Write Error] ${colName}/${docId}:`, err);
        throw new Error(`Cloud Firestore Write Failed (${colName}/${docId}): ${err.message}`);
      }
    }
  };

  const removeFromFirestore = async (colName: string, docId: string) => {
    if (isFirebaseConfigured()) {
      if (auth.currentUser) {
        console.log(`[Firestore Delete] User: ${auth.currentUser.email} (${auth.currentUser.uid}) -> Deleting ${colName}/${docId}`);
      }

      try {
        await deleteDoc(doc(db, colName, docId));
        recordDeletes(1);
        console.log(`✅ [Firestore Delete Success] ${colName}/${docId}`);
      } catch (err: any) {
        console.error(`❌ [Firestore Delete Error] ${colName}/${docId}:`, err);
        throw new Error(`Cloud Firestore Delete Failed (${colName}/${docId}): ${err.message}`);
      }
    }
  };

  // Helper for logging activity
  const logActivity = async (clientId: string, clientName: string, action: string, description: string) => {
    const newLog: ActivityLog = {
      id: `act_${Date.now()}`,
      clientId,
      clientName,
      action,
      description,
      timestamp: new Date().toISOString()
    };
    setActivityLogs(prev => [newLog, ...prev]);
    await persistToFirestore('activityLogs', newLog.id, newLog);
  };

  // Client CRUD
  const addClient = async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> => {
    const newClient: Client = {
      ...clientData,
      id: `cli_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setClients(prev => [newClient, ...prev]);
    await persistToFirestore('clients', newClient.id, newClient);
    await logActivity(newClient.id, newClient.name, 'Client Created', `Created client ${newClient.name} (${newClient.companyName})`);
    return newClient;
  };

  const updateClient = async (id: string, clientData: Partial<Client>) => {
    const updatedFields = { ...clientData, updatedAt: new Date().toISOString() };
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updatedFields } : c));
    await persistToFirestore('clients', id, updatedFields);
    
    const target = clients.find(c => c.id === id);
    if (target) {
      await logActivity(id, target.name, 'Client Updated', `Updated details for ${target.name}`);
    }
  };

  const deleteClient = async (id: string) => {
    const target = clients.find(c => c.id === id);
    if (target) {
      await logActivity(id, target.name, 'Client Deleted', `Deleted client profile ${target.name}`);
    }
    setClients(prev => prev.filter(c => c.id !== id));
    await removeFromFirestore('clients', id);

    // After successful Firestore deletion, attempt local IndexedDB asset cleanup safely
    try {
      await deleteClientAsset(id);
    } catch (err) {
      console.warn(`[IndexedDB Cleanup Warning] Failed to delete local asset for client ${id}:`, err);
    }
  };

  const getClientById = (id: string) => clients.find(c => c.id === id);

  // Quotation Actions
  const addQuotation = async (quotationData: Omit<Quotation, 'id' | 'quotationNumber' | 'totalAmount' | 'createdAt' | 'updatedAt'>): Promise<Quotation> => {
    const totalAmount = quotationData.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const quotationNum = (quotationData as any).quotationNumber || `${settings.quotation.prefix}${settings.quotation.nextNumber}`;

    const newQuotation: Quotation = {
      ...quotationData,
      id: `qt_${Date.now()}`,
      quotationNumber: quotationNum,
      totalAmount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setQuotations(prev => [newQuotation, ...prev]);
    await persistToFirestore('quotations', newQuotation.id, newQuotation);

    const updatedSettings = {
      ...settings,
      quotation: { ...settings.quotation, nextNumber: settings.quotation.nextNumber + 1 }
    };
    setSettings(updatedSettings);
    await persistToFirestore('settings', 'company_settings', updatedSettings);

    await logActivity(newQuotation.clientId, newQuotation.client.name, 'Quotation Created', `Created Quotation ${newQuotation.quotationNumber} for ₹${newQuotation.totalAmount.toLocaleString('en-IN')}`);
    return newQuotation;
  };

  const updateQuotation = async (id: string, quotationData: Partial<Quotation>) => {
    let updatedQuote: Quotation | null = null;

    setQuotations(prev => prev.map(q => {
      if (q.id === id) {
        const updatedItems = quotationData.items || q.items;
        const totalAmount = updatedItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
        updatedQuote = {
          ...q,
          ...quotationData,
          totalAmount,
          updatedAt: new Date().toISOString()
        };
        return updatedQuote;
      }
      return q;
    }));

    if (updatedQuote) {
      await persistToFirestore('quotations', id, updatedQuote);
    }
  };

  const deleteQuotation = async (id: string) => {
    const target = quotations.find(q => q.id === id);
    if (target) {
      await logActivity(target.clientId, target.client.name, 'Quotation Deleted', `Deleted quotation ${target.quotationNumber}`);
    }
    setQuotations(prev => prev.filter(q => q.id !== id));
    await removeFromFirestore('quotations', id);
  };

  const convertQuotationToInvoice = async (quotationId: string): Promise<Invoice> => {
    const quote = quotations.find(q => q.id === quotationId);
    if (!quote) {
      throw new Error("Quotation not found.");
    }

    if (!quote.items || quote.items.length === 0) {
      throw new Error("Add at least one service before converting this quotation to an invoice.");
    }

    const invNum = `${settings.invoice.prefix}${settings.invoice.nextNumber}`;
    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];

    // Deep copy items, client, and fromDetails to guarantee snapshot independence
    const snapshotItems = quote.items.map(item => ({
      ...item,
      amount: Number(item.amount) || (Number(item.quantity || 1) * Number(item.rate || 0))
    }));

    const totalAmount = snapshotItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    if (isNaN(totalAmount) || totalAmount <= 0) {
      throw new Error("Invalid total amount on quotation. Please verify service item rates and quantities.");
    }

    const snapshotClient = JSON.parse(JSON.stringify(quote.client));
    const snapshotFromDetails = JSON.parse(JSON.stringify(quote.fromDetails));

    const newInvoice: Invoice = {
      id: `inv_${Date.now()}`,
      invoiceNumber: invNum,
      quotationId: quote.id,
      invoiceDate: today,
      dueDate: dueDate,
      paymentTerms: quote.paymentTerms || settings.invoice.defaultPaymentTerms,
      clientId: quote.clientId,
      client: snapshotClient,
      items: snapshotItems,
      totalAmount: totalAmount,
      paidAmount: 0,
      balanceAmount: totalAmount,
      paymentStatus: 'unpaid',
      status: 'sent',
      fromDetails: snapshotFromDetails,
      notes: quote.notes || settings.invoice.defaultNotes,
      termsAndConditions: quote.termsAndConditions || settings.invoice.defaultTermsAndConditions,
      companyLogoUrl: quote.companyLogoUrl || '',
      clientLogoUrl: quote.clientLogoUrl || '',
      signatureUrl: quote.signatureUrl || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setInvoices(prev => [newInvoice, ...prev]);
    await persistToFirestore('invoices', newInvoice.id, newInvoice);

    // Update quotation status in state and Firestore
    const updatedQuote = {
      ...quote,
      status: 'converted' as const,
      convertedToInvoiceId: newInvoice.id,
      updatedAt: new Date().toISOString()
    };

    setQuotations(prev => prev.map(q => q.id === quotationId ? updatedQuote : q));
    await persistToFirestore('quotations', quotationId, updatedQuote);

    // Update invoice sequence in settings
    const updatedSettings = {
      ...settings,
      invoice: { ...settings.invoice, nextNumber: settings.invoice.nextNumber + 1 }
    };
    setSettings(updatedSettings);
    await persistToFirestore('settings', 'company_settings', updatedSettings);

    await logActivity(
      newInvoice.clientId,
      newInvoice.client.name,
      'Quotation Converted to Invoice',
      `Converted Quotation ${quote.quotationNumber} to Invoice ${newInvoice.invoiceNumber} (Invoice ID: ${newInvoice.id}, Quotation ID: ${quote.id})`
    );

    return newInvoice;
  };

  // Invoice Actions
  const addInvoice = async (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'totalAmount' | 'paidAmount' | 'balanceAmount' | 'paymentStatus' | 'createdAt' | 'updatedAt'>): Promise<Invoice> => {
    const totalAmount = invoiceData.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const invNum = (invoiceData as any).invoiceNumber || `${settings.invoice.prefix}${settings.invoice.nextNumber}`;

    const newInvoice: Invoice = {
      ...invoiceData,
      id: `inv_${Date.now()}`,
      invoiceNumber: invNum,
      totalAmount,
      paidAmount: 0,
      balanceAmount: totalAmount,
      paymentStatus: 'unpaid',
      status: 'sent',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setInvoices(prev => [newInvoice, ...prev]);
    await persistToFirestore('invoices', newInvoice.id, newInvoice);

    const updatedSettings = {
      ...settings,
      invoice: { ...settings.invoice, nextNumber: settings.invoice.nextNumber + 1 }
    };
    setSettings(updatedSettings);
    await persistToFirestore('settings', 'company_settings', updatedSettings);

    await logActivity(newInvoice.clientId, newInvoice.client.name, 'Invoice Created', `Created Invoice ${newInvoice.invoiceNumber} for ₹${newInvoice.totalAmount.toLocaleString('en-IN')}`);
    return newInvoice;
  };

  const updateInvoice = async (id: string, invoiceData: Partial<Invoice>) => {
    let updatedInv: Invoice | null = null;

    setInvoices(prev => prev.map(inv => {
      if (inv.id === id) {
        const updatedItems = invoiceData.items || inv.items;
        const totalAmount = updatedItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
        const paidAmount = invoiceData.paidAmount !== undefined ? invoiceData.paidAmount : inv.paidAmount;
        const balanceAmount = Math.max(0, totalAmount - paidAmount);

        let paymentStatus: PaymentStatus = 'unpaid';
        if (paidAmount >= totalAmount && totalAmount > 0) {
          paymentStatus = 'fully_paid';
        } else if (paidAmount > 0) {
          paymentStatus = 'partially_paid';
        }

        updatedInv = {
          ...inv,
          ...invoiceData,
          totalAmount,
          paidAmount,
          balanceAmount,
          paymentStatus,
          status: paymentStatus === 'fully_paid' ? 'paid' : inv.status,
          updatedAt: new Date().toISOString()
        };
        return updatedInv;
      }
      return inv;
    }));

    if (updatedInv) {
      await persistToFirestore('invoices', id, updatedInv);
    }
  };

  const deleteInvoice = async (id: string) => {
    const target = invoices.find(i => i.id === id);
    if (target) {
      await logActivity(target.clientId, target.client.name, 'Invoice Deleted', `Deleted invoice ${target.invoiceNumber}`);
    }
    setInvoices(prev => prev.filter(i => i.id !== id));
    await removeFromFirestore('invoices', id);
  };

  const createBalanceInvoiceFromInvoice = async (invoiceId: string): Promise<BalanceInvoice> => {
    const orig = invoices.find(i => i.id === invoiceId);
    if (!orig) throw new Error("Invoice not found");

    const balNum = `${settings.balanceInvoice.prefix}${settings.balanceInvoice.nextNumber}`;
    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    const balanceAmountDue = Math.max(0, orig.totalAmount - orig.paidAmount);

    const newBalanceInv: BalanceInvoice = {
      id: `bal_${Date.now()}`,
      balanceInvoiceNumber: balNum,
      originalInvoiceId: orig.id,
      originalInvoiceNumber: orig.invoiceNumber,
      date: today,
      dueDate: dueDate,
      paymentTerms: orig.paymentTerms || settings.invoice.defaultPaymentTerms,
      clientId: orig.clientId,
      client: orig.client,
      items: orig.items,
      originalInvoiceAmount: orig.totalAmount,
      amountAlreadyPaid: orig.paidAmount,
      balanceAmountDue: balanceAmountDue,
      fromDetails: orig.fromDetails,
      notes: `Balance Invoice for remaining amount on Invoice ${orig.invoiceNumber}. Total: ₹${orig.totalAmount.toLocaleString('en-IN')}, Paid: ₹${orig.paidAmount.toLocaleString('en-IN')}, Balance Due: ₹${balanceAmountDue.toLocaleString('en-IN')}`,
      termsAndConditions: orig.termsAndConditions,
      companyLogoUrl: orig.companyLogoUrl,
      clientLogoUrl: orig.clientLogoUrl,
      signatureUrl: orig.signatureUrl,
      status: 'sent',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setBalanceInvoices(prev => [newBalanceInv, ...prev]);
    await persistToFirestore('balanceInvoices', newBalanceInv.id, newBalanceInv);

    const updatedSettings = {
      ...settings,
      balanceInvoice: { ...settings.balanceInvoice, nextNumber: settings.balanceInvoice.nextNumber + 1 }
    };
    setSettings(updatedSettings);
    await persistToFirestore('settings', 'company_settings', updatedSettings);

    await logActivity(orig.clientId, orig.client.name, 'Balance Invoice Created', `Created Balance Invoice ${newBalanceInv.balanceInvoiceNumber} for remaining ₹${balanceAmountDue.toLocaleString('en-IN')}`);
    return newBalanceInv;
  };

  // Balance Invoice Actions
  const addBalanceInvoice = async (balanceData: Omit<BalanceInvoice, 'id' | 'balanceInvoiceNumber' | 'createdAt' | 'updatedAt'>): Promise<BalanceInvoice> => {
    const balNum = (balanceData as any).balanceInvoiceNumber || `${settings.balanceInvoice.prefix}${settings.balanceInvoice.nextNumber}`;

    const newBalanceInv: BalanceInvoice = {
      ...balanceData,
      id: `bal_${Date.now()}`,
      balanceInvoiceNumber: balNum,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setBalanceInvoices(prev => [newBalanceInv, ...prev]);
    await persistToFirestore('balanceInvoices', newBalanceInv.id, newBalanceInv);

    const updatedSettings = {
      ...settings,
      balanceInvoice: { ...settings.balanceInvoice, nextNumber: settings.balanceInvoice.nextNumber + 1 }
    };
    setSettings(updatedSettings);
    await persistToFirestore('settings', 'company_settings', updatedSettings);

    await logActivity(newBalanceInv.clientId, newBalanceInv.client.name, 'Balance Invoice Created', `Created Balance Invoice ${newBalanceInv.balanceInvoiceNumber}`);
    return newBalanceInv;
  };

  const updateBalanceInvoice = async (id: string, balanceData: Partial<BalanceInvoice>) => {
    let updatedBal: BalanceInvoice | null = null;
    setBalanceInvoices(prev => prev.map(b => {
      if (b.id === id) {
        updatedBal = { ...b, ...balanceData, updatedAt: new Date().toISOString() };
        return updatedBal;
      }
      return b;
    }));
    if (updatedBal) {
      await persistToFirestore('balanceInvoices', id, updatedBal);
    }
  };

  const deleteBalanceInvoice = async (id: string) => {
    setBalanceInvoices(prev => prev.filter(b => b.id !== id));
    await removeFromFirestore('balanceInvoices', id);
  };

  // Payment Actions & Automatic Calculation Logic
  const addPayment = async (paymentData: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment> => {
    const targetInvoice = invoices.find(inv => inv.id === paymentData.invoiceId);
    if (!targetInvoice) {
      throw new Error('Target invoice not found.');
    }

    const numAmount = Number(paymentData.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new Error('Payment amount must be a valid number greater than 0.');
    }

    // Ledger source of truth check for remaining balance
    const existingPayments = payments.filter(p => p.invoiceId === paymentData.invoiceId);
    const ledgerPaidBefore = existingPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const actualBalanceBefore = Math.max(0, targetInvoice.totalAmount - ledgerPaidBefore);

    if (numAmount > actualBalanceBefore + 0.01) { // 1 cent buffer for float rounding
      throw new Error('Payment amount cannot exceed the remaining invoice balance.');
    }

    // Deduplication check by operationToken or recent identical submission
    if (paymentData.operationToken) {
      const existingTokenMatch = payments.find(p => p.operationToken === paymentData.operationToken);
      if (existingTokenMatch) {
        console.warn(`[Payment Deduplication] Duplicate operation token ignored: ${paymentData.operationToken}`);
        return existingTokenMatch;
      }
    }

    const recentDuplicate = payments.find(p => {
      if (p.invoiceId !== paymentData.invoiceId) return false;
      if (p.amount !== numAmount) return false;
      if (paymentData.referenceNumber && p.referenceNumber !== paymentData.referenceNumber) return false;
      const timeDiff = Math.abs(Date.now() - new Date(p.createdAt).getTime());
      return timeDiff < 4000; // Created within 4 seconds with identical amount
    });

    if (recentDuplicate) {
      console.warn(`[Payment Deduplication] Duplicate payment detected within 4 seconds: ${recentDuplicate.id}`);
      return recentDuplicate;
    }

    const newPayment: Payment = {
      ...paymentData,
      id: `pay_${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    const nextPayments = [newPayment, ...payments];
    setPayments(nextPayments);
    await persistToFirestore('payments', newPayment.id, newPayment);

    // Calculate total paid strictly from payments ledger linked to this invoice
    const linkedPayments = nextPayments.filter(p => p.invoiceId === paymentData.invoiceId);
    const newPaidAmount = linkedPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const newBalanceAmount = Math.max(0, targetInvoice.totalAmount - newPaidAmount);

    let newStatus: PaymentStatus = 'unpaid';
    if (newPaidAmount >= targetInvoice.totalAmount && targetInvoice.totalAmount > 0) {
      newStatus = 'fully_paid';
    } else if (newPaidAmount > 0) {
      newStatus = 'partially_paid';
    }

    const updatedInvoiceTarget: Invoice = {
      ...targetInvoice,
      paidAmount: newPaidAmount,
      balanceAmount: newBalanceAmount,
      paymentStatus: newStatus,
      status: newStatus === 'fully_paid' ? 'paid' : targetInvoice.status,
      updatedAt: new Date().toISOString()
    };

    setInvoices(prevInvoices => prevInvoices.map(inv => inv.id === paymentData.invoiceId ? updatedInvoiceTarget : inv));
    await persistToFirestore('invoices', paymentData.invoiceId, updatedInvoiceTarget);

    await logActivity(
      paymentData.clientId,
      paymentData.clientName,
      'Payment Received',
      `Recorded ${paymentData.paymentMethod} payment of ₹${numAmount.toLocaleString('en-IN')} for ${paymentData.invoiceNumber} (Ref: ${paymentData.referenceNumber || 'N/A'})`
    );

    return newPayment;
  };

  const deletePayment = async (id: string) => {
    const targetPayment = payments.find(p => p.id === id);
    if (!targetPayment) return;

    const nextPayments = payments.filter(p => p.id !== id);
    setPayments(nextPayments);
    await removeFromFirestore('payments', id);

    // Re-adjust related invoice amounts based strictly on remaining ledger payments
    const targetInvoice = invoices.find(inv => inv.id === targetPayment.invoiceId);
    if (targetInvoice) {
      const linkedPayments = nextPayments.filter(p => p.invoiceId === targetPayment.invoiceId);
      const newPaidAmount = linkedPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const newBalanceAmount = Math.max(0, targetInvoice.totalAmount - newPaidAmount);

      let newStatus: PaymentStatus = 'unpaid';
      if (newPaidAmount >= targetInvoice.totalAmount && targetInvoice.totalAmount > 0) {
        newStatus = 'fully_paid';
      } else if (newPaidAmount > 0) {
        newStatus = 'partially_paid';
      }

      const updatedInvoiceTarget: Invoice = {
        ...targetInvoice,
        paidAmount: newPaidAmount,
        balanceAmount: newBalanceAmount,
        paymentStatus: newStatus,
        status: newStatus === 'fully_paid' ? 'paid' : targetInvoice.status,
        updatedAt: new Date().toISOString()
      };

      setInvoices(prevInvoices => prevInvoices.map(inv => inv.id === targetInvoice.id ? updatedInvoiceTarget : inv));
      await persistToFirestore('invoices', targetInvoice.id, updatedInvoiceTarget);
    }
  };

  const reconcileAndCleanupPayments = async (selectedPaymentIds: string[], auditReasons: Record<string, string> = {}) => {
    if (!selectedPaymentIds || selectedPaymentIds.length === 0) return;

    const idsToDeleteSet = new Set(selectedPaymentIds);

    // 1. Find payments being removed and identify affected invoices
    const targetPayments = payments.filter(p => idsToDeleteSet.has(p.id));
    const affectedInvoiceIds = new Set<string>(targetPayments.map(p => p.invoiceId));

    // 2. Remove selected payments from state and Firestore
    const nextPayments = payments.filter(p => !idsToDeleteSet.has(p.id));
    setPayments(nextPayments);

    for (const pId of selectedPaymentIds) {
      await removeFromFirestore('payments', pId);
    }

    // 3. Recalculate each affected invoice from remaining ledger payments
    for (const invoiceId of affectedInvoiceIds) {
      const targetInvoice = invoices.find(inv => inv.id === invoiceId);
      if (targetInvoice) {
        const remainingPayments = nextPayments.filter(p => p.invoiceId === invoiceId);
        const newPaidAmount = remainingPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
        const newBalanceAmount = Math.max(0, targetInvoice.totalAmount - newPaidAmount);

        let newStatus: PaymentStatus = 'unpaid';
        if (newPaidAmount >= targetInvoice.totalAmount && targetInvoice.totalAmount > 0) {
          newStatus = 'fully_paid';
        } else if (newPaidAmount > 0) {
          newStatus = 'partially_paid';
        }

        const updatedInvoice: Invoice = {
          ...targetInvoice,
          paidAmount: newPaidAmount,
          balanceAmount: newBalanceAmount,
          paymentStatus: newStatus,
          status: newStatus === 'fully_paid' ? 'paid' : targetInvoice.status,
          updatedAt: new Date().toISOString()
        };

        setInvoices(prevInvoices => prevInvoices.map(inv => inv.id === invoiceId ? updatedInvoice : inv));
        await persistToFirestore('invoices', invoiceId, updatedInvoice);
      }
    }

    // 4. Record activity logs for each cleanup operation
    for (const p of targetPayments) {
      const reason = auditReasons[p.id] || 'Confirmed Duplicate Cleanup';
      await logActivity(
        p.clientId || 'system',
        p.clientName || 'System Ledger',
        'Payment Cleanup',
        `Reconciled duplicate/orphan payment [${p.id}] of ₹${p.amount.toLocaleString('en-IN')} for ${p.invoiceNumber || 'Unlinked'}. Reason: ${reason}`
      );
    }
  };

  // File Library Actions
  const addFile = async (fileData: Omit<FileRecord, 'id' | 'uploadedAt'>): Promise<FileRecord> => {
    const newFile: FileRecord = {
      ...fileData,
      id: `file_${Date.now()}`,
      uploadedAt: new Date().toISOString()
    };
    setFiles(prev => [newFile, ...prev]);
    await persistToFirestore('files', newFile.id, newFile);
    return newFile;
  };

  const deleteFile = async (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    await removeFromFirestore('files', id);
  };

  // Email Log Actions
  const addEmailLog = async (emailData: Omit<EmailLog, 'id' | 'sentDate'>): Promise<EmailLog> => {
    const newEmail: EmailLog = {
      ...emailData,
      id: `em_${Date.now()}`,
      sentDate: new Date().toISOString()
    };
    setEmailLogs(prev => [newEmail, ...prev]);
    await persistToFirestore('emailLogs', newEmail.id, newEmail);
    return newEmail;
  };

  // Settings Actions
  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = {
      ...settings,
      ...newSettings,
      company: newSettings.company ? { ...settings.company, ...newSettings.company } : settings.company,
      quotation: newSettings.quotation ? { ...settings.quotation, ...newSettings.quotation } : settings.quotation,
      invoice: newSettings.invoice ? { ...settings.invoice, ...newSettings.invoice } : settings.invoice,
      balanceInvoice: newSettings.balanceInvoice ? { ...settings.balanceInvoice, ...newSettings.balanceInvoice } : settings.balanceInvoice,
    };
    setSettings(updated);
    await persistToFirestore('settings', 'company_settings', updated);
  };

  const toggleTheme = () => {
    setSettings(prev => ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light'
    }));
  };

  const resetAllData = async () => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    setClients([]);
    setQuotations([]);
    setInvoices([]);
    setBalanceInvoices([]);
    setPayments([]);
    setFiles([]);
    setActivityLogs([]);
    setEmailLogs([]);
    setSettings(initialSettings);

    if (isFirebaseConfigured()) {
      await persistToFirestore('settings', 'company_settings', initialSettings);
    }
  };

  return (
    <DataContext.Provider value={{
      clients, quotations, invoices, balanceInvoices, payments, files, activityLogs, emailLogs, settings,
      isLoading, error,
      addClient, updateClient, deleteClient, getClientById,
      addQuotation, updateQuotation, deleteQuotation, convertQuotationToInvoice,
      addInvoice, updateInvoice, deleteInvoice, createBalanceInvoiceFromInvoice,
      addBalanceInvoice, updateBalanceInvoice, deleteBalanceInvoice,
      addPayment, deletePayment, reconcileAndCleanupPayments,
      addFile, deleteFile,
      addEmailLog,
      updateSettings, toggleTheme, resetAllData, logActivity,
      usageMetrics, refreshMetrics
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
