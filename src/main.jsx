import React from 'react'
import ReactDOM from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.jsx'
import './index.css'
import { ToastProvider } from './components/ui/ToastProvider.jsx'
import { ConfirmProvider } from './components/ui/ConfirmProvider.jsx'

const GOOGLE_CLIENT_ID = localStorage.getItem('GOOGLE_CLIENT_ID') || 'unconfigured';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ToastProvider>
        <ConfirmProvider>
          <App />
        </ConfirmProvider>
      </ToastProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
)
