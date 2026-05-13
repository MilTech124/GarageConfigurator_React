import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import TagManager from 'react-gtm-module'

const tagManagerArgs = {
  gtmId: 'GTM-KB8G8PVR'
}

let appMounted = false;

function mountApp() {
  if (appMounted) {
    return;
  }

  const mountNode =
    document.getElementById("configurator-plugin-root") ||
    document.getElementById("root");

  if (!mountNode) {
    return;
  }

  appMounted = true;
  TagManager.initialize(tagManagerArgs);

  ReactDOM.createRoot(mountNode).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountApp, { once: true });
} else {
  mountApp();
}
