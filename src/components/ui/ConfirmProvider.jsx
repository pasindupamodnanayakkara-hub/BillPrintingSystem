import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';

const ConfirmContext = createContext(null);

export const useConfirm = () => useContext(ConfirmContext);

export const ConfirmProvider = ({ children }) => {
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    resolve: null,
  });

  const confirm = useCallback(({ title, message }) => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title,
        message,
        resolve,
      });
    });
  }, []);

  const handleClose = (result) => {
    if (confirmState.resolve) {
      confirmState.resolve(result);
    }
    setConfirmState(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {confirmState.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-4">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight italic mb-2">{confirmState.title || 'Please Confirm'}</h3>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">{confirmState.message}</p>
            </div>
            <div className="p-4 bg-gray-50 flex gap-3 justify-end border-t border-gray-100">
              <button 
                onClick={() => handleClose(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleClose(true)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-black text-white hover:bg-gray-900 shadow-lg active:scale-95 transition-all"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};
