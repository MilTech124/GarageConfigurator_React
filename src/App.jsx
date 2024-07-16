import { useState } from "react";
import Main from "./components/configurator/Main";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
    <ToastContainer />
      <Main />
    </>
  );
}

export default App;
