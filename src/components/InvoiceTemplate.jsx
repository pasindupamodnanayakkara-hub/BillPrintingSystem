import React from 'react';

const DEFAULT_INVOICE = {
  id: 'INV-2024-001',
  date: new Date().toLocaleDateString(),
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
  client: {
    name: 'Sarah Johnson',
    email: 'sarah.j@example.com',
    phone: '+1 (555) 012-3456'
  },
  items: [
    { description: 'Wedding Photography - 8 Hours', quantity: 1, price: 2500 },
    { description: 'Engagement Session', quantity: 1, price: 500 },
    { description: 'Fine Art Print Album', quantity: 1, price: 350 }
  ],
  total: 3350,
  tax: 335,
  grandTotal: 3685,
  verificationCode: 'DS-84921'
};

const InvoiceTemplate = ({ invoice }) => {
  // Mock invoice data if none provided
  const data = invoice || DEFAULT_INVOICE;

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white text-black shadow-2xl rounded-sm my-10 font-sans border-t-8 border-accent-gold">
      {/* Header */}
      <div className="flex justify-between items-start mb-12">
        <div>
          <div className="w-16 h-16 bg-black flex items-center justify-center text-white font-bold text-3xl mb-4 shadow-lg">D</div>
          <h1 className="text-2xl font-bold uppercase tracking-widest text-gray-900 leading-tight">Darkroom<br/>Studios</h1>
          <p className="text-gray-500 text-sm mt-2">Professional Photography & Media</p>
        </div>
        <div className="text-right">
          <h2 className="text-4xl font-light text-gray-300 uppercase mb-4 tracking-[0.2em] italic">Invoice</h2>
          <div className="text-sm space-y-1">
            <p><span className="text-gray-400 font-medium font-bold">Ref No:</span> {data.id}</p>
            <p><span className="text-gray-400 font-medium font-bold">Date:</span> {data.date}</p>
            <p><span className="text-gray-400 font-medium font-bold">Due Date:</span> {data.dueDate}</p>
          </div>
        </div>
      </div>

      {/* Client Info */}
      <div className="grid grid-cols-2 gap-10 mb-12 border-t border-b border-gray-100 py-10">
        <div>
          <h3 className="text-xs font-black text-accent-gold uppercase mb-4 tracking-widest">Client Recipient</h3>
          <p className="text-xl font-black text-gray-900">{data.client.name}</p>
          <p className="text-gray-600 font-medium">{data.client.email}</p>
          <p className="text-gray-500 text-sm">{data.client.phone}</p>
        </div>
        <div className="text-right">
          <h3 className="text-xs font-black text-gray-400 uppercase mb-4 tracking-widest">Payment Authority</h3>
          <p className="text-gray-900 font-bold">Bank Transfer / PayPal / Cash</p>
          <p className="text-gray-500 text-sm italic">Verification Code: {data.verificationCode}</p>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-12">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b-2 border-gray-900">
              <th className="py-4 font-black uppercase text-xs tracking-[0.2em] text-gray-900">Service Description</th>
              <th className="py-4 font-black uppercase text-xs tracking-[0.2em] text-gray-900 text-center">Unit</th>
              <th className="py-4 font-black uppercase text-xs tracking-[0.2em] text-gray-900 text-right">Rate</th>
              <th className="py-4 font-black uppercase text-xs tracking-[0.2em] text-gray-900 text-right">Extended</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="py-6 font-bold text-gray-800">{item.description}</td>
                <td className="py-6 text-center font-medium text-gray-600">{item.quantity}</td>
                <td className="py-6 text-right font-medium text-gray-600">Rs.{item.price.toLocaleString()}</td>
                <td className="py-6 text-right font-black text-gray-900">Rs.{(item.quantity * item.price).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-80 space-y-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
          <div className="flex justify-between text-gray-500 font-bold text-xs uppercase tracking-widest">
            <span>Subtotal:</span>
            <span className="text-gray-900">Rs.{data.total.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-gray-500 font-bold text-xs uppercase tracking-widest">
            <span>Government Tax (10%):</span>
            <span className="text-gray-900">Rs.{data.tax.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-2xl font-black border-t-4 border-accent-gold pt-4 text-gray-900">
            <span>TOTAL:</span>
            <span>Rs.{data.grandTotal.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-24 pt-10 border-t border-gray-100 text-center">
        <p className="text-gray-400 text-sm font-medium italic">Thank you for letting us capture your moments with precision and art.</p>
        <div className="mt-8 flex justify-center gap-10 text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">
          <span className="hover:text-accent-gold transition-colors cursor-pointer">@studio_darkroom</span>
          <span className="hover:text-accent-gold transition-colors cursor-pointer">studiodarkroom.com</span>
        </div>
      </div>
    </div>
  );
};

export default InvoiceTemplate;
