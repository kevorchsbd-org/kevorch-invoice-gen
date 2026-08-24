import React from 'react';
import { ServiceItem } from '../../types';
import { Plus, Trash2 } from 'lucide-react';

interface ItemTableBuilderProps {
  items: ServiceItem[];
  onChange: (items: ServiceItem[]) => void;
  disabled?: boolean;
}

export const ItemTableBuilder: React.FC<ItemTableBuilderProps> = ({ items, onChange, disabled = false }) => {

  const handleItemChange = (index: number, field: keyof ServiceItem, value: string | number) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      [field]: field === 'amount' ? (value === '' ? 0 : Number(value)) : value
    };
    onChange(updated);
  };

  const handleAddItem = () => {
    const newItem: ServiceItem = {
      id: `itm_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      serviceName: '',
      description: '',
      amount: 0
    };
    onChange([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    const updated = items.filter((_, i) => i !== index);
    onChange(updated);
  };

  const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
          Service Items & Description
        </h3>
        {!disabled && (
          <button
            type="button"
            onClick={handleAddItem}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#E31B23] hover:text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/50 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Service Row</span>
          </button>
        )}
      </div>

      <div className="border border-gray-200 dark:border-[#2A2A2A] rounded-xl overflow-hidden shadow-sm bg-white dark:bg-[#1A1A1A]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-[#222222] border-b border-gray-200 dark:border-[#2A2A2A] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 w-12 text-center">#</th>
                <th className="px-4 py-3 min-w-[200px]">Service Name *</th>
                <th className="px-4 py-3 min-w-[250px]">Description</th>
                <th className="px-4 py-3 w-40 text-right">Amount (₹) *</th>
                {!disabled && <th className="px-4 py-3 w-12 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#2A2A2A]">
              {items.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-gray-50/50 dark:hover:bg-[#202020] transition">
                  <td className="px-4 py-3 text-center text-gray-400 font-medium">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      disabled={disabled}
                      required
                      placeholder="e.g. Website Development"
                      value={item.serviceName}
                      onChange={(e) => handleItemChange(idx, 'serviceName', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E31B23] focus:border-[#E31B23]"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      disabled={disabled}
                      placeholder="Service details or deliverables summary"
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E31B23] focus:border-[#E31B23]"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative">
                      <span className="absolute left-3 top-1.5 text-gray-400 font-semibold">₹</span>
                      <input
                        type="number"
                        disabled={disabled}
                        required
                        min="0"
                        step="any"
                        placeholder="0"
                        value={item.amount || ''}
                        onChange={(e) => handleItemChange(idx, 'amount', e.target.value)}
                        className="w-full pl-7 pr-3 py-1.5 text-xs text-right font-bold bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E31B23] focus:border-[#E31B23]"
                      />
                    </div>
                  </td>
                  {!disabled && (
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={items.length <= 1}
                        className={`p-1.5 rounded-lg transition ${
                          items.length <= 1
                            ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed'
                            : 'text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
                        }`}
                        title="Delete item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 dark:bg-[#222222] border-t border-gray-200 dark:border-[#2A2A2A] font-bold">
              <tr>
                <td colSpan={3} className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">
                  Total Project Amount:
                </td>
                <td className="px-4 py-3 text-right text-base text-[#E31B23] dark:text-red-400 font-extrabold">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </td>
                {!disabled && <td></td>}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
