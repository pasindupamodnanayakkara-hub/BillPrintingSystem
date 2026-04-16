import React, { useState, useEffect } from 'react';
import { Search, Download, RefreshCw, FileText, Calendar, User, CreditCard } from 'lucide-react';
import { getBillHistory, restoreHistory } from '../services/billService';
import { fetchBillsFromSheets } from '../services/googleSheets';
import { GOOGLE_CLIENT_ID } from '../config/constants';

const ipcRenderer = window?.require ? window.require('electron').ipcRenderer : null;

const BillHistory = () => {
  const [bills, setBills] = useState([]);
  const [search, setSearch] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    setBills(getBillHistory());
  }, []);

  const handleRestore = async () => {
    if (!ipcRenderer) {
      alert('Restore works only inside the desktop app.');
      return;
    }

    if (!confirm('This will overwrite your local history with data from Google Drive. Continue?')) return;

    setIsRestoring(true);
    try {
      const accessToken = await ipcRenderer.invoke('google-oauth', GOOGLE_CLIENT_ID);
      const remoteBills = await fetchBillsFromSheets(accessToken);
      if (remoteBills && remoteBills.length > 0) {
        restoreHistory(remoteBills);
        setBills(getBillHistory());
        alert(`Successfully restored ${remoteBills.length} bills!`);
      } else {
        alert('No backup found on Google Drive.');
      }
    } catch (err) {
      console.error('Restore failed:', err);
      alert('Restore failed. Please check your internet connection.');
    } finally {
      setIsRestoring(false);
    }
  };

  const filteredBills = bills.filter(b => 
    b.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
    b.clientName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-transparent p-5 gap-5 animate-in fade-in duration-500">
      {/* Header & Controls */}
      <div className="bg-white border border-gray-200 rounded-2xl px-8 py-4 shadow-xl flex justify-between items-center backdrop-blur-md bg-white/90">
        <div>
          <span className="text-sm font-bold text-gray-800 uppercase tracking-widest">Bill History</span>
          <p className="text-xs text-gray-400">Manage and track all generated invoices</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search invoice or client..."
              className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:border-accent-gold outline-none w-64 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button
            onClick={handleRestore}
            disabled={isRestoring}
            className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-900 transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            {isRestoring ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
            {isRestoring ? 'Restoring...' : 'Restore from Drive'}
          </button>
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden flex flex-col">
        <div className="overflow-y-auto custom-scrollbar flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-gray-50 z-10 border-b border-gray-100">
              <tr>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Invoice #</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Client</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredBills.length > 0 ? filteredBills.map((bill) => (
                <tr key={bill.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <Calendar size={14} className="text-gray-300" />
                      <span className="text-sm font-bold text-gray-600">{bill.invoiceDate}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <FileText size={14} className="text-accent-gold" />
                      <span className="text-sm font-black text-gray-900">{bill.invoiceNumber}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <User size={14} className="text-gray-300" />
                      <span className="text-sm font-bold text-gray-700 italic">{bill.clientName || 'Valued Client'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <CreditCard size={14} className="text-gray-300" />
                      <span className="text-lg font-black text-gray-900">Rs.{Number(bill.total).toLocaleString()}</span>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-20">
                      <FileText size={48} />
                      <p className="font-bold uppercase tracking-widest">No Bills Found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BillHistory;
