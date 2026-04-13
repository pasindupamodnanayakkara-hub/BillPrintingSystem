import logo from '../assets/logo.png';
import drEventLogo from '../assets/dr_event_logo.png';

const DEFAULT_PROFILES = [
  {
    id: 'studio-dark-room',
    name: 'Studio Dark Room',
    email: 'studiodarkroom@gmail.com',
    phone: '075 0938 466',
    address: 'Matara, Sri Lanka',
    logo: logo,
    isDefault: true
  },
  {
    id: 'dr-event',
    name: 'DR EVENT',
    email: 'drevent@gmail.com',
    phone: '075 0938 466',
    address: 'Matara, Sri Lanka',
    logo: drEventLogo,
    isDefault: false
  }
];

export const getProfiles = () => {
  const saved = localStorage.getItem('business_profiles');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse profiles', e);
    }
  }
  return DEFAULT_PROFILES;
};

export const saveProfiles = (profiles) => {
  localStorage.setItem('business_profiles', JSON.stringify(profiles));
};

export const addProfile = (profile) => {
  const profiles = getProfiles();
  const newProfile = { ...profile, id: Date.now().toString() };
  const updated = [...profiles, newProfile];
  saveProfiles(updated);
  return updated;
};

export const updateProfile = (id, updatedData) => {
  const profiles = getProfiles();
  const updated = profiles.map(p => p.id === id ? { ...p, ...updatedData } : p);
  saveProfiles(updated);
  return updated;
};

export const deleteProfile = (id) => {
  const profiles = getProfiles();
  const updated = profiles.filter(p => p.id !== id);
  saveProfiles(updated);
  return updated;
};
