import React, { useState, useEffect } from 'react';
import { Client } from '../../types';
import { useData } from '../../context/DataContext';
import { Modal } from '../../components/common/Modal';
import { Save, Building2, User, Phone, Mail, MapPin } from 'lucide-react';
import { saveClientAsset, getClientAsset, revokeObjectUrl } from '../../lib/indexedDb';

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientToEdit?: Client | null;
}

export const ClientFormModal: React.FC<ClientFormModalProps> = ({
  isOpen,
  onClose,
  clientToEdit
}) => {
  const { addClient, updateClient } = useData();

  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    mobile: '',
    email: '',
    address: '',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    pincode: '641001',
    logoUrl: '',
    notes: ''
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    let localObjectUrl = '';

    const initForm = async () => {
      if (clientToEdit) {
        let logoUrl = clientToEdit.logoUrl || '';
        try {
          const localAsset = await getClientAsset(clientToEdit.id);
          if (localAsset?.url) {
            localObjectUrl = localAsset.url;
            logoUrl = localAsset.url;
          }
        } catch (e) {
          console.warn('Client asset load error:', e);
        }

        setFormData({
          name: clientToEdit.name || '',
          companyName: clientToEdit.companyName || '',
          mobile: clientToEdit.mobile || '',
          email: clientToEdit.email || '',
          address: clientToEdit.address || '',
          city: clientToEdit.city || 'Coimbatore',
          state: clientToEdit.state || 'Tamil Nadu',
          pincode: clientToEdit.pincode || '641001',
          logoUrl,
          notes: clientToEdit.notes || ''
        });
      } else {
        setFormData({
          name: '',
          companyName: '',
          mobile: '',
          email: '',
          address: '',
          city: 'Coimbatore',
          state: 'Tamil Nadu',
          pincode: '641001',
          logoUrl: '',
          notes: ''
        });
      }
      setSelectedFile(null);
    };

    if (isOpen) {
      initForm();
    }

    return () => {
      if (localObjectUrl) revokeObjectUrl(localObjectUrl);
    };
  }, [clientToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (clientToEdit) {
        if (selectedFile) {
          await saveClientAsset(clientToEdit.id, selectedFile, selectedFile.name);
          formData.logoUrl = 'indexeddb';
        }
        await updateClient(clientToEdit.id, formData);
      } else {
        if (selectedFile) {
          formData.logoUrl = 'indexeddb';
        }
        const newClient = await addClient(formData);
        if (selectedFile && newClient?.id) {
          await saveClientAsset(newClient.id, selectedFile, selectedFile.name);
          await updateClient(newClient.id, { logoUrl: 'indexeddb' });
        }
      }
      onClose();
    } catch (err: any) {
      alert(`Client save failed: ${err.message || 'Unknown error'}`);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={clientToEdit ? `Edit Client: ${clientToEdit.name}` : 'Create New Client Profile'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-gray-700 dark:text-gray-300 font-bold mb-1 flex items-center space-x-1">
              <User className="w-3.5 h-3.5 text-[#E31B23]" />
              <span>Client Full Name *</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rajesh Kumar"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-lg focus:ring-1 focus:ring-[#E31B23] focus:border-[#E31B23]"
            />
          </div>

          <div>
            <label className="text-gray-700 dark:text-gray-300 font-bold mb-1 flex items-center space-x-1">
              <Building2 className="w-3.5 h-3.5 text-[#E31B23]" />
              <span>Company Name *</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Apex Retail Solutions"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-lg focus:ring-1 focus:ring-[#E31B23] focus:border-[#E31B23]"
            />
          </div>

          <div>
            <label className="text-gray-700 dark:text-gray-300 font-bold mb-1 flex items-center space-x-1">
              <Phone className="w-3.5 h-3.5 text-gray-400" />
              <span>Mobile Number *</span>
            </label>
            <input
              type="tel"
              required
              placeholder="+91 98765 43210"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-lg focus:ring-1 focus:ring-[#E31B23] focus:border-[#E31B23]"
            />
          </div>

          <div>
            <label className="text-gray-700 dark:text-gray-300 font-bold mb-1 flex items-center space-x-1">
              <Mail className="w-3.5 h-3.5 text-gray-400" />
              <span>Email Address *</span>
            </label>
            <input
              type="email"
              required
              placeholder="client@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-lg focus:ring-1 focus:ring-[#E31B23] focus:border-[#E31B23]"
            />
          </div>
        </div>

        <div>
          <label className="text-gray-700 dark:text-gray-300 font-bold mb-1 flex items-center space-x-1">
            <MapPin className="w-3.5 h-3.5 text-gray-400" />
            <span>Street Address *</span>
          </label>
          <input
            type="text"
            required
            placeholder="Door #, Street, Area"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-lg focus:ring-1 focus:ring-[#E31B23] focus:border-[#E31B23]"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">City *</label>
            <input
              type="text"
              required
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-lg focus:ring-1 focus:ring-[#E31B23] focus:border-[#E31B23]"
            />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">State *</label>
            <input
              type="text"
              required
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-lg focus:ring-1 focus:ring-[#E31B23] focus:border-[#E31B23]"
            />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">Pincode *</label>
            <input
              type="text"
              required
              value={formData.pincode}
              onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-lg focus:ring-1 focus:ring-[#E31B23] focus:border-[#E31B23]"
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">Client Logo (Stored Locally in IndexedDB)</label>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setSelectedFile(file);
                  setFormData(prev => ({ ...prev, logoUrl: URL.createObjectURL(file) }));
                }
              }}
              className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-lg"
            />
            <input
              type="url"
              placeholder="Or paste Logo URL"
              value={formData.logoUrl}
              onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-lg focus:ring-1 focus:ring-[#E31B23]"
            />
          </div>
          {formData.logoUrl && (
            <div className="mt-2 p-2 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-xl flex items-center space-x-3 w-max">
              <img src={formData.logoUrl} alt="Client Logo Preview" className="h-10 w-auto object-contain rounded" />
              <span className="text-[10px] text-gray-400 font-semibold">Active Client Logo</span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">Client Notes / Specifications</label>
          <textarea
            rows={3}
            placeholder="Special client requirements, billing cycles, or contact preferences"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-lg focus:ring-1 focus:ring-[#E31B23] focus:border-[#E31B23]"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-[#2A2A2A]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 dark:bg-[#252525] text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-[#333]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-[#E31B23] hover:bg-red-700 text-white rounded-xl font-bold flex items-center space-x-2 shadow-md transition"
          >
            <Save className="w-4 h-4" />
            <span>{clientToEdit ? 'Save Client Changes' : 'Create & Save Client'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
