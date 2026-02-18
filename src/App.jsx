import { useState, useEffect } from "react";
import Main from "./components/configurator/Main";
import ThankYou from "./components/ThankYou";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const wpConfig = window.__CONFIGURATOR_PLUGIN__ || {};
  const thankYouPaths = [
    wpConfig.thankYouPathPl || "/dziekujemy",
    wpConfig.thankYouPathCs || "/dekujeme",
    wpConfig.thankYouPath || "/thank-you",
  ];
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    const handlePathChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('popstate', handlePathChange);
    
    // Listen for manual URL changes
    const originalPushState = window.history.pushState;
    window.history.pushState = function(...args) {
      originalPushState.apply(window.history, args);
      setCurrentPath(window.location.pathname);
    };

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('popstate', handlePathChange);
      window.history.pushState = originalPushState;
    };
  }, []);

  const renderPage = () => {
    if (thankYouPaths.includes(currentPath)) {
      return <ThankYou />;
    }
    return <Main />;
  };

  return (
    <>
      <ToastContainer      
        position="bottom-right"
        autoClose={2000}
        theme="dark"     
      />
      {renderPage()}
    </>
  );
}

export default App;
