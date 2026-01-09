import React from 'react'
import ReactDOM from 'react-dom/client'
import ReMindMe from './ReMindMe.jsx'
import './index.css'

// Mock storage API for demo (uses localStorage)
window.storage = {
  get: async (key) => {
    const value = localStorage.getItem(key);
    return { value };
  },
  set: async (key, value) => {
    localStorage.setItem(key, value);
  }
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ReMindMe />
  </React.StrictMode>,
)
