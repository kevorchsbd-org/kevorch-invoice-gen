import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { Layout } from './components/layout/Layout';

import { Login } from './pages/auth/Login';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import { ClientList } from './pages/clients/ClientList';
import { ClientWorkspace } from './pages/clients/ClientWorkspace';
import { QuotationList } from './pages/quotations/QuotationList';
import { QuotationForm } from './pages/quotations/QuotationForm';
import { InvoiceList } from './pages/invoices/InvoiceList';
import { InvoiceForm } from './pages/invoices/InvoiceForm';
import { BalanceInvoiceList } from './pages/balanceInvoices/BalanceInvoiceList';
import { BalanceInvoiceForm } from './pages/balanceInvoices/BalanceInvoiceForm';
import { PaymentList } from './pages/payments/PaymentList';
import { DocumentVault } from './pages/documents/DocumentVault';
import { FileLibrary } from './pages/files/FileLibrary';
import { Settings } from './pages/Settings';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#111]">
        <div className="w-8 h-8 border-4 border-[#E31B23] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <BrowserRouter>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected App Routes */}
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />

              {/* Clients */}
              <Route path="clients" element={<ClientList />} />
              <Route path="clients/:id" element={<ClientWorkspace />} />

              {/* Quotations */}
              <Route path="quotations" element={<QuotationList />} />
              <Route path="quotations/create" element={<QuotationForm />} />
              <Route path="quotations/edit/:id" element={<QuotationForm />} />

              {/* Invoices */}
              <Route path="invoices" element={<InvoiceList />} />
              <Route path="invoices/create" element={<InvoiceForm />} />
              <Route path="invoices/edit/:id" element={<InvoiceForm />} />

              {/* Balance Invoices */}
              <Route path="balance-invoices" element={<BalanceInvoiceList />} />
              <Route path="balance-invoices/create" element={<BalanceInvoiceForm />} />
              <Route path="balance-invoices/edit/:id" element={<BalanceInvoiceForm />} />

              {/* Payments */}
              <Route path="payments" element={<PaymentList />} />

              {/* Documents & Files */}
              <Route path="documents" element={<DocumentVault />} />
              <Route path="files" element={<FileLibrary />} />

              {/* Settings */}
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
