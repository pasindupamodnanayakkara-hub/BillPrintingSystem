import React, { useState, useEffect } from 'react';
import { Cloud, CheckCircle, AlertCircle, RefreshCw, LogOut, Database, History, ExternalLink } from 'lucide-react';
import { uploadEncryptedBackup, downloadEncryptedBackup, getUserInfo } from '../services/googleDriveService';
import { encryptBackup, decryptBackup } from '../services/encryptionService';
import { GOOGLE_CLIENT_ID } from '../config/constants';
import { getBillHistory, restoreFullBundle } from '../services/billService';
import { getProfiles } from '../config/profiles';
import { useToast } from './ui/ToastProvider';
import { useConfirm } from './ui/ConfirmProvider';

const CloudBackup = () => {
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [user, setUser] = useState(null);
  const [lastBackup, setLastBackup] = useState(null);
  const [backupFrequency, setBackupFrequency] = useState('Never');

  useEffect(() => {
    const savedUser = localStorage.getItem('GOOGLE_USER_INFO');
    if (savedUser) setUser(JSON.parse(savedUser));

    const savedBackupDate = localStorage.getItem('LAST_BACKUP_DATE');
    if (savedBackupDate) setLastBackup(new Date(parseInt(savedBackupDate, 10)).toLocaleString());

    const savedSettings = JSON.parse(localStorage.getItem('BILL_STUDIO_SETTINGS') || '{}');
    setBackupFrequency(savedSettings.backupFrequency || 'Never');
  }, []);

  const handleConnect = async () => {
    const ipcRenderer = window?.require ? window.require('electron').ipcRenderer : null;
    if (!ipcRenderer) {
      toast('Cloud features require the desktop application.', 'error');
      return;
    }

    const localClientId = localStorage.getItem('GOOGLE_CLIENT_ID') || GOOGLE_CLIENT_ID;
    
    setIsConnecting(true);
    try {
      const token = await ipcRenderer.invoke('google-oauth', { clientId: localClientId, silent: false });
      localStorage.setItem('GOOGLE_ACCESS_TOKEN', token);
      
      const userInfo = await getUserInfo(token);
      localStorage.setItem('GOOGLE_USER_INFO', JSON.stringify(userInfo));
      setUser(userInfo);
      toast('Connected to Google Drive successfully!', 'success');
    } catch (err) {
      console.error('Connection error:', err);
      toast('Failed to connect to Google Drive.', 'error');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    const confirmed = await confirm({
      title: 'Disconnect Google Account',
      message: 'Are you sure you want to disconnect? Automated backups will stop.'
    });
    
    if (confirmed) {
      localStorage.removeItem('GOOGLE_USER_INFO');
      localStorage.removeItem('GOOGLE_ACCESS_TOKEN');
      setUser(null);
      toast('Disconnected successfully.', 'success');
    }
  };

  const handleBackupNow = async () => {
    const token = localStorage.getItem('GOOGLE_ACCESS_TOKEN');
    if (!token) {
      handleConnect();
      return;
    }

    setIsSyncing(true);
    try {
      const history = getBillHistory();
      const profiles = getProfiles();
      const settings = JSON.parse(localStorage.getItem('BILL_STUDIO_SETTINGS') || '{}');

      // Create a unified backup bundle
      const backupBundle = {
        bills: history,
        profiles: profiles,
        settings: settings,
        version: '1.0.0',
        timestamp: new Date().toISOString()
      };

      // 1. Encrypt the data
      const encryptedData = await encryptBackup(backupBundle);
      
      // 2. Upload to hidden AppDataFolder
      await uploadEncryptedBackup(token, encryptedData);
      
      const now = new Date().getTime();
      localStorage.setItem('LAST_BACKUP_DATE', String(now));
      setLastBackup(new Date(now).toLocaleString());
      toast('Full encrypted backup saved successfully!', 'success');
    } catch (err) {
      console.error('Backup error:', err);
      if (err.message?.includes('401')) {
         toast('Session expired. Reconnecting...', 'info');
         handleConnect();
      } else {
         toast('Backup failed. Check your connection.', 'error');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestore = async () => {
    const token = localStorage.getItem('GOOGLE_ACCESS_TOKEN');
    if (!token) {
      handleConnect();
      return;
    }

    const confirmed = await confirm({
      title: 'Secure Cloud Restore',
      message: 'This will download your encrypted backup and restore your history. This is safer than the legacy method.'
    });

    if (!confirmed) return;

    setIsSyncing(true);
    try {
      // 1. Download encrypted file
      const encryptedData = await downloadEncryptedBackup(token);
      if (!encryptedData) {
        toast('No backup found in the cloud.', 'error');
        return;
      }

      // 2. Decrypt
      const cloudData = await decryptBackup(encryptedData);
      
      // 3. Restore
      restoreFullBundle(cloudData);

      const itemsCount = Array.isArray(cloudData) ? cloudData.length : (cloudData.bills?.length || 0);
      toast(`Restore complete! ${itemsCount} items recovered.`, 'success');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      console.error('Restore error:', err);
      if (err.message === 'CORRUPT_OR_WRONG_KEY') {
        toast('Failed to decrypt. This backup was likely created on a different device.', 'error');
      } else {
        toast('Failed to restore data from cloud.', 'error');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFrequencyChange = (freq) => {
    setBackupFrequency(freq);
    const savedSettings = JSON.parse(localStorage.getItem('BILL_STUDIO_SETTINGS') || '{}');
    savedSettings.backupFrequency = freq;
    localStorage.setItem('BILL_STUDIO_SETTINGS', JSON.stringify(savedSettings));
    toast(`Auto-backup set to ${freq}`, 'success');
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-[#f3f4f6]">
      <div className="w-full max-w-[1400px] mx-auto p-10 px-8 md:px-16">
        <div className="mb-10">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight italic uppercase">Cloud Backup</h2>
          <p className="text-gray-500 font-medium">Secure your billing data with Google Drive integration</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Status Card */}
          <div className="md:col-span-2 flex flex-col gap-6">
            <div className="bg-white border boundary-gray-200 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Cloud size={120} className="text-blue-600" />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-xl ${user ? 'bg-green-50' : 'bg-gray-50'}`}>
                    {user?.picture ? (
                      <img src={user.picture} alt="" className="w-full h-full rounded-3xl object-cover" />
                    ) : (
                      <Cloud size={32} className={user ? 'text-green-500' : 'text-gray-300'} />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 leading-none mb-1 uppercase italic">
                      {user ? 'Cloud Connected' : 'Not Connected'}
                    </h3>
                    <p className="text-sm font-bold text-gray-400">
                      {user ? user.email : 'Link your Google account to enable sync'}
                    </p>
                  </div>
                  {user && (
                    <button 
                      onClick={handleDisconnect}
                      className="ml-auto p-3 text-gray-400 hover:text-red-500 transition-colors bg-gray-50 hover:bg-red-50 rounded-2xl"
                      title="Disconnect"
                    >
                      <LogOut size={20} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {!user ? (
                    <button 
                      onClick={handleConnect}
                      disabled={isConnecting}
                      className="w-full bg-black text-white px-8 py-5 rounded-[2rem] font-black uppercase tracking-widest text-sm hover:bg-gray-900 transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3"
                    >
                      {isConnecting ? (
                        <RefreshCw size={20} className="animate-spin" />
                      ) : (
                        <Database size={20} className="text-blue-400" />
                      )}
                      {isConnecting ? 'Linking Account...' : 'Connect Google Drive'}
                    </button>
                  ) : (
                    <button 
                      onClick={handleBackupNow}
                      disabled={isSyncing}
                      className="bg-black text-white px-6 py-5 rounded-[2rem] font-black uppercase tracking-widest text-[11px] hover:bg-gray-900 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
                    >
                      {isSyncing ? <RefreshCw size={16} className="animate-spin" /> : <RefreshCw size={16} className="text-blue-400" />}
                      Backup Now
                    </button>
                  )}
                  
                  <button 
                    onClick={handleRestore}
                    disabled={isSyncing}
                    className={`px-6 py-5 rounded-[2rem] font-black uppercase tracking-widest text-[11px] transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 border-2 ${
                      !user ? 'bg-white border-gray-100 text-gray-300 cursor-not-allowed' : 'bg-white border-gray-100 text-gray-900 hover:border-black'
                    }`}
                  >
                    <Database size={16} className={!user ? 'text-gray-200' : 'text-green-500'} />
                    Restore From Cloud
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-xl flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">System Statistics</h4>
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                   <History size={16} />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-5 bg-gray-50 rounded-3xl">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Last Backup</p>
                    <p className="text-sm font-black text-gray-800 italic">{lastBackup || 'Never'}</p>
                  </div>
                  {lastBackup && <CheckCircle size={20} className="text-green-500" />}
                </div>
                
                <div className="flex justify-between items-center p-5 bg-gray-50 rounded-3xl">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Local History</p>
                    <p className="text-sm font-black text-gray-800 italic">{getBillHistory().length} Bills Saved</p>
                  </div>
                  <Database size={20} className="text-blue-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Settings Sidebar */}
          <div className="flex flex-col gap-6">
            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-xl">
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Auto-Backup</h4>
              <div className="space-y-2">
                {['Never', 'Daily', 'Weekly', 'Monthly'].map((freq) => (
                  <button
                    key={freq}
                    onClick={() => handleFrequencyChange(freq)}
                    className={`w-full text-left px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                      backupFrequency === freq 
                        ? 'bg-black text-white shadow-lg' 
                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                    }`}
                  >
                    {freq}
                  </button>
                ))}
              </div>
              <p className="mt-6 text-[10px] text-gray-400 font-bold leading-relaxed px-2">
                Automated backups run silently when you save a new bill.
              </p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] p-8 shadow-xl flex-1 flex flex-col">
              <h4 className="text-xs font-black text-blue-400/60 uppercase tracking-[0.2em] mb-4">Privacy Info</h4>
              <p className="text-[10px] text-gray-400 font-bold leading-relaxed mb-6">
                Your data is <span className="text-white italic">End-to-End Encrypted</span> and stored in a hidden system folder. Even Google cannot read your bills.
              </p>
              <div className="flex items-center justify-between text-white text-[10px] font-black uppercase tracking-widest opacity-50">
                <span>Hidden Storage</span>
                <CheckCircle size={14} className="text-blue-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CloudBackup;
