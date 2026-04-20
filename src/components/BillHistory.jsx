import React, { useState, useEffect } from 'react';
import { Search, Download, FileText, Calendar, User, CreditCard } from 'lucide-react';
import { getBillHistory, deleteBill } from '../services/billService';
import { uploadEncryptedBackup } from '../services/googleDriveService';
import { encryptBackup } from '../services/encryptionService';
import { useToast } from './ui/ToastProvider';
import { useConfirm } from './ui/ConfirmProvider';
import { Trash2, X, RefreshCw, Cloud } from 'lucide-react';


const BillHistory = () => {
  const { toast } = useToast();
  const { confirm: runConfirm } = useConfirm();
  const [bills, setBills] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedBill, setSelectedBill] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setBills(getBillHistory());
  }, []);

  const handleManualBackup = async () => {
    const token = localStorage.getItem('GOOGLE_ACCESS_TOKEN');
    if (!token) {
      toast('Please connect your Google account in the "Cloud Backup" tab first.', 'info');
      return;
    }

    setIsSyncing(true);
    try {
      const history = getBillHistory();
      if (history.length === 0) {
        toast('No bills found to backup.', 'info');
        return;
      }
      const encryptedData = await encryptBackup(history);
      await uploadEncryptedBackup(token, encryptedData);
      localStorage.setItem('LAST_BACKUP_DATE', String(Date.now()));
      toast('Cloud backup successful!', 'success');
    } catch (err) {
      console.error('Manual backup error:', err);
      toast('Backup failed. Check your connection.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };
  const handleDelete = async (e, id, invoiceNumber) => {
    e.stopPropagation(); // Prevent opening modal
    const confirmed = await runConfirm({
      title: 'Delete Bill',
      message: `Are you sure you want to delete ${invoiceNumber}? This action cannot be undone.`
    });
    
    if (confirmed) {
      const updated = deleteBill(id);
      setBills(updated);
      toast('Invoice deleted successfully.', 'success');
    }
  };

  const filteredBills = bills.filter(b => 
    b.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
    (b.clientName && b.clientName.toLowerCase().includes(search.toLowerCase()))
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

          <div className="flex items-center gap-2">
            <button
              onClick={handleManualBackup}
              disabled={isSyncing}
              className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-900 transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
              {isSyncing ? <RefreshCw size={14} className="animate-spin" /> : <Cloud size={14} className="text-blue-400" />}
              {isSyncing ? 'Syncing...' : 'Backup Now'}
            </button>
            <button 
              className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm active:scale-95"
              onClick={() => {
                const csv = bills.map(b => `${b.invoiceDate},${b.invoiceNumber},${b.clientName},${b.total}`).join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `bill-history-${new Date().toLocaleDateString()}.csv`;
                a.click();
              }}
            >
              <Download size={14} />
              Export
            </button>
          </div>
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
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredBills.length > 0 ? filteredBills.map((bill) => (
                <tr 
                  key={bill.id} 
                  className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                  onClick={() => setSelectedBill(bill)}
                >
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
                  <td className="px-8 py-5 text-center">
                    <button 
                      onClick={(e) => handleDelete(e, bill.id, bill.invoiceNumber)}
                      className="text-gray-300 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center">
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

      {/* Bill Preview Modal */}
      {selectedBill && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={() => setSelectedBill(null)} 
          />
          <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 outline-none border border-gray-100">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-xl font-black text-gray-900 italic tracking-tight">{selectedBill.invoiceNumber}</h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{selectedBill.invoiceDate}</p>
              </div>
              <button 
                onClick={() => setSelectedBill(null)}
                className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-gray-100"
              >
                <X size={20} className="text-gray-400 hover:text-black" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
              {/* Client Info */}
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Billed From</h3>
                  <p className="text-sm font-black text-gray-900">{selectedBill.companyName}</p>
                  <p className="text-xs text-gray-500 mt-1">{selectedBill.companyAddress}</p>
                  <p className="text-xs text-gray-500">{selectedBill.companyPhone}</p>
                </div>
                <div>
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Billed To</h3>
                  <p className="text-sm font-black text-gray-900">{selectedBill.clientName || 'Valued Client'}</p>
                  <p className="text-xs text-gray-500 mt-1">{selectedBill.clientAddress}</p>
                  <p className="text-xs text-gray-500">{selectedBill.clientPhone}</p>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Service Details</h3>
                <div className="border border-gray-100 rounded-2xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Qty</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Price</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {selectedBill.items.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td className="px-6 py-4 text-xs font-bold text-gray-700">{item.description}</td>
                          <td className="px-6 py-4 text-xs text-center font-bold text-gray-500">{item.qty}</td>
                          <td className="px-6 py-4 text-xs text-right font-bold text-gray-500">{selectedBill.currency} {Number(item.price).toLocaleString()}</td>
                          <td className="px-6 py-4 text-xs text-right font-black text-gray-900">{selectedBill.currency} {(item.qty * item.price).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary */}
              <div className="flex justify-end pt-4">
                <div className="w-64 space-y-2 border-t border-gray-100 pt-6">
                  <div className="flex justify-between text-xs font-bold text-gray-500">
                    <span>Subtotal</span>
                    <span>{selectedBill.currency} {Number(selectedBill.subtotal).toLocaleString()}</span>
                  </div>
                  {Number(selectedBill.taxAmount) > 0 && (
                    <div className="flex justify-between text-xs font-bold text-gray-500">
                      <span>Tax</span>
                      <span>{selectedBill.currency} {Number(selectedBill.taxAmount).toLocaleString()}</span>
                    </div>
                  )}
                  {Number(selectedBill.discountAmount) > 0 && (
                    <div className="flex justify-between text-xs font-bold text-red-500">
                      <span>Discount</span>
                      <span>-{selectedBill.currency} {Number(selectedBill.discountAmount).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm font-black text-gray-900 uppercase tracking-widest italic">Total</span>
                    <span className="text-xl font-black text-accent-gold italic tracking-tight underline decoration-accent-gold/30">
                      {selectedBill.currency} {Number(selectedBill.total).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedBill.notes && (
                <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Terms & Notes</h4>
                  <p className="text-xs text-gray-600 leading-relaxed font-bold">{selectedBill.notes}</p>
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex justify-end">
              <button 
                onClick={() => setSelectedBill(null)}
                className="px-8 py-2.5 bg-black text-white text-sm font-black italic rounded-xl hover:bg-gray-900 transition-all shadow-xl active:scale-95"
              >
                CLOSE PREVIEW
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillHistory;
