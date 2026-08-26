import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, CreditCard, Scale, IndianRupee,
  FolderKanban, Image as ImageIcon, Settings as SettingsIcon
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { motion } from 'framer-motion';

export const Sidebar: React.FC = () => {
  const { clients, quotations, invoices, balanceInvoices, payments } = useData();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Clients', path: '/clients', icon: Users, badge: clients.length },
    { label: 'Quotations', path: '/quotations', icon: FileText, badge: quotations.length },
    { label: 'Invoices', path: '/invoices', icon: CreditCard, badge: invoices.length },
    { label: 'Balance Invoices', path: '/balance-invoices', icon: Scale, badge: balanceInvoices.length },
    { label: 'Payments', path: '/payments', icon: IndianRupee, badge: payments.length, badgeColor: 'bg-emerald-500 text-white' },
    { label: 'Document Vault', path: '/documents', icon: FolderKanban },
    { label: 'File Library', path: '/files', icon: ImageIcon },
    { label: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <aside className="w-64 glass-panel border-r border-gray-200/50 dark:border-white/10 flex flex-col flex-shrink-0 min-h-[calc(100vh-4rem)] backdrop-blur-xl">
      <div className="p-4 flex-1 space-y-1.5">
        <p className="px-3 text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 flex items-center space-x-1">
          <span>Main Workspaces</span>
        </p>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition duration-200 ${
                  isActive
                    ? 'bg-[#E31B23] text-white shadow-lg shadow-red-500/25 border border-red-400/30'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-white/5 hover:text-[#E31B23] dark:hover:text-red-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center space-x-3 relative z-10">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <motion.span 
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full relative z-10 ${
                        isActive 
                          ? 'bg-white/20 text-white border border-white/30' 
                          : (item.badgeColor || 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300')
                      }`}
                    >
                      {item.badge}
                    </motion.span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
};
