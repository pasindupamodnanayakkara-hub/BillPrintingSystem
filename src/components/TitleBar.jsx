import React from 'react';

const TitleBar = () => {
  return (
    <div className="h-10 bg-gray-900 flex justify-between items-center select-none shadow-md border-b border-gray-800" style={{ WebkitAppRegion: 'drag' }}>
      {/* App Info */}
      <div className="flex items-center gap-3 px-4">
        <div className="w-5 h-5 bg-accent-gold rounded flex items-center justify-center">
            <span className="text-black font-black text-[10px] italic">DR</span>
        </div>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Studio Darkroom | Bill Printing System</span>
      </div>

      {/* 
          Native Window Controls are overlaid here by Windows 10/11 
          (titleBarOverlay enabled in electron-main.cjs)
      */}
      <div className="w-[140px]" /> 
    </div>
  );
};

export default TitleBar;
