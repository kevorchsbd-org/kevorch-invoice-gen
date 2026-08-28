import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Sun, Moon, LogOut, FileText, User as UserIcon, Plus, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { settings, toggleTheme } = useData();
  const navigate = useNavigate();

  return (
    <header className="glass-header text-white sticky top-0 z-40 shadow-xl backdrop-blur-xl border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name with Motion */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center space-x-3 cursor-pointer" 
            onClick={() => navigate('/dashboard')}
          >
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center p-1.5 shadow-lg border border-white/20 relative overflow-hidden group">
              <img src="/logoicon3.png" alt="KEVORCH Logo" className="w-full h-full object-contain relative z-10 transition-transform duration-300 group-hover:scale-110" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-lg tracking-wider text-white drop-shadow-xs">KEVORCH SBD</span>
                <span className="bg-white/20 backdrop-blur-md text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-white/30 flex items-center space-x-1">
                  <Sparkles className="w-2.5 h-2.5 text-amber-300 animate-spin" />
                  <span>Pro</span>
                </span>
              </div>
              <p className="text-xs text-red-100 hidden sm:block font-medium opacity-90">Document & Billing Engine</p>
            </div>
          </motion.div>

          {/* Quick Create Actions & Controls */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Quick Action Button */}
            <div className="relative group">
              <motion.button 
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="bg-white/15 hover:bg-white/25 backdrop-blur-md text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center space-x-1.5 transition border border-white/30 shadow-xs"
              >
                <Plus className="w-4 h-4 text-amber-300" />
                <span className="hidden md:inline">Quick Action</span>
              </motion.button>
              <div className="absolute right-0 mt-1.5 w-52 glass-modal-bg rounded-2xl shadow-2xl border border-white/20 p-2 hidden group-hover:block z-50 text-gray-800 dark:text-gray-200 animate-in fade-in zoom-in-95 duration-150">
                <button onClick={() => navigate('/clients?action=new')} className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-[#E31B23] font-bold flex items-center space-x-2 transition">
                  <span className="p-1 bg-red-100 dark:bg-red-950/80 rounded-lg">👤</span>
                  <span>Add New Client</span>
                </button>
                <button onClick={() => navigate('/quotations/create')} className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-[#E31B23] font-bold flex items-center space-x-2 transition">
                  <span className="p-1 bg-blue-100 dark:bg-blue-950/80 rounded-lg">📄</span>
                  <span>New Quotation</span>
                </button>
                <button onClick={() => navigate('/invoices/create')} className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-[#E31B23] font-bold flex items-center space-x-2 transition">
                  <span className="p-1 bg-purple-100 dark:bg-purple-950/80 rounded-lg">💳</span>
                  <span>New Invoice</span>
                </button>
                <button onClick={() => navigate('/balance-invoices/create')} className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-[#E31B23] font-bold flex items-center space-x-2 transition">
                  <span className="p-1 bg-orange-100 dark:bg-orange-950/80 rounded-lg">⚖️</span>
                  <span>New Balance Invoice</span>
                </button>
              </div>
            </div>

            {/* Light / Dark Mode Toggle */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white transition border border-white/30"
              title={`Switch to ${settings.theme === 'light' ? 'Dark' : 'Light'} Mode`}
            >
              {settings.theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-300" />}
            </motion.button>

            {/* Document Vault quick button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/documents')}
              className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white transition border border-white/30 hidden sm:flex"
              title="Document Vault"
            >
              <FileText className="w-4 h-4" />
            </motion.button>

            {/* User Profile */}
            <div className="flex items-center space-x-2 border-l border-white/20 pl-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-xs border border-white/30 shadow-xs">
                {user?.email?.[0]?.toUpperCase() || <UserIcon className="w-4 h-4" />}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-black leading-none text-white">{settings.company.companyName}</p>
                <p className="text-[10px] text-red-100 opacity-90">{user?.email}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={logout}
                className="p-2 rounded-xl hover:bg-red-800/80 text-white/90 hover:text-white transition"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
