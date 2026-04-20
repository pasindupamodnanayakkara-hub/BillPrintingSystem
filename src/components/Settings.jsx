import React, { useState } from 'react';
import { getProfiles, addProfile, updateProfile, deleteProfile } from '../config/profiles';
import { getInventory, addItem, updateItem, deleteItem } from '../services/inventoryService';
import { Settings as SettingsIcon, Trash2, Plus, Save, Building2, Mail, Phone, MapPin, Image as ImageIcon, Briefcase } from 'lucide-react';
import { useToast } from './ui/ToastProvider';
import { useConfirm } from './ui/ConfirmProvider';

const Settings = () => {
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const [profiles, setProfiles] = useState(() => getProfiles());
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    logo: ''
  });
  
  const [appSettings, setAppSettings] = useState(() => {
    const savedSettings = JSON.parse(localStorage.getItem('BILL_STUDIO_SETTINGS') || '{}');
    const savedCounter = localStorage.getItem('BILL_COUNTER') || '1000';
    return {
      invoicePrefix: savedSettings.invoicePrefix || 'INV-',
      invoiceCounter: savedCounter
    };
  });

  const [isDragging, setIsDragging] = useState(false);
  const [inventory, setInventory] = useState(() => getInventory());
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({ name: '', price: '' });

  const handleEdit = (profile) => {
    setEditingId(profile.id);
    setFormData(profile);
  };

  const handleSave = () => {
    if (editingId === 'system') {
      localStorage.setItem('BILL_STUDIO_SETTINGS', JSON.stringify({
        invoicePrefix: appSettings.invoicePrefix
      }));
      localStorage.setItem('BILL_COUNTER', appSettings.invoiceCounter);
      setEditingId(null);
      toast('System settings saved!', 'success');
      return;
    }

    let updated;
    if (editingId === 'new') {
      updated = addProfile(formData);
    } else if (editingId) {
      updated = updateProfile(editingId, formData);
    }

    if (updated) {
      setProfiles(updated);
      setEditingId(null);
      setFormData({ name: '', email: '', phone: '', address: '', logo: '' });
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await confirm({
      title: 'Delete Profile',
      message: 'Are you sure you want to delete this profile? This action cannot be undone.'
    });
    if (confirmed) {
      const updated = deleteProfile(id);
      setProfiles(updated);
      toast('Profile deleted successfully', 'success');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: '', email: '', phone: '', address: '', logo: '' });
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="w-full p-8 px-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight italic">BUSINESS SETTINGS</h2>
          <p className="text-gray-500 font-medium">Manage your studio identities and billing details</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setEditingId('system')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black transition-all shadow-xl active:scale-95 ${editingId === 'system' ? 'bg-black text-white ring-4 ring-black/10' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-black'}`}
          >
            <SettingsIcon size={18} />
            System Settings
          </button>
          {!editingId && (
            <button 
              onClick={() => setEditingId('new')}
              className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-2xl font-bold hover:bg-gray-900 transition-all shadow-lg active:scale-95"
            >
              <Plus size={18} />
              Add New Business
            </button>
          )}
        </div>
      </div>

      {/* Business Profile Editor */}
      {(editingId === 'new' || (editingId && editingId !== 'system')) && (
        <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-2xl mb-12 animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-xl font-black text-gray-800 mb-6 uppercase tracking-widest italic">
            {editingId === 'new' ? 'New Business Profile' : 'Edit Business Profile'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="relative">
                <label className="text-[10px] absolute -top-2 left-3 bg-white px-1 font-bold text-gray-400 z-10 uppercase tracking-wider">Business Name</label>
                <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3 focus-within:border-accent-gold transition-colors">
                  <Building2 size={16} className="text-gray-400" />
                  <input 
                    type="text" 
                    className="w-full text-sm outline-none font-medium"
                    placeholder="e.g. Studio Dark Room"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>

              <div className="relative">
                <label className="text-[10px] absolute -top-2 left-3 bg-white px-1 font-bold text-gray-400 z-10 uppercase tracking-wider">Email Address</label>
                <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3 focus-within:border-accent-gold transition-colors">
                  <Mail size={16} className="text-gray-400" />
                  <input 
                    type="email" 
                    className="w-full text-sm outline-none font-medium"
                    placeholder="contact@studio.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="relative">
                <label className="text-[10px] absolute -top-2 left-3 bg-white px-1 font-bold text-gray-400 z-10 uppercase tracking-wider">Phone Number</label>
                <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3 focus-within:border-accent-gold transition-colors">
                  <Phone size={16} className="text-gray-400" />
                  <input 
                    type="text" 
                    className="w-full text-sm outline-none font-medium"
                    placeholder="+94 7X XXX XXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <label className="text-[10px] absolute -top-2 left-3 bg-white px-1 font-bold text-gray-400 z-10 uppercase tracking-wider">Office Address</label>
                <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3 focus-within:border-accent-gold transition-colors h-[116px] items-start">
                  <MapPin size={16} className="text-gray-400 mt-1" />
                  <textarea 
                    className="w-full text-sm outline-none font-medium h-full resize-none"
                    placeholder="Street, City, Country"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>
              </div>

              <div className="relative">
                <label className="text-[10px] absolute -top-2 left-3 bg-white px-1 font-bold text-gray-400 z-10 uppercase tracking-wider">Business Logo</label>
                <div 
                  className={`border-2 border-dashed rounded-2xl p-4 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer
                    ${isDragging ? 'border-accent-gold bg-yellow-50' : 'border-gray-200 hover:border-accent-gold bg-gray-50'}
                    ${formData.logo ? 'h-32' : 'h-32'}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('logoInput').click()}
                >
                  <input 
                    id="logoInput"
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleLogoUpload}
                  />
                  {formData.logo ? (
                    <div className="relative group w-full h-full flex items-center justify-center">
                      <img src={formData.logo} alt="Logo Preview" className="max-h-full object-contain" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                        <p className="text-[10px] text-white font-bold uppercase tracking-wider">Change Image</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-400">
                        <ImageIcon size={20} />
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                        <span className="text-gray-600">Click to upload</span> or drag and drop<br/>
                        PNG, JPG up to 2MB
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-4 justify-end">
            <button 
              onClick={resetForm}
              className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 bg-black text-white px-8 py-3 rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg active:scale-95"
            >
              <Save size={18} />
              Save Changes
            </button>
          </div>
        </div>
      )}

      {editingId === 'system' && (
        <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-2xl mb-12 animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-xl font-black text-gray-800 mb-6 uppercase tracking-widest italic">System Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative">
              <label className="text-[10px] absolute -top-2 left-3 bg-white px-1 font-bold text-gray-400 z-10 uppercase tracking-wider">Invoice Prefix</label>
              <input 
                type="text" 
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-black focus:border-accent-gold outline-none"
                value={appSettings.invoicePrefix}
                onChange={(e) => setAppSettings({...appSettings, invoicePrefix: e.target.value.toUpperCase()})}
              />
            </div>
            <div className="relative">
              <label className="text-[10px] absolute -top-2 left-3 bg-white px-1 font-bold text-gray-400 z-10 uppercase tracking-wider">Next Invoice #</label>
              <input 
                type="number" 
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-black focus:border-accent-gold outline-none"
                value={appSettings.invoiceCounter}
                onChange={(e) => setAppSettings({...appSettings, invoiceCounter: e.target.value})}
              />
            </div>
          </div>
          <div className="mt-8 flex gap-4 justify-end">
            <button onClick={resetForm} className="px-6 py-3 text-sm font-bold text-gray-500">Cancel</button>
            <button onClick={handleSave} className="bg-black text-white px-8 py-3 rounded-2xl font-bold shadow-lg">Save Settings</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {profiles.map(profile => (
          <div key={profile.id} className="group bg-white border border-gray-200 rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
            <div className="flex gap-6 items-start">
              <div className="w-20 h-20 flex items-center justify-center shrink-0">
                {profile.logo ? (
                  <img src={profile.logo} alt={profile.name} className="max-h-full max-w-full object-contain" />
                ) : (
                  <div className="w-full h-full bg-black rounded-2xl flex items-center justify-center text-white font-black text-2xl tracking-tighter italic">DR</div>
                )}
              </div>
              <div className="min-w-0">
                <h4 className="text-lg font-black text-gray-800 tracking-tight italic mb-1 truncate">{profile.name}</h4>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                    <Mail size={12} /> {profile.email}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                    <Phone size={12} /> {profile.phone}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => handleEdit(profile)}
                className="flex-1 bg-gray-50 text-gray-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors"
              >
                Edit Details
              </button>
              <button 
                onClick={() => handleDelete(profile.id)}
                className="bg-red-50 text-red-400 p-2 rounded-xl hover:bg-red-100 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-white border border-gray-200 rounded-3xl p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-gray-800 uppercase tracking-widest italic">Item Library (Default Pricing)</h3>
          <button 
            onClick={() => setEditingItem('new')}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-800"
          >
            <Plus size={14} /> Add Predefined Item
          </button>
        </div>

        {editingItem && (
          <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6">
            <input 
              type="text" 
              placeholder="Item name (e.g. Wedding Shoot)"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none bg-white"
              value={itemForm.name}
              onChange={(e) => setItemForm({...itemForm, name: e.target.value})}
            />
            <input 
              type="number" 
              placeholder="Price"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none bg-white"
              value={itemForm.price}
              onChange={(e) => setItemForm({...itemForm, price: e.target.value})}
            />
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  if (editingItem === 'new') {
                    setInventory(addItem(itemForm));
                  } else {
                    setInventory(updateItem(editingItem, itemForm));
                  }
                  setEditingItem(null);
                  setItemForm({ name: '', price: '' });
                }}
                className="flex-1 bg-black text-white rounded-xl font-bold py-3 text-sm"
              >
                Save Item
              </button>
              <button onClick={() => setEditingItem(null)} className="text-gray-400 font-bold px-4">Cancel</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {inventory.map(item => (
            <div key={item.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex justify-between items-center group">
              <div>
                <p className="text-sm font-black text-gray-800 italic">{item.name}</p>
                <p className="text-[10px] text-accent-gold font-black tracking-widest uppercase">Rs. {item.price}</p>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditingItem(item.id); setItemForm({ name: item.name, price: item.price }); }} className="text-gray-400 hover:text-black">
                  <Briefcase size={14} />
                </button>
                <button onClick={() => setInventory(deleteItem(item.id))} className="text-red-400 hover:text-red-600">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
};

export default Settings;
