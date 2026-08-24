import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0D0D0E] text-gray-900 dark:text-gray-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-[#E31B23] selection:text-white">
      {/* Background Liquid Morphism Fluid Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-red-500/10 dark:bg-red-600/15 rounded-full blur-3xl liquid-blob-1"></div>
        <div className="absolute top-1/3 -right-32 w-[30rem] h-[30rem] bg-amber-500/10 dark:bg-red-900/10 rounded-full blur-3xl liquid-blob-2"></div>
        <div className="absolute -bottom-32 left-1/4 w-[28rem] h-[28rem] bg-indigo-500/5 dark:bg-red-500/10 rounded-full blur-3xl liquid-blob-1"></div>
      </div>

      {/* Main Header */}
      <Header />

      {/* App Body Container */}
      <div className="flex flex-1 relative z-10">
        <div className="hidden md:block">
          <Sidebar />
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.99 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
