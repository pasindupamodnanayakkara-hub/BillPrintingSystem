import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 p-5 border border-indigo-100 bg-white rounded-2xl shadow-2xl flex flex-col gap-3 w-80 animate-in slide-in-from-bottom-5">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
          <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
        </div>
        <div className="text-sm font-black text-gray-900 tracking-tight">
          UPDATE AVAILABLE
        </div>
      </div>
      <p className="text-xs font-semibold text-gray-500 leading-relaxed">
        A new version of the app is ready. Click update to apply the changes instantly.
      </p>
      <div className="flex gap-2 mt-2">
        <button
          className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold text-gray-600 transition-colors"
          onClick={() => setNeedRefresh(false)}
        >
          LATER
        </button>
        <button
          className="flex-1 py-2.5 bg-black hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition-colors shadow-md flex items-center justify-center gap-2"
          onClick={() => updateServiceWorker(true)}
        >
          UPDATE NOW
        </button>
      </div>
    </div>
  );
}

export default ReloadPrompt;
