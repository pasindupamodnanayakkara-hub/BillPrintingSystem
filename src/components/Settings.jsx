import React, { useState, useEffect } from 'react';
import { getProfiles, addProfile, updateProfile, deleteProfile } from '../config/profiles';
import { Trash2, Plus, Save, Building2, Mail, Phone, MapPin, Image as ImageIcon } from 'lucide-react';

const Settings = () => {
  const [profiles, setProfiles] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    logo: ''
  });

  useEffect(() => {
    const loadedProfiles = getProfiles();
    setProfiles(loadedProfiles);
  }, []);

  const handleEdit = (profile) => {
    setEditingId(profile.id);
    setFormData(profile);
  };

  const handleSave = () => {
    let updated;
    if (editingId) {
      updated = updateProfile(editingId, formData);
    } else {
      updated = addProfile(formData);
    }
    setProfiles(updated);
    setEditingId(null);
    setFormData({ name: '', email: '', phone: '', address: '', logo: '' });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this profile?')) {
      const updated = deleteProfile(id);
      setProfiles(updated);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: '', email: '', phone: '', address: '', logo: '' });
  };

  return (
    <div className="max-w-4xl mx-auto p-8 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight italic">BUSINESS SETTINGS</h2>
          <p className="text-gray-500 font-medium">Manage your studio identities and billing details</p>
        </div>
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

      {(editingId === 'new' || editingId) && (
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
                <label className="text-[10px] absolute -top-2 left-3 bg-white px-1 font-bold text-gray-400 z-10 uppercase tracking-wider">Logo URL / Path</label>
                <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3 focus-within:border-accent-gold transition-colors">
                  <ImageIcon size={16} className="text-gray-400" />
                  <input 
                    type="text" 
                    className="w-full text-sm outline-none font-medium"
                    placeholder="/src/assets/logo.png"
                    value={formData.logo}
                    onChange={(e) => setFormData({...formData, logo: e.target.value})}
                  />
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
              className="flex items-center gap-2 bg-accent-gold text-white px-8 py-3 rounded-2xl font-bold hover:brightness-110 transition-all shadow-lg active:scale-95"
            >
              <Save size={18} />
              Save Settings
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {profiles.map(profile => (
          <div key={profile.id} className="group bg-white border border-gray-200 rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
            <div className="flex gap-6 items-start">
              <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                {profile.logo ? (
                  <img src={profile.logo} alt={profile.name} className="max-h-full object-contain p-2" />
                ) : (
                  <div className="text-white font-black text-2xl tracking-tighter italic">DR</div>
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
    </div>
  );
};

export default Settings;
