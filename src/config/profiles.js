

const DEFAULT_PROFILES = [];

export const getProfiles = () => {
  const saved = localStorage.getItem('business_profiles');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse profiles', e);
    }
  }
  
  // If the key is null (meaning it hasn't been set yet), return defaults.
  // If the key is '[]' (explicitly cleared), return empty array.
  return saved === null ? DEFAULT_PROFILES : [];
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
