import { useState, useEffect } from "react";
import Main from "./components/configurator/Main";
import ThankYou from "./components/ThankYou";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
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
    if (currentPath === '/thank-you') {
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
