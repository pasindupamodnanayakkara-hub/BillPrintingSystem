import React, { useState } from 'react';
import { X, Key, Info, ExternalLink } from 'lucide-react';

const GoogleConfigModal = ({ isOpen, onClose }) => {
  const [clientId, setClientId] = useState(localStorage.getItem('GOOGLE_CLIENT_ID') || '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('GOOGLE_CLIENT_ID', clientId);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
      window.location.reload(); // Reload to apply CID to provider
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-gray-900 p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-gold rounded-xl">
              <Key size={20} className="text-black" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Google API Setup</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2">
              <Info size={14} />
              Google OAuth Client ID
            </label>
            <input
              type="text"
              className="w-full border-2 border-gray-100 rounded-2xl p-4 text-sm focus:border-accent-gold outline-none transition-all font-mono"
              placeholder="000000000000-xxxxxxxx.apps.googleusercontent.com"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            />
            <p className="text-[10px] text-gray-400 italic px-2">
              This is required to securely connect your Google Account and backup bills to Sheets.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-4">
            <Info className="text-blue-500 shrink-0" size={20} />
            <div className="space-y-2">
              <p className="text-xs font-bold text-blue-900 leading-tight">Need a Client ID?</p>
              <p className="text-[11px] text-blue-700 leading-relaxed">
                Create a project in the <strong>Google Cloud Console</strong>, enable 'Sheets API', and create an OAuth Client ID for Web Applications.
              </p>
              <a 
                href="https://console.cloud.google.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 underline"
              >
                Go to Google Cloud Console
                <ExternalLink size={10} />
              </a>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saved}
            className={`w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${
              saved 
                ? 'bg-green-500 text-white' 
                : 'bg-black text-white hover:bg-gray-900 shadow-xl shadow-black/10'
            }`}
          >
            {saved ? 'Settings Saved! Reloading...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoogleConfigModal;
