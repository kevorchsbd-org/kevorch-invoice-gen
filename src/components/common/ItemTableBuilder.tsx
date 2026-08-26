import React from 'react';
import { ServiceItem } from '../../types';
import { Plus, Trash2 } from 'lucide-react';

interface ItemTableBuilderProps {
  items: ServiceItem[];
  onChange: (items: ServiceItem[]) => void;
  disabled?: boolean;
  enableDescriptionPoints?: boolean;
}

export const ItemTableBuilder: React.FC<ItemTableBuilderProps> = ({
  items,
  onChange,
  disabled = false,
  enableDescriptionPoints = false
}) => {

  const handleItemChange = (index: number, field: keyof ServiceItem, value: string | number) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      [field]: field === 'amount' ? (value === '' ? 0 : Number(value)) : value
    };
    onChange(updated);
  };

  const getDescriptionPoints = (description: string): string[] => {
    if (!description) return [''];
    const parts = description.split('\n');
    return parts.length > 0 ? parts : [''];
  };

  const handlePointChange = (itemIdx: number, pointIdx: number, value: string) => {
    const currentPoints = getDescriptionPoints(items[itemIdx].description);
    currentPoints[pointIdx] = value;
    const serialized = currentPoints.join('\n');
    handleItemChange(itemIdx, 'description', serialized);
  };

  const handleAddPoint = (itemIdx: number) => {
    const currentPoints = getDescriptionPoints(items[itemIdx].description);
    currentPoints.push('');
    const serialized = currentPoints.join('\n');
    handleItemChange(itemIdx, 'description', serialized);
  };

  const handleRemovePoint = (itemIdx: number, pointIdx: number) => {
    const currentPoints = getDescriptionPoints(items[itemIdx].description);
    if (currentPoints.length <= 1) {
      handleItemChange(itemIdx, 'description', '');
      return;
    }
    currentPoints.splice(pointIdx, 1);
    const serialized = currentPoints.join('\n');
    handleItemChange(itemIdx, 'description', serialized);
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
            className="neu-btn-secondary px-3 py-1.5 text-xs flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Service Row</span>
          </button>
        )}
      </div>

      <div className="neu-table-container">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/90 dark:bg-[#151518] border-b border-gray-200/90 dark:border-[#2B2B33] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 w-12 text-center">#</th>
                <th className="px-4 py-3 min-w-[180px]">Service Name *</th>
                <th className="px-4 py-3 min-w-[280px]">Description & Deliverables</th>
                <th className="px-4 py-3 w-40 text-right">Amount (₹) *</th>
                {!disabled && <th className="px-4 py-3 w-12 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#26262E]">
              {items.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-gray-50/60 dark:hover:bg-[#202025] transition">
                  <td className="px-4 py-3 text-center text-gray-400 font-medium align-top pt-4">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-3 align-top pt-3">
                    <input
                      type="text"
                      disabled={disabled}
                      required
                      placeholder="e.g. Web Development"
                      value={item.serviceName}
                      onChange={(e) => handleItemChange(idx, 'serviceName', e.target.value)}
                      className="neu-input w-full px-3 py-1.5 text-xs"
                    />
                  </td>
                  <td className="px-4 py-3 align-top pt-3">
                    {enableDescriptionPoints ? (
                      <div className="space-y-2">
                        {getDescriptionPoints(item.description).map((point, pIdx, arr) => (
                          <div key={pIdx} className="flex items-center space-x-2">
                            <span className="text-[#E31B23] font-bold text-xs select-none">•</span>
                            <input
                              type="text"
                              disabled={disabled}
                              placeholder={
                                pIdx === 0
                                  ? 'e.g. Responsive business website'
                                  : pIdx === 1
                                  ? 'e.g. Contact form integration'
                                  : `Deliverable / Point ${pIdx + 1}`
                              }
                              value={point}
                              onChange={(e) => handlePointChange(idx, pIdx, e.target.value)}
                              className="neu-input w-full px-2.5 py-1 text-xs"
                            />
                            {!disabled && (arr.length > 1 || point.length > 0) && (
                              <button
                                type="button"
                                onClick={() => handleRemovePoint(idx, pIdx)}
                                className="neu-btn-danger p-1 text-xs shrink-0"
                                title="Remove point"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                        {!disabled && (
                          <button
                            type="button"
                            onClick={() => handleAddPoint(idx)}
                            className="inline-flex items-center space-x-1 text-[11px] font-bold text-[#E31B23] hover:text-red-700 dark:text-red-400 pt-0.5"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Point</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <input
                        type="text"
                        disabled={disabled}
                        placeholder="Service details or deliverables summary"
                        value={item.description}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                        className="neu-input w-full px-3 py-1.5 text-xs"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 align-top pt-3">
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
                        className="neu-input w-full pl-7 pr-3 py-1.5 text-xs text-right font-bold"
                      />
                    </div>
                  </td>
                  {!disabled && (
                    <td className="px-4 py-3 text-center align-top pt-3">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={items.length <= 1}
                        className={`neu-btn-danger p-1.5 ${
                          items.length <= 1 ? 'opacity-40 cursor-not-allowed' : ''
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
