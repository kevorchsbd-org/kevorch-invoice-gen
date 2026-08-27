import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { FileCategory } from '../../types';
import { Modal } from '../../components/common/Modal';
import { Image as ImageIcon, Upload, Trash2, Plus, ExternalLink, FileText, HardDriveDownload } from 'lucide-react';
import { uploadDocumentFile } from '../../lib/storage';

export const FileLibrary: React.FC = () => {
  const { files, addFile, deleteFile, clients } = useData();

  const [activeCategory, setActiveCategory] = useState<FileCategory | 'All'>('All');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const [uploadData, setUploadData] = useState({
    fileName: '',
    category: 'Company Logo' as FileCategory,
    url: '',
    clientId: ''
  });

  const categories: (FileCategory | 'All')[] = [
    'All',
    'Company Logo',
    'Client Logo',
    'Signature',
    'Company Documents',
    'Client Documents',
    'Other Files'
  ];

  const filteredFiles = files.filter(f => activeCategory === 'All' || f.category === activeCategory);

  const [selectedFileObject, setSelectedFileObject] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileObject(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadData(prev => ({
          ...prev,
          fileName: file.name,
          url: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.url && !selectedFileObject) {
      alert('Please select a file or enter an image URL.');
      return;
    }

    setIsUploading(true);
    try {
      let finalUrl = uploadData.url;
      let storagePath = undefined;

      if (selectedFileObject) {
        const pathCategory = uploadData.category.toLowerCase().replace(/\s+/g, '-');
        const uploadPath = uploadData.clientId 
          ? `clients/${uploadData.clientId}/${pathCategory}/${Date.now()}_${selectedFileObject.name}`
          : `company/${pathCategory}/${Date.now()}_${selectedFileObject.name}`;
        
        const uploaded = await uploadDocumentFile(uploadPath, selectedFileObject, selectedFileObject.type);
        finalUrl = uploaded.url;
        storagePath = uploaded.path;
      }

      addFile({
        fileName: uploadData.fileName || selectedFileObject?.name || 'Asset File',
        category: uploadData.category,
        url: finalUrl,
        fileSize: selectedFileObject ? selectedFileObject.size : 50000,
        fileType: selectedFileObject ? selectedFileObject.type : (finalUrl.startsWith('data:image') ? 'image/png' : 'application/pdf'),
        clientId: uploadData.clientId || undefined,
        filePath: storagePath
      });

      setIsUploadModalOpen(false);
      setUploadData({ fileName: '', category: 'Company Logo', url: '', clientId: '' });
      setSelectedFileObject(null);
    } catch (err: any) {
      alert(err.message || 'File upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">File Library</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Store company logos, signatures, and client assets to be reused across future documents.
          </p>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="px-4 py-2.5 bg-[#E31B23] hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Asset File</span>
        </button>
      </div>

      {/* Local Storage Indicator Banner */}
      <div className="p-3 bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-xl flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs font-bold text-gray-700 dark:text-gray-300">
          <HardDriveDownload className="w-4 h-4 text-[#E31B23]" />
          <span>Stored locally on this device (IndexedDB)</span>
        </div>
        <span className="text-[10px] text-gray-400 font-medium hidden sm:inline">Zero Cloud Storage Fees • 100% Private</span>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-[#2A2A2A] pb-3">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeCategory === cat
                ? 'bg-[#E31B23] text-white shadow-sm'
                : 'bg-white dark:bg-[#1A1A1A] text-gray-600 dark:text-gray-400 hover:bg-gray-100 border border-gray-200 dark:border-[#2A2A2A]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* File Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredFiles.map((f) => (
          <div
            key={f.id}
            className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3 group hover:border-red-300 transition"
          >
            <div className="h-32 bg-gray-50 dark:bg-[#222] rounded-xl flex items-center justify-center overflow-hidden p-2 border border-gray-100 dark:border-[#2A2A2A] relative">
              {f.url.startsWith('http') || f.url.startsWith('data:image') || f.url.startsWith('blob:') ? (
                <img src={f.url} alt={f.fileName} className="max-h-full max-w-full object-contain" />
              ) : (
                <FileText className="w-12 h-12 text-[#E31B23]" />
              )}
              <span className="absolute top-2 left-2 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                {f.category}
              </span>
            </div>

            <div>
              <p className="font-bold text-xs text-gray-900 dark:text-gray-100 truncate">{f.fileName}</p>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-[10px] text-gray-400">Uploaded {new Date(f.uploadedAt).toLocaleDateString()}</p>
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">Stored locally on this device</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-[#2A2A2A]">
              <a
                href={f.url}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-[#E31B23] font-bold flex items-center space-x-1 hover:underline"
              >
                <span>View Asset</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <button
                onClick={() => deleteFile(f.id)}
                className="p-1 rounded text-gray-400 hover:text-red-600"
                title="Delete file"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredFiles.length === 0 && (
        <div className="p-12 text-center bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-[#2A2A2A] space-y-3">
          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">No Assets Uploaded</h3>
          <p className="text-xs text-gray-400">Upload logos and signatures to customize your documents.</p>
        </div>
      )}

      {/* Upload Modal */}
      <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="Upload Asset File to IndexedDB" maxWidth="md">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
              Category *
            </label>
            <select
              value={uploadData.category}
              onChange={(e) => setUploadData({ ...uploadData, category: e.target.value as FileCategory })}
              className="w-full px-3 py-2 text-xs font-semibold bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl focus:ring-1 focus:ring-[#E31B23]"
            >
              <option value="Company Logo">Company Logo</option>
              <option value="Client Logo">Client Logo</option>
              <option value="Signature">Authorized Signature</option>
              <option value="Company Documents">Company Documents</option>
              <option value="Client Documents">Client Documents</option>
              <option value="Other Files">Other Files</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
              File Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. brand_logo.png"
              value={uploadData.fileName}
              onChange={(e) => setUploadData({ ...uploadData, fileName: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl focus:ring-1 focus:ring-[#E31B23]"
            />
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
              Choose File from Desktop
            </label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileUpload}
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl"
            />
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-gray-200 dark:border-[#333]"></div>
            <span className="flex-shrink mx-2 text-[10px] text-gray-400 uppercase font-bold">OR Paste Image URL</span>
            <div className="flex-grow border-t border-gray-200 dark:border-[#333]"></div>
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
              Image URL
            </label>
            <input
              type="url"
              placeholder="https://example.com/logo.png"
              value={uploadData.url}
              onChange={(e) => setUploadData({ ...uploadData, url: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl focus:ring-1 focus:ring-[#E31B23]"
            />
          </div>

          {uploadData.category === 'Client Logo' && (
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
                Attach to Specific Client (Optional)
              </label>
              <select
                value={uploadData.clientId}
                onChange={(e) => setUploadData({ ...uploadData, clientId: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl"
              >
                <option value="">None (Global Asset)</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.companyName})</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100 dark:border-[#2A2A2A]">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(false)}
              className="px-4 py-2 bg-gray-100 dark:bg-[#252525] text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#E31B23] hover:bg-red-700 text-white rounded-xl font-bold flex items-center space-x-2 shadow-md transition"
            >
              <Upload className="w-4 h-4" />
              <span>Upload to IndexedDB</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
