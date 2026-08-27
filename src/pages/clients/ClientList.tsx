import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { Client } from '../../types';
import { ClientFormModal } from './ClientFormModal';
import { ClientLogo } from '../../components/common/ClientLogo';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Plus, ExternalLink, Edit, Trash2, Building2, Phone, Mail, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

export const ClientList: React.FC = () => {
  const { clients, deleteClient, invoices } = useData();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsModalOpen(true);
      setEditingClient(null);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const filteredClients = clients.filter(c => {
    const query = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      c.companyName.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query) ||
      c.mobile.toLowerCase().includes(query)
    );
  });

  const handleEdit = (client: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleDelete = (client: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete client "${client.name}" (${client.companyName})?`)) {
      deleteClient(client.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">Clients Directory</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Store client details once and automatically reuse across quotations, invoices, and payments.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setEditingClient(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 bg-[#E31B23] hover:bg-red-700 text-white text-xs font-black rounded-2xl shadow-lg shadow-red-500/20 transition flex items-center justify-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Client</span>
        </motion.button>
      </div>

      {/* Glass Search Bar */}
      <div className="glass-card p-4 rounded-2xl flex items-center space-x-3">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by client name, company, email, or mobile number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs bg-transparent focus:outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs text-gray-400 hover:text-gray-600 font-bold px-2"
          >
            Clear
          </button>
        )}
      </div>

      {/* Client Cards Animated Grid */}
      <motion.div 
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { staggerChildren: 0.05 } }
        }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {filteredClients.map((client) => {
          const clientInvoices = invoices.filter(i => i.clientId === client.id);
          const totalBilled = clientInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
          const totalPaid = clientInvoices.reduce((sum, i) => sum + i.paidAmount, 0);
          const balance = Math.max(0, totalBilled - totalPaid);

          return (
            <motion.div
              key={client.id}
              variants={{
                hidden: { opacity: 0, y: 15 },
                show: { opacity: 1, y: 0 }
              }}
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/clients/${client.id}`)}
              className="glass-card rounded-3xl p-5 cursor-pointer transition flex flex-col justify-between group relative overflow-hidden"
            >
              <div className="space-y-3">
                {/* Client Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <ClientLogo client={client} />
                    <div>
                      <h3 className="font-black text-sm text-gray-900 dark:text-gray-100 group-hover:text-[#E31B23] transition flex items-center space-x-1.5">
                        <span>{client.name}</span>
                      </h3>
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center space-x-1 mt-0.5">
                        <Building2 className="w-3 h-3 text-[#E31B23]" />
                        <span>{client.companyName}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition">
                    <button
                      onClick={(e) => handleEdit(client, e)}
                      className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/60 dark:hover:bg-white/10"
                      title="Edit Client"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(client, e)}
                      className="p-1.5 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      title="Delete Client"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Contact details */}
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1.5 pt-3 border-t border-gray-200/50 dark:border-white/10">
                  <p className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>{client.mobile}</span>
                  </p>
                  <p className="flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <span className="truncate">{client.email}</span>
                  </p>
                  <p className="flex items-start space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="truncate">{client.city}, {client.state}</span>
                  </p>
                </div>
              </div>

              {/* Financial Snapshot */}
              <div className="mt-4 pt-3 border-t border-gray-200/50 dark:border-white/10 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 block font-bold uppercase">Billed / Balance</span>
                  <span className="font-black text-gray-900 dark:text-gray-100">
                    ₹{totalBilled.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs font-black text-[#E31B23] ml-1">
                    (₹{balance.toLocaleString('en-IN')})
                  </span>
                </div>

                <div className="flex items-center text-[#E31B23] text-xs font-black space-x-1 group-hover:translate-x-1 transition">
                  <span>Workspace</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {filteredClients.length === 0 && (
        <div className="p-12 text-center glass-card rounded-3xl space-y-3">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-base font-black text-gray-800 dark:text-gray-200">No Clients Found</h3>
          <p className="text-xs text-gray-400">
            {searchQuery ? `No client profile matches "${searchQuery}"` : 'Get started by creating your first client profile.'}
          </p>
        </div>
      )}

      {/* Add / Edit Client Modal */}
      <ClientFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        clientToEdit={editingClient}
      />
    </div>
  );
};
