import { useState } from "react";
import Main from "./components/configurator/Main";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
    <ToastContainer      
      position="bottom-right"
      autoClose={2000}
      theme="dark"     
     />
      <Main />
    </>
  );
}

export default App;
