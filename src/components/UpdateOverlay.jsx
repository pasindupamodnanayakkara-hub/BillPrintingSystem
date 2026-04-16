import React, { useState, useEffect } from 'react';
import { DownloadCloud, CheckCircle, Info, ArrowUpCircle, Clock, Database, ChevronRight, X } from 'lucide-react';

const SKIPPED_VERSION_KEY = 'BILL_STUDIO_SKIP_VERSION';
const SKIPPED_ONCE_KEY = 'BILL_STUDIO_SKIPPED_ONCE';

export default function UpdateOverlay() {
  const [updateState, setUpdateState] = useState('idle'); // idle, available, downloading, ready
  const [progress, setProgress] = useState(null);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [isMandatory, setIsMandatory] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.require) {
      try {
        const { ipcRenderer } = window.require('electron');
        
        const handleUpdaterEvent = (event, data) => {
          if (data.type === 'update-available') {
            const newVersion = data.info.version;
            const savedVersion = localStorage.getItem(SKIPPED_VERSION_KEY);
            const savedSkip = localStorage.getItem(SKIPPED_ONCE_KEY) === 'true';

            // If it's a new version we haven't seen yet, reset skip flags
            if (savedVersion !== newVersion) {
              localStorage.removeItem(SKIPPED_VERSION_KEY);
              localStorage.removeItem(SKIPPED_ONCE_KEY);
              setIsMandatory(false);
            } else if (savedSkip) {
              setIsMandatory(true);
            }

            setUpdateInfo(data.info);
            setUpdateState('available');
          } else if (data.type === 'download-progress') {
            setUpdateState('downloading');
            setProgress(data.progress);
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

  const handleStartDownload = () => {
    if (typeof window !== 'undefined' && window.require) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('start-download');
      setUpdateState('downloading');
    }
  };

  const handleSkipOnce = () => {
    if (updateInfo) {
      localStorage.setItem(SKIPPED_VERSION_KEY, updateInfo.version);
      localStorage.setItem(SKIPPED_ONCE_KEY, 'true');
      setUpdateState('idle');
    }
  };

  const handleInstall = () => {
    if (typeof window !== 'undefined' && window.require) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('install-update');
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 MB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds === Infinity) return 'Calculating...';
    if (seconds < 60) return `${Math.round(seconds)}s remaining`;
    return `${Math.round(seconds / 60)}m remaining`;
  };

  if (updateState === 'idle') return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white/95 backdrop-blur-2xl border border-white/20 p-8 rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] flex flex-col gap-6 max-w-[440px] w-full relative overflow-hidden group">
        
        {/* Subtle Background Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 blur-[80px] rounded-full" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-yellow-500/10 blur-[80px] rounded-full" />

        {/* --- STATE: AVAILABLE --- */}
        {updateState === 'available' && (
          <>
            <div className="flex flex-col items-center text-center gap-4">
              <div className="h-20 w-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                <ArrowUpCircle size={40} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">New Update Found</h2>
                <p className="text-gray-500 font-medium mt-1">Version {updateInfo?.version} is now available.</p>
              </div>
            </div>

            <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100 flex flex-col gap-3">
              <div className="flex items-center gap-3 text-sm font-bold text-gray-700">
                <Info size={18} className="text-blue-500" />
                <span>What's new?</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed italic">
                This version includes performance improvements and bug fixes for the Bill Printing System.
              </p>
            </div>

            {isMandatory && (
              <div className="bg-red-50 p-4 rounded-3xl border border-red-100 flex items-center gap-3 animate-bounce-short">
                <X size={18} className="text-red-500" />
                <p className="text-xs font-bold text-red-600 uppercase tracking-wider">Update Required to Proceed</p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleStartDownload}
                className="w-full bg-gray-900 hover:bg-black text-white font-black py-4 rounded-2xl shadow-xl shadow-gray-900/10 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
              >
                Download & Install
                <ChevronRight size={20} />
              </button>
              
              {!isMandatory && (
                <button 
                  onClick={handleSkipOnce}
                  className="w-full bg-white hover:bg-gray-50 text-gray-500 font-bold py-3 rounded-2xl transition-all border border-transparent hover:border-gray-200"
                >
                  Skip for now
                </button>
              )}
            </div>
          </>
        )}

        {/* --- STATE: DOWNLOADING --- */}
        {updateState === 'downloading' && (
          <>
            <div className="flex flex-col items-center text-center gap-4">
              <div className="relative">
                <div className="h-20 w-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 shadow-inner">
                  <DownloadCloud size={40} className="animate-bounce" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-8 w-8 bg-blue-600 rounded-full border-4 border-white flex items-center justify-center text-[10px] font-black text-white">
                  {Math.round(progress?.percent || 0)}%
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Updating System</h2>
                <p className="text-gray-500 font-medium mt-1">Please keep the application open...</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50/50 p-4 rounded-3xl border border-blue-100/50 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-[10px] font-black text-blue-400 uppercase tracking-widest">
                  <Database size={12} />
                  Size
                </div>
                <div className="text-lg font-black text-blue-700">{formatSize(progress?.total)}</div>
              </div>
              <div className="bg-yellow-50/50 p-4 rounded-3xl border border-yellow-100/50 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-[10px] font-black text-yellow-500 uppercase tracking-widest">
                  <Clock size={12} />
                  Time
                </div>
                <div className="text-lg font-black text-yellow-700">
                  {formatDuration((progress?.total - progress?.transferred) / progress?.bytesPerSecond)}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden shadow-inner p-1">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-300 ease-out relative"
                  style={{ width: `${progress?.percent || 0}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
              </div>
              <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                <span>{formatSize(progress?.transferred)} Transferred</span>
                <span>{Math.round(progress?.bytesPerSecond / 1024)} KB/s</span>
              </div>
            </div>
          </>
        )}

        {/* --- STATE: READY --- */}
        {updateState === 'ready' && (
          <>
            <div className="flex flex-col items-center text-center gap-4">
              <div className="h-20 w-20 bg-green-500 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-green-500/20 animate-pulse">
                <CheckCircle size={40} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Ready to Install</h2>
                <p className="text-gray-500 font-medium mt-1">The update has been successfully downloaded.</p>
              </div>
            </div>

            <div className="bg-green-50 p-6 rounded-3xl border border-green-100 text-center">
              <p className="text-sm text-green-700 font-bold leading-relaxed">
                The application will now close and restart automatically to apply the new version.
              </p>
            </div>

            <button 
              onClick={handleInstall}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-green-600/10 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
            >
              Restart Now
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes bounce-short {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-bounce-short {
          animation: bounce-short 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

