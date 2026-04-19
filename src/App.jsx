import React, { useState, useEffect } from 'react';
import InvoiceGenerator from './components/InvoiceGenerator';
import Settings from './components/Settings';
import TitleBar from './components/TitleBar';
import ReloadPrompt from './components/ReloadPrompt';
import { FileText, Settings as SettingsIcon, History } from 'lucide-react';
import UpdateOverlay from './components/UpdateOverlay';
import BillHistory from './components/BillHistory';
import SetupWizard from './components/SetupWizard';

function App() {
  const [activeTab, setActiveTab] = useState('generator');
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    const isComplete = localStorage.getItem('BILL_STUDIO_SETUP_COMPLETE') === 'true';
    if (!isComplete) {
      setShowSetup(true);
    }

    // OAuth Debug Listener
    const ipcRenderer = window?.require ? window.require('electron').ipcRenderer : null;
    if (ipcRenderer) {
      ipcRenderer.on('oauth-debug', (event, data) => {
        console.log('OAuth Debug Info:', data);
        // Show detailed alert so user can copy the URI
        alert(`OAuth Debug Information:\n\nType: ${data.type}\nRedirect URI: ${data.redirectUri}\n\nPlease ensure this Redirect URI is added exactly as shown to your Google Cloud Console.`);
      });
    }
  }, []);

  if (showSetup) {
    return <SetupWizard onComplete={() => setShowSetup(false)} />;
  }

  return (
    <div className="h-full w-full bg-[#f3f4f6] flex flex-col overflow-hidden">
      <TitleBar />
      <div className="zoom-wrapper flex-1 flex flex-col overflow-hidden">
        <UpdateOverlay />
        <ReloadPrompt />
        {/* Navigation Bar */}
        <nav className="bg-white border-b border-gray-200 px-8 py-3 flex justify-between items-center shadow-sm z-20 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-lg font-black text-gray-900 tracking-tight italic leading-none">BILL STUDIO</h1>
              <div className="flex items-center gap-1.5 mt-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Powered by</p>
                <p className="text-[10px] font-black text-yellow-400 uppercase tracking-widest bg-gray-900 px-1.5 py-0.5 rounded shadow-sm">Infixa Digital</p>
              </div>
            </div>
          </div>
          
          <div className="flex bg-gray-100 p-1 rounded-2xl gap-1">
            <button 
              onClick={() => setActiveTab('generator')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'generator' ? 'bg-white text-black shadow-md' : 'text-gray-500 hover:bg-gray-200'}`}
            >
              <FileText size={16} />
              Bill Generator
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white text-black shadow-md' : 'text-gray-500 hover:bg-gray-200'}`}
            >
              <History size={16} />
              Bill History
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'settings' ? 'bg-white text-black shadow-md' : 'text-gray-500 hover:bg-gray-200'}`}
            >
              <SettingsIcon size={16} />
              Settings
            </button>
          </div>
        </nav>

        {/* Content Area */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {activeTab === 'generator' ? <InvoiceGenerator /> : 
           activeTab === 'history' ? <BillHistory /> : <Settings />}
        </main>
      </div>
    </div>
  );
}

export default App;
