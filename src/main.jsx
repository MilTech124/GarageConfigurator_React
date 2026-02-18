import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import TagManager from 'react-gtm-module'

// Inicjalizacja Google Tag Manager
const tagManagerArgs = {
  gtmId: 'GTM-KB8G8PVR'
}

TagManager.initialize(tagManagerArgs)

const mountNode =
  document.getElementById("configurator-plugin-root") ||
  document.getElementById("root");

ReactDOM.createRoot(mountNode).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
