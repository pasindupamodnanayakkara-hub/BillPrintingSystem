import React from 'react';
import { Minus, Square, X } from 'lucide-react';

const TitleBar = () => {
  const handleWindowControl = (action) => {
    if (typeof window !== 'undefined' && window.require) {
      window.require('electron').ipcRenderer.send(action);
    }
  };

  return (
    <div className="h-10 bg-gray-900 flex justify-between items-center select-none shadow-md border-b border-gray-800" style={{ WebkitAppRegion: 'drag' }}>
      {/* App Info */}
      <div className="flex items-center gap-3 px-4">
        <div className="w-5 h-5 bg-accent-gold rounded flex items-center justify-center">
            <span className="text-black font-black text-[10px] italic">DR</span>
        </div>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Studio Darkroom | Bill Printing System</span>
      </div>

      {/* Window Controls */}
      <div className="flex h-full no-drag" style={{ WebkitAppRegion: 'no-drag' }}>
        <button onClick={() => handleWindowControl('minimize-window')} className="px-4 h-full flex items-center justify-center hover:bg-gray-800 transition-colors group">
          <Minus size={14} className="text-gray-400 group-hover:text-white" />
        </button>
        <button onClick={() => handleWindowControl('maximize-window')} className="px-4 h-full flex items-center justify-center hover:bg-gray-800 transition-colors group">
          <Square size={10} className="text-gray-400 group-hover:text-white" />
        </button>
        <button onClick={() => handleWindowControl('close-window')} className="px-4 h-full flex items-center justify-center hover:bg-red-600 transition-colors group">
          <X size={14} className="text-gray-400 group-hover:text-white" />
        </button>
      </div>
    </div>
  );
};

export default TitleBar;
