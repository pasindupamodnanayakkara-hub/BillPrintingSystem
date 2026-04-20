/**
 * Service for local bill storage and sequential numbering
 */

const BILL_HISTORY_KEY = 'BILL_HISTORY';
const BILL_COUNTER_KEY = 'BILL_COUNTER';
const SETTINGS_KEY = 'BILL_STUDIO_SETTINGS';

export const getBillHistory = () => {
  const data = localStorage.getItem(BILL_HISTORY_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveBill = (billData) => {
  const history = getBillHistory();
  const newBill = {
    ...billData,
    id: Date.now(),
    timestamp: new Date().toISOString()
  };
  
  localStorage.setItem(BILL_HISTORY_KEY, JSON.stringify([newBill, ...history]));
  
  // Increment counter if it matches the current bill number format
  const currentCounter = Number(localStorage.getItem(BILL_COUNTER_KEY) || '1000');
  localStorage.setItem(BILL_COUNTER_KEY, String(currentCounter + 1));
  
  return newBill;
};

export const getNextInvoiceNumber = () => {
  const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  const prefix = settings.invoicePrefix || 'INV-';
  const counter = localStorage.getItem(BILL_COUNTER_KEY) || '1000';
  return `${prefix}${counter}`;
};

export const setNextInvoiceNumber = (num) => {
  localStorage.setItem(BILL_COUNTER_KEY, String(num));
};

export const restoreHistory = (bills) => {
  localStorage.setItem(BILL_HISTORY_KEY, JSON.stringify(bills));
  
  if (bills.length > 0) {
    const numbers = bills.map(b => {
      const match = b.invoiceNumber.match(/\d+$/);
      return match ? parseInt(match[0], 10) : 0;
    });
    const maxNum = Math.max(...numbers);
    if (maxNum > 0) {
      localStorage.setItem(BILL_COUNTER_KEY, String(maxNum + 1));
    }
  }
};

export const restoreFullBundle = (bundle) => {
  if (Array.isArray(bundle)) {
    // Legacy format (just bills)
    restoreHistory(bundle);
  } else if (bundle && typeof bundle === 'object') {
    // New format (bills + profiles + settings)
    if (bundle.bills) restoreHistory(bundle.bills);
    if (bundle.profiles) localStorage.setItem('business_profiles', JSON.stringify(bundle.profiles));
    if (bundle.settings) localStorage.setItem(SETTINGS_KEY, JSON.stringify(bundle.settings));
  }
};

export const deleteBill = (id) => {
  const history = getBillHistory();
  const updatedHistory = history.filter(bill => bill.id !== id);
  localStorage.setItem(BILL_HISTORY_KEY, JSON.stringify(updatedHistory));
  return updatedHistory;
};
