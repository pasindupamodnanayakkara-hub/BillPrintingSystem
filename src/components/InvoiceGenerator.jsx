import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Printer, ArrowLeft, Settings } from 'lucide-react';
import { getSettings } from '../config/settings';
import { getProfiles } from '../config/profiles';
import defaultLogo from '../assets/logo.png';
import { getNextInvoiceNumber, saveBill } from '../services/billService';
import { getInventory } from '../services/inventoryService';
import { useToast } from './ui/ToastProvider';

const InvoiceGenerator = () => {
  const { toast } = useToast();
  const settings = getSettings();
  const printRef = useRef();
  const previewContainerRef = useRef();
  const [previewScale, setPreviewScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      if (previewContainerRef.current) {
        const height = previewContainerRef.current.clientHeight;
        const width = previewContainerRef.current.clientWidth;
        
        // Exact A4 pixels at 96 DPI
        const A4_HEIGHT = 1123;
        const A4_WIDTH = 794;
        
        // Minimal padding to maximize size while keeping edges visible
        const PADDING = 24; 
        
        const scaleH = (height - PADDING) / A4_HEIGHT;
        const scaleW = (width - PADDING) / A4_WIDTH;
        
        // Ensure scale is exactly enough to fit both bounds, cap at 1.5 to prevent pixelation on ultra-wide screens
        setPreviewScale(Math.min(scaleH, scaleW, 1.5)); 
       }
     };
     
    // Slight timeout matches DOM paint timing before reading geometry
    setTimeout(updateScale, 10);
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const profiles = getProfiles();
  const [selectedProfileId, setSelectedProfileId] = useState(profiles[0]?.id || '');

  const [invoiceData, setInvoiceData] = useState({
    companyName: profiles[0]?.name || settings.studioName,
    companyEmail: profiles[0]?.email || settings.email,
    companyPhone: profiles[0]?.phone || settings.phone,
    companyAddress: profiles[0]?.address || settings.address,
    companyLogo: profiles[0]?.logo || defaultLogo,
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
    invoiceNumber: getNextInvoiceNumber(),
    invoiceDate: today,
    dueDate: today,
    taxRate: settings.taxRate,
    discount: 0,
    discountType: 'amount', // 'amount' or 'percentage'
    items: [
      { id: 1, description: '', qty: 1, price: 0 }
    ],
    notes: '',
    paymentStatus: 'Awaiting Payment'
  });

  const [inventory, setInventory] = useState([]);
  const [showInventory, setShowInventory] = useState(null); // ID of item being edited

  useEffect(() => {
    setInventory(getInventory());
  }, []);

  // Update document title to suggest filename for PDF printing
  useEffect(() => {
    document.title = invoiceData.invoiceNumber;
  }, [invoiceData.invoiceNumber]);

  const handleProfileSelect = (profileId) => {
    setSelectedProfileId(profileId);
    const profile = profiles.find(p => p.id === profileId);
    if (profile) {
      setInvoiceData({
        ...invoiceData,
        companyName: profile.name,
        companyEmail: profile.email,
        companyPhone: profile.phone,
        companyAddress: profile.address,
        companyLogo: profile.logo || defaultLogo,
        paymentStatus: invoiceData.paymentStatus
      });
    }
  };

  const handleInputChange = (field, value) => {
    setInvoiceData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (id, field, value) => {
    setInvoiceData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === id ? { ...item, [field]: field === 'qty' || field === 'price' ? Number(value) : value } : item
      )
    }));
  };

  const addItem = () => {
    setInvoiceData({
      ...invoiceData,
      items: [...invoiceData.items, { id: Date.now(), description: '', qty: 1, price: 0 }]
    });
  };

  const removeItem = (id) => {
    setInvoiceData({
      ...invoiceData,
      items: invoiceData.items.filter(item => item.id !== id)
    });
  };

  const subtotal = invoiceData.items.reduce((sum, item) => sum + (item.qty * item.price), 0);
  const taxAmount = (subtotal * invoiceData.taxRate) / 100;
  
  const discountAmount = invoiceData.discountType === 'percentage' 
    ? (subtotal * Number(invoiceData.discount || 0)) / 100 
    : Number(invoiceData.discount || 0);

  const total = subtotal + taxAmount - discountAmount;
  const cur = settings.currency || 'Rs.';

  const handlePrint = async () => {
    // 1. Basic validation
    if (invoiceData.items.length === 0 || (invoiceData.items.length === 1 && !invoiceData.items[0].description && invoiceData.items[0].price === 0)) {
      toast('Please add at least one item with a description and price before printing.', 'error');
      return;
    }

    if (total <= 0) {
      toast('Invoice total must be greater than 0 to save.', 'error');
      return;
    }

    const billRecord = {
      ...invoiceData,
      subtotal,
      taxAmount,
      discountAmount,
      total,
      currency: cur
    };

    // 2. Detect Electron
    const ipcRenderer = window?.require ? window.require('electron').ipcRenderer : null;

    if (ipcRenderer) {
      // 3. Use specialized Electron PDF handler with custom filename
      try {
        const success = await ipcRenderer.invoke('print-to-pdf', { filename: invoiceData.invoiceNumber });
        if (success) {
           // ONLY save to history if the user actually saved the PDF
           saveBill(billRecord);
           window.location.reload();
        }
      } catch (err) {
        console.error('IPC PDF error:', err);
        // Fallback for unexpected IPC errors
        saveBill(billRecord);
        window.print();
        window.location.reload();
      }
    } else {
      // 4. Standard browser print
      saveBill(billRecord);
      window.print();
      window.location.reload();
    }
  };



  return (
    <>
        <style>{`
          @media print {
            html { font-size: 2.015vw !important; }
            @page { size: auto; margin: 0; }
            body { 
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important; 
              background: white !important;
            }
            /* Hide the scrollbars and reset layout for printing */
            html, body, #root {
              height: max-content !important;
              min-height: 100vh !important;
              overflow: visible !important;
            }
            
            /* Remove absolute and transforms, make everything flow naturally */
            .no-print-transform { 
              transform: none !important; 
              width: 100% !important; 
              height: max-content !important; 
              box-shadow: none !important; 
              margin: 0 !important;
            }
            
            #invoice-print-area { 
              position: static !important;
              width: 100% !important; 
              min-height: 98vh !important;
              margin: 0 !important; 
              padding: 10mm !important;
              padding-bottom: 0 !important;
              box-sizing: border-box !important;
              background: white !important;
              box-shadow: none !important;
              border: none !important;
              display: flex !important;
              flex-direction: column !important;
            }
            
            #invoice-print-area > div { 
              flex: 1 !important; 
              display: flex !important; 
              flex-direction: column !important; 
            }
            
            .no-print { display: none !important; }
          }
        `}</style>

      <div className="flex h-full bg-transparent p-5 gap-5 print:block print:p-0 print:h-auto print:bg-white">
        {/* Left Pane: Input Form */}
        <div className="w-[380px] shrink-0 bg-white border border-gray-200 rounded-2xl flex flex-col shadow-xl overflow-y-auto print:hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 sticky top-0 z-10 backdrop-blur-sm">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Bill Generator</h2>
              <p className="text-xs text-gray-400 mt-0.5">Studio Darkroom Professional</p>
            </div>
          </div>

          <div className="p-6 space-y-8 pb-10">
            {/* Studio Selection */}
            <section className="mb-6 relative">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-3">Active Studio</h3>
              
              {/* Custom Dropdown Trigger */}
              <div 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`relative group bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 flex items-center justify-between hover:border-accent-gold transition-all cursor-pointer shadow-sm active:scale-[0.98] ${isDropdownOpen ? 'border-accent-gold ring-2 ring-accent-gold/10 bg-white' : ''}`}
              >
                <div className="flex items-center gap-3 min-w-0 pointer-events-none">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center overflow-hidden shrink-0 shadow-sm border border-gray-100">
                    <img src={invoiceData.companyLogo} alt="" className="w-full h-full object-contain p-1" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[0.625rem] font-bold text-accent-gold uppercase tracking-widest leading-none mb-0.5">Selected Profile</span>
                    <span className="text-sm font-black text-gray-900 tracking-tight truncate uppercase italic">
                      {profiles.find(p => p.id === selectedProfileId)?.name || 'SELECT STUDIO'}
                    </span>
                  </div>
                </div>
                <div className={`text-gray-400 group-hover:text-accent-gold transition-transform duration-300 shrink-0 ${isDropdownOpen ? 'rotate-180 text-accent-gold' : ''}`}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>

              {/* Custom Dropdown List */}
              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in slide-in-from-top-2 duration-200">
                    <div className="max-h-[240px] overflow-y-auto space-y-1 custom-scrollbar">
                      {profiles.map(p => (
                        <div 
                          key={p.id}
                          onClick={() => {
                            handleProfileSelect(p.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`flex items-center gap-4 p-3 rounded-xl transition-all cursor-pointer ${selectedProfileId === p.id ? 'bg-gray-900 text-white shadow-xl' : 'hover:bg-gray-50 text-gray-700'}`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden shrink-0 border ${selectedProfileId === p.id ? 'bg-white border-white/20' : 'bg-white border-gray-100'}`}>
                            <img src={p.logo} alt="" className="w-full h-full object-contain p-1.5" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className={`text-xs font-black tracking-tight uppercase italic truncate ${selectedProfileId === p.id ? 'text-white' : 'text-gray-900'}`}>
                              {p.name}
                            </span>
                            <span className={`text-[9px] font-bold uppercase tracking-wider ${selectedProfileId === p.id ? 'text-accent-gold/80' : 'text-gray-400'}`}>
                              {p.id === 'studio-dark-room' ? 'Primary Office' : 'Business Unit'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </section>

            {/* Payment Status Selection */}
            <section className="mb-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-3">Payment Status</h3>
              <div className="flex gap-2">
                {['Awaiting Payment', 'Paid', 'Partial', 'Cancelled'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setInvoiceData(prev => ({ ...prev, paymentStatus: status }))}
                    className={`flex-1 py-2 px-1 rounded-xl text-[0.625rem] font-black uppercase tracking-tighter transition-all border ${
                      invoiceData.paymentStatus === status 
                        ? 'bg-gray-900 border-gray-900 text-white shadow-lg' 
                        : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {status.split(' ')[0]}
                  </button>
                ))}
              </div>
            </section>

            {/* Client Details */}
            <section>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Client Information</h3>
              <div className="space-y-3">
                <div className="relative">
                  <label className="text-[0.6875rem] absolute -top-2 left-3 bg-white px-1 font-bold text-gray-400 z-10 uppercase tracking-wider">Client Name *</label>
                  <input type="text" placeholder="e.g. John Doe" className="w-full border border-gray-200 rounded-xl p-3 text-base focus:border-accent-gold outline-none" value={invoiceData.clientName} onChange={(e) => handleInputChange('clientName', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <label className="text-[0.6875rem] absolute -top-2 left-3 bg-white px-1 font-bold text-gray-400 z-10 uppercase tracking-wider">Email</label>
                    <input type="text" className="w-full border border-gray-200 rounded-xl p-3 text-base focus:border-accent-gold outline-none" value={invoiceData.clientEmail} onChange={(e) => handleInputChange('clientEmail', e.target.value)} />
                  </div>
                  <div className="relative">
                    <label className="text-[0.6875rem] absolute -top-2 left-3 bg-white px-1 font-bold text-gray-400 z-10 uppercase tracking-wider">Phone</label>
                    <input type="text" className="w-full border border-gray-200 rounded-xl p-3 text-base focus:border-accent-gold outline-none" value={invoiceData.clientPhone} onChange={(e) => handleInputChange('clientPhone', e.target.value)} />
                  </div>
                </div>
                <div className="relative">
                  <label className="text-[0.6875rem] absolute -top-2 left-3 bg-white px-1 font-bold text-gray-400 z-10 uppercase tracking-wider">Address</label>
                  <input type="text" className="w-full border border-gray-200 rounded-xl p-3 text-base focus:border-accent-gold outline-none" value={invoiceData.clientAddress} onChange={(e) => handleInputChange('clientAddress', e.target.value)} />
                </div>
              </div>
            </section>

            {/* Invoice Meta */}
            <section>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Invoice Meta</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <label className="text-[0.6875rem] absolute -top-2 left-3 bg-white px-1 font-bold text-gray-400 z-10 uppercase tracking-wider">Invoice #</label>
                    <input type="text" className="w-full border border-gray-200 rounded-xl p-3 text-base focus:border-accent-gold outline-none font-bold" value={invoiceData.invoiceNumber} onChange={(e) => handleInputChange('invoiceNumber', e.target.value)} />
                  </div>
                  <div className="relative">
                    <label className="text-[0.6875rem] absolute -top-2 left-3 bg-white px-1 font-bold text-gray-400 z-10 uppercase tracking-wider">Date</label>
                    <input type="text" className="w-full border border-gray-200 rounded-xl p-3 text-base focus:border-accent-gold outline-none" value={invoiceData.invoiceDate} onChange={(e) => handleInputChange('invoiceDate', e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <label className="text-[0.6875rem] absolute -top-2 left-3 bg-white px-1 font-bold text-gray-400 z-10 uppercase tracking-wider">Due Date</label>
                    <input type="text" className="w-full border border-gray-200 rounded-xl p-3 text-base focus:border-accent-gold outline-none" value={invoiceData.dueDate} onChange={(e) => handleInputChange('dueDate', e.target.value)} />
                  </div>
                  <div className="relative">
                    <label className="text-[0.6875rem] absolute -top-2 left-3 bg-white px-1 font-bold text-gray-400 z-10 uppercase tracking-wider">Tax (%)</label>
                    <input type="number" className="w-full border border-gray-200 rounded-xl p-3 text-base focus:border-accent-gold outline-none" value={invoiceData.taxRate} onChange={(e) => handleInputChange('taxRate', e.target.value)} />
                  </div>
                </div>
                <div className="relative">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[0.625rem] font-bold text-gray-400 uppercase tracking-widest pl-1">Discount</label>
                    <div className="flex bg-gray-100 rounded-lg p-0.5">
                      <button 
                        onClick={() => handleInputChange('discountType', 'amount')}
                        className={`px-2 py-0.5 text-[9px] font-black rounded-md transition-all ${invoiceData.discountType === 'amount' ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}
                      >
                        {cur}
                      </button>
                      <button 
                        onClick={() => handleInputChange('discountType', 'percentage')}
                        className={`px-2 py-0.5 text-[9px] font-black rounded-md transition-all ${invoiceData.discountType === 'percentage' ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}
                      >
                        %
                      </button>
                    </div>
                  </div>
                    <input 
                    type="number" 
                    className="w-full border border-gray-200 rounded-xl p-3 text-base font-bold focus:border-accent-gold outline-none" 
                    placeholder={invoiceData.discountType === 'percentage' ? 'e.g. 10' : 'e.g. 100'}
                    value={invoiceData.discount} 
                    onChange={(e) => handleInputChange('discount', e.target.value)} 
                    onFocus={(e) => e.target.select()}
                  />
                </div>
              </div>
            </section>

            {/* Items */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pricing Items</h3>
                <button onClick={addItem} className="text-[0.625rem] font-bold bg-accent-gold/10 text-accent-gold px-3 py-1 rounded-full hover:bg-accent-gold/20 transition-all uppercase tracking-wider">
                  + Add Line
                </button>
              </div>
              <div className="space-y-3">
                {invoiceData.items.map((item) => (
                  <div key={item.id} className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100 space-y-2 relative group">
                    <label className="text-[0.625rem] font-black text-gray-400 uppercase tracking-widest mb-2 block">Service or Product Description</label>
                    <input 
                      type="text" 
                      className="w-full text-base font-bold outline-none bg-transparent placeholder-gray-300 border-b border-gray-100 focus:border-black transition-colors pb-1"
                      placeholder="e.g. Wedding Photography - Gold Package"
                      value={item.description}
                      onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                      onFocus={() => setShowInventory(item.id)}
                      onBlur={() => setTimeout(() => setShowInventory(null), 200)}
                    />
                    {showInventory === item.id && (
                      <div className="absolute z-30 left-0 right-0 top-full mt-1 bg-white border-2 border-accent-gold/20 rounded-2xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                        {inventory
                          .filter(inv => inv.name.toLowerCase().includes(item.description.toLowerCase()))
                          .map(inv => (
                            <button 
                              key={inv.id}
                              onClick={() => {
                                handleItemChange(item.id, 'description', inv.name);
                                handleItemChange(item.id, 'price', inv.price);
                                setShowInventory(null);
                              }}
                              className="w-full px-5 py-4 text-left hover:bg-accent-gold/5 flex justify-between items-center group transition-colors border-b border-gray-50 last:border-0"
                            >
                              <span className="text-base font-black text-gray-800 italic uppercase tracking-tight group-hover:text-black">{inv.name}</span>
                              <span className="text-xs font-black text-accent-gold bg-accent-gold/10 px-3 py-1 rounded-full uppercase tracking-widest">{cur} {inv.price}</span>
                            </button>
                          ))
                        }
                      </div>
                    )}
                    <div className="flex gap-3">
                      <div className="flex-1 flex items-center gap-2">
                        <span className="text-[0.625rem] font-bold text-gray-400 uppercase">Qty</span>
                        <input type="number" className="w-full bg-transparent p-1 text-sm border-b border-gray-200 focus:border-accent-gold outline-none" value={item.qty} onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)} onFocus={(e) => e.target.select()} />
                      </div>
                      <div className="flex-1 flex items-center gap-2">
                        <span className="text-[0.625rem] font-bold text-gray-400 uppercase">Price</span>
                        <input type="number" className="w-full bg-transparent p-1 text-sm border-b border-gray-200 focus:border-accent-gold outline-none" value={item.price} onChange={(e) => handleItemChange(item.id, 'price', e.target.value)} onFocus={(e) => e.target.select()} />
                      </div>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="absolute -top-2 -right-2 bg-white text-red-400 hover:text-red-600 p-1.5 rounded-full shadow-md border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </div>

        {/* Right Pane: Live Preview */}
        <div className="flex-1 flex flex-col gap-4 min-w-0 min-h-0 overflow-hidden print:block print:overflow-visible print:h-auto">
          {/* Print Toolbar */}
          <div className="bg-white border border-gray-200 rounded-2xl px-8 py-4 shadow-xl flex justify-between items-center backdrop-blur-md bg-white/90 print:hidden">
            <div>
              <span className="text-sm font-bold text-gray-800 uppercase tracking-widest">Document Preview</span>
              <p className="text-xs text-gray-400">High-fidelity print rendering</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                className="flex items-center gap-3 bg-black text-white px-8 py-3 rounded-2xl text-sm font-bold hover:bg-gray-900 transition-all shadow-xl shadow-black/10 active:scale-95 hover:shadow-accent-gold/20"
              >
                <Printer size={18} />
                Print / Save PDF
              </button>
            </div>
          </div>

          {/* Dynamic Scaled Container */}
          <div className="flex-1 overflow-hidden relative flex items-center justify-center bg-transparent mb-5 print:block print:overflow-visible print:m-0 print:p-0" ref={previewContainerRef}>
            {/* Safe Area wrapper to apply transform dynamically */}
            <div 
              style={{ 
                transform: `scale(${previewScale})`,
                width: '794px',
                height: '1123px',
              }}
              className="origin-center shadow-2xl bg-white flex flex-col shrink-0 no-print-transform transition-transform duration-75"
            >
              <div id="invoice-print-area" className="flex-1 p-16 flex flex-col h-full w-full bg-white relative" ref={printRef}>
                            <div className="w-full mx-auto flex flex-col gap-6 h-full">

              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <div className="mb-6">
                    <img 
                      src={invoiceData.companyLogo} 
                      alt={invoiceData.companyName} 
                      className="h-20 w-auto object-contain mix-blend-multiply contrast-[1.1]" 
                    />
                  </div>
                  <div className="space-y-1">
                    {invoiceData.companyEmail && <p className="text-sm font-bold text-gray-500">{invoiceData.companyEmail}</p>}
                    {invoiceData.companyPhone && <p className="text-sm font-bold text-gray-500">{invoiceData.companyPhone}</p>}
                    {invoiceData.companyAddress && <p className="text-sm font-bold text-gray-500">{invoiceData.companyAddress}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex flex-col items-end gap-3 mb-4">
                    <h1 className="text-5xl font-black text-gray-900 tracking-tighter italic uppercase truncate max-w-[500px] pr-4 leading-none">{invoiceData.companyName}</h1>
                    <div className={`px-4 py-1.5 rounded-full text-[0.625rem] font-black uppercase tracking-[0.2em] border shadow-sm ${
                      invoiceData.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      invoiceData.paymentStatus === 'Partially Paid' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      invoiceData.paymentStatus === 'Cancelled' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                      'bg-gray-50 text-gray-600 border-gray-100'
                    }`}>
                      {invoiceData.paymentStatus}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-[0.6875rem] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Invoice Number</p>
                      <p className="text-base font-black text-gray-900">{invoiceData.invoiceNumber}</p>
                    </div>
                    <div>
                       <p className="text-[0.6875rem] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Date Issued</p>
                       <p className="text-sm font-black text-gray-700">{invoiceData.invoiceDate}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Accent Line */}
              <div className="h-1 bg-accent-gold rounded-full w-full" />

              {/* Details Row */}
              <div className="grid grid-cols-2 gap-12">
                <div>
                  <p className="text-[0.6875rem] font-black text-accent-gold uppercase tracking-[0.2em] mb-1">Bill To</p>
                  <p className="text-2xl font-black text-gray-900 leading-tight">{invoiceData.clientName || 'Valued Client'}</p>
                  <div className="mt-3 space-y-1">
                    {invoiceData.clientAddress && <p className="text-sm font-bold text-gray-500">{invoiceData.clientAddress}</p>}
                    {invoiceData.clientEmail && <p className="text-sm font-bold text-gray-500">{invoiceData.clientEmail}</p>}
                    {invoiceData.clientPhone && <p className="text-sm font-bold text-gray-500">{invoiceData.clientPhone}</p>}
                  </div>
                </div>
                <div className="text-right flex flex-col justify-end">
                   <p className="text-[0.6875rem] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Due Date</p>
                   <p className="text-base font-black text-gray-800">{invoiceData.dueDate}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="mt-4">
                <div className="grid grid-cols-12 bg-gray-900 border border-gray-900 rounded-t-2xl py-4 px-6">
                  <div className="col-span-6 text-[0.625rem] font-black text-white uppercase tracking-widest">Description</div>
                  <div className="col-span-2 text-[0.625rem] font-black text-white uppercase tracking-widest text-center">Qty</div>
                  <div className="col-span-2 text-[0.625rem] font-black text-white uppercase tracking-widest text-right">Rate</div>
                  <div className="col-span-2 text-[0.625rem] font-black text-white uppercase tracking-widest text-right">Amount</div>
                </div>
                <div className="border-x border-b border-gray-100 rounded-b-2xl overflow-hidden">
                  {invoiceData.items.map((item, i) => (
                    <div key={item.id} className={`grid grid-cols-12 py-5 px-6 ${i !== invoiceData.items.length - 1 ? 'border-b border-gray-50' : ''} hover:bg-gray-50/50 transition-colors`}>
                      <div className="col-span-6">
                        <p className="text-sm font-bold text-gray-800">{item.description || 'General Photography Service'}</p>
                      </div>
                      <div className="col-span-2 text-sm font-bold text-gray-600 text-center">{item.qty}</div>
                      <div className="col-span-2 text-sm font-bold text-gray-600 text-right">{cur}{Number(item.price).toLocaleString()}</div>
                      <div className="col-span-2 text-sm font-black text-gray-900 text-right">{cur}{(item.qty * item.price).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="flex justify-end mt-4">
                <div className="w-72 bg-gray-50 rounded-3xl p-6 space-y-3 border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                    <span className="uppercase tracking-widest">Subtotal</span>
                    <span className="text-gray-800">{cur}{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-gray-500 border-b border-gray-200 pb-3">
                    <span className="uppercase tracking-widest">Tax ({invoiceData.taxRate}%)</span>
                    <span className="text-gray-800">{cur}{taxAmount.toLocaleString()}</span>
                  </div>
                  {invoiceData.discount > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 pb-3">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                       Discount {invoiceData.discountType === 'percentage' && `(${invoiceData.discount}%)`}
                    </span>
                    <span className="text-gray-800">-{cur}{discountAmount.toLocaleString()}</span>
                  </div>
                  )}
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[0.625rem] font-black text-accent-gold uppercase tracking-[0.2em]">Total Amount</span>
                    <span className="text-2xl font-black text-gray-900">{cur}{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-auto pt-10 border-t border-gray-100 flex flex-col items-center text-center pb-4">
                <p className="text-[0.6875rem] font-black text-gray-400 uppercase tracking-[0.3em] mb-2 italic">Thank you for your business</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-px bg-gray-200" />
                  <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{invoiceData.companyName} Team</p>
                  <div className="w-8 h-px bg-gray-200" />
                </div>
              </div>
              
            </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default InvoiceGenerator;
