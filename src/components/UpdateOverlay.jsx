import React, { useState, useEffect } from 'react';
import { DownloadCloud, CheckCircle } from 'lucide-react';

export default function UpdateOverlay() {
  const [updateState, setUpdateState] = useState('idle'); // idle, downloading, ready
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.require) {
      try {
        const { ipcRenderer } = window.require('electron');
        
        const handleUpdaterEvent = (event, data) => {
          if (data.type === 'download-progress') {
            setUpdateState('downloading');
            setProgress(data.progress.percent);
          } else if (data.type === 'update-downloaded') {
            setUpdateState('ready');
          }
        };

        ipcRenderer.on('updater-event', handleUpdaterEvent);
        return () => {
          if (ipcRenderer && ipcRenderer.removeListener) {
            ipcRenderer.removeListener('updater-event', handleUpdaterEvent);
          }
        };
      } catch {
        console.warn("Electron IPC not available (Running in browser)");
      }
    }
  }, []);

  const handleInstall = () => {
    if (typeof window !== 'undefined' && window.require) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('install-update');
    }
  };

  if (updateState === 'idle') return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-500">
      <div className="bg-white/95 backdrop-blur-xl border border-gray-200/60 p-6 rounded-3xl shadow-2xl shadow-blue-900/10 flex flex-col gap-4 min-w-[320px] relative overflow-hidden">
        {updateState === 'downloading' && (
          <>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shadow-inner">
                <DownloadCloud size={20} className="animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 leading-none mb-1">Downloading Update</h3>
                <p className="text-xs text-blue-600 font-bold">{Math.round(progress)}% Completed</p>
              </div>
            </div>
            
            <div className="w-full bg-gray-100/80 h-2.5 rounded-full overflow-hidden shadow-inner">
              <div 
                className="bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500 h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%`, backgroundSize: '200% 100%' }}
              />
            </div>
          </>
        )}

        {updateState === 'ready' && (
          <>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 shadow-inner">
                <CheckCircle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 leading-none mb-1">Update Ready</h3>
                <p className="text-[11px] text-gray-500 font-medium">Restart to install the latest version.</p>
              </div>
            </div>
            
            <button 
              onClick={handleInstall}
              className="mt-2 w-full bg-gray-900 hover:bg-black text-white font-bold py-3 rounded-xl shadow-md transition-transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
            >
              Restart & Install
            </button>
          </>
        )}
      </div>
    </div>
  );
}
