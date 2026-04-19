import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className="pointer-events-auto flex items-center gap-3 bg-white/95 backdrop-blur-xl border border-gray-100 p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] min-w-[300px] animate-in slide-in-from-right-8 fade-in duration-300"
          >
            {t.type === 'success' && <CheckCircle2 className="text-green-500 shrink-0" size={20} />}
            {t.type === 'error' && <XCircle className="text-red-500 shrink-0" size={20} />}
            {t.type === 'info' && <Info className="text-blue-500 shrink-0" size={20} />}
            
            <p className="text-sm font-bold text-gray-800 flex-1">{t.message}</p>
            
            <button 
              onClick={() => removeToast(t.id)}
              className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
