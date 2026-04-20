import React, { useState } from 'react';
import { CheckCircle2, CloudDownload, Building2, ChevronRight, ChevronLeft, ShieldCheck, Rocket } from 'lucide-react';
import { downloadEncryptedBackup } from '../services/googleDriveService';
import { decryptBackup } from '../services/encryptionService';
import { GOOGLE_CLIENT_ID } from '../config/constants';
import { restoreFullBundle } from '../services/billService';
import { getProfiles } from '../config/profiles';
import { addProfile } from '../config/profiles';
import { useToast } from './ui/ToastProvider';

const ipcRenderer = window?.require ? window.require('electron').ipcRenderer : null;

const SetupWizard = ({ onComplete }) => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isRestoring, setIsRestoring] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    logo: ''
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const accessToken = await ipcRenderer.invoke('google-oauth', { clientId: GOOGLE_CLIENT_ID, silent: false });
      
      // 1. Download encrypted file
      const encryptedData = await downloadEncryptedBackup(accessToken);
      
      if (encryptedData) {
        // 2. Decrypt
        const cloudBills = await decryptBackup(encryptedData);
        
        // 3. Restore
        restoreFullBundle(cloudBills);
        localStorage.setItem('BILL_STUDIO_SETUP_COMPLETE', 'true');
        onComplete();
      } else {
        toast('No secure backup found on your Google Drive. Please start a fresh setup.', 'warning');
        nextStep();
      }
    } catch (error) {
      console.error('Restore failed', error);
      if (error.message === 'CORRUPT_OR_WRONG_KEY') {
        toast('Failed to decrypt. This backup might be from a different system.', 'error');
      } else {
        toast('Failed to connect to Google Drive.', 'error');
      }
    } finally {
      setIsRestoring(false);
    }
  };

  const handleFinish = () => {
    if (!profileData.name) return toast('Please enter your business name.', 'error');
    addProfile(profileData);
    localStorage.setItem('BILL_STUDIO_SETUP_COMPLETE', 'true');
    onComplete();
  };

  const renderStep = () => {
    switch(step) {
      case 1: // Welcome
        return (
          <div className="text-center animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-black rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-2xl rotate-3 transform hover:rotate-0 transition-all">
              <Rocket size={48} className="text-yellow-400" />
            </div>
            <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight italic">WELCOME TO BILL STUDIO</h1>
            <p className="text-gray-500 max-w-md mx-auto mb-10 font-medium leading-relaxed">
              Your professional journey starts here. Let's get your studio set up for high-performance billing in just a few steps.
            </p>
            <button 
              onClick={nextStep}
              className="group flex items-center gap-3 bg-black text-white px-10 py-4 rounded-2xl font-black hover:bg-gray-800 transition-all shadow-xl active:scale-95"
            >
              Get Started
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        );

      case 2: // EULA
        return (
          <div className="animate-in slide-in-from-right-8 duration-500">
            <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3 italic">
              <ShieldCheck className="text-accent-gold" />
              USER AGREEMENT
            </h2>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 h-64 overflow-y-auto mb-6 text-sm text-gray-600 leading-relaxed font-medium">
              <p className="font-bold mb-4">END USER LICENSE AGREEMENT (EULA)</p>
              <p className="mb-4">By using Bill Studio, you agree to the following terms:</p>
              <p className="mb-4">1. DATA PRIVACY: Your billing data is stored locally and optionally synced to YOUR Google Drive. We do not have access to your invoices.</p>
              <p className="mb-4">2. AUTOMATED UPDATES: The software will automatically check for and install updates to ensure you have the latest features and security fixes.</p>
              <p className="mb-4">3. USAGE: This software is designed for professional studio billing. Misuse for fraudulent purposes is strictly prohibited.</p>
              <p>4. LIABILITY: The developers are not responsible for any financial discrepancies caused by user error or data loss.</p>
            </div>
            <label className="flex items-center gap-3 cursor-pointer group mb-10">
              <input 
                type="checkbox" 
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 focus:ring-black text-black"
              />
              <span className="text-sm font-bold text-gray-700 group-hover:text-black transition-colors">I accept the terms and conditions</span>
            </label>
            <div className="flex justify-between">
              <button onClick={prevStep} className="text-gray-400 font-bold hover:text-gray-600">Back</button>
              <button 
                disabled={!agreed}
                onClick={nextStep}
                className="bg-black text-white px-8 py-3 rounded-2xl font-black disabled:opacity-30 shadow-lg"
              >
                Continue
              </button>
            </div>
          </div>
        );

      case 3: // Restoration
        return (
          <div className="animate-in slide-in-from-right-8 duration-500">
            <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3 italic">
              <CloudDownload className="text-accent-gold" />
              RECOVER DATA
            </h2>
            <p className="text-gray-500 mb-10 font-medium">
              Have you used Bill Studio before? We can automatically restore your business profiles and bill history from Google Drive.
            </p>
            <div className="space-y-4 mb-10">
              <button 
                onClick={handleRestore}
                disabled={isRestoring}
                className="w-full flex items-center justify-between bg-white border-2 border-gray-100 p-6 rounded-3xl hover:border-accent-gold hover:shadow-xl transition-all group"
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="w-12 h-12 bg-yellow-50 rounded-2xl flex items-center justify-center text-accent-gold group-hover:scale-110 transition-transform">
                    <CloudDownload size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-gray-800 italic">Restore from Google Drive</h4>
                    <p className="text-xs text-gray-400 font-bold">Sync your existing cloud database</p>
                  </div>
                </div>
                {isRestoring ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-accent-gold border-t-transparent"></div>
                ) : (
                  <ChevronRight size={20} className="text-gray-300 group-hover:text-accent-gold" />
                )}
              </button>

              <button 
                onClick={nextStep}
                className="w-full flex items-center justify-between bg-white border-2 border-gray-100 p-6 rounded-3xl hover:border-black hover:shadow-xl transition-all group"
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:scale-110 transition-transform">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-gray-800 italic">Start Fresh Setup</h4>
                    <p className="text-xs text-gray-400 font-bold">Configure as a new user</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-300 group-hover:text-black" />
              </button>
            </div>
            <div className="flex justify-between items-center">
              <button onClick={prevStep} className="text-gray-400 font-bold hover:text-gray-600">Back</button>
              <button onClick={nextStep} className="text-sm font-bold text-gray-400 hover:text-black transition-colors underline underline-offset-4">Skip this step</button>
            </div>
          </div>
        );

      case 4: // First Profile
        return (
          <div className="animate-in slide-in-from-right-8 duration-500">
            <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3 italic">
              <Building2 className="text-accent-gold" />
              YOUR BUSINESS
            </h2>
            <p className="text-gray-500 mb-8 font-medium italic">Enter your primary studio details to get started.</p>
            <div className="space-y-4 mb-8">
              <input 
                type="text" 
                placeholder="Business Name (e.g. Studio Dark Room)"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 font-bold focus:border-accent-gold outline-none"
                value={profileData.name}
                onChange={(e) => setProfileData({...profileData, name: e.target.value})}
              />
              <input 
                type="email" 
                placeholder="Email Address"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 font-medium focus:border-accent-gold outline-none"
                value={profileData.email}
                onChange={(e) => setProfileData({...profileData, email: e.target.value})}
              />
              <textarea 
                placeholder="Business Address"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 font-medium focus:border-accent-gold outline-none h-24 resize-none"
                value={profileData.address}
                onChange={(e) => setProfileData({...profileData, address: e.target.value})}
              />
            </div>
            <div className="flex justify-between">
              <button onClick={prevStep} className="text-gray-400 font-bold hover:text-gray-600">Back</button>
              <button 
                onClick={handleFinish}
                className="bg-black text-white px-10 py-4 rounded-2xl font-black shadow-xl hover:bg-gray-800 active:scale-95"
              >
                Finish Setup
              </button>
            </div>
          </div>
        );
      
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-100 flex items-center justify-center p-6 z-[100] overflow-hidden">
      <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.15)] overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 rounded-full -ml-32 -mb-32 blur-3xl"></div>
        
        <div className="p-12 relative z-10">
          {/* Progress Indicator */}
          {step > 1 && (
            <div className="flex gap-2 mb-12 justify-center">
              {[2, 3, 4].map(idx => (
                <div 
                  key={idx} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${step === idx ? 'w-12 bg-black' : step > idx ? 'w-4 bg-black/20' : 'w-4 bg-gray-100'}`}
                />
              ))}
            </div>
          )}

          {renderStep()}
        </div>
      </div>
    </div>
  );
};

export default SetupWizard;
