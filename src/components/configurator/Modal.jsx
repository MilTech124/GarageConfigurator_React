import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import SendEmail from "../../utils/SendMail";
import { toast } from "react-toastify";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 450,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};



export default function BasicModal({ selectedOptions, modal, setModal,setCapture, capture,imageURL }) {
  const handleOpen = () => setModal(true);
  const handleClose = () => setModal(false);
  const [contact, setContact] = React.useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    message: "",
  });

  React.useEffect(() => {
    if (imageURL) {
      console.log("imageurl" ,imageURL);
      toast.success("Zrobiono zrzut ekranu");
  
      let doorList = selectedOptions.door.map((door, index) => `Door ${index + 1}: ${JSON.stringify(door)}`).join('\n');   
      let windowList = selectedOptions.window.map((window, index) => `Window ${index + 1}: ${JSON.stringify(window)}`).join('\n');
      SendEmail(
        {
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          address: contact.address,
          message: contact.message,
          windowList: selectedOptions.window.length,
          doorList: selectedOptions.door.length,
          door: doorList,
          window: windowList,
          data: selectedOptions,
          imageURL: imageURL,
        },
        "template_426bxgo"
      );
    }
  }, [imageURL]);
  

  function handleChange(e) {
    setContact({ ...contact, [e.target.name]: e.target.value });
  }

 const sendData = async (e) =>{
    e.preventDefault();

    if(contact.name === "" || contact.email === "" || contact.phone === "" || contact.address === ""){
      toast.error("Wypełnij wszystkie pola");
      return;
    }

    console.log("sendData");
    await setCapture(true);
  
  
    
    console.log("imageurl" ,imageURL);    
    
  }

  return (
    <div>
      <Modal
        open={modal}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}  >
          <h4 className="text-black">Formularz kontaktowy</h4>
          <form className="flex flex-col gap-2" onSubmit={sendData}>
            <input
              type="text"
              name="name"
              placeholder="Imię i nazwisko"
              onChange={handleChange}
              className="p-2 border border-gray-400 rounded-md"
            />

            <input
              type="tel"
              name="phone"
              placeholder="Telefon"
              onChange={handleChange}
              className="p-2 border border-gray-400 rounded-md"
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              onChange={handleChange}
              className="p-2 border border-gray-400 rounded-md"
            />
            <input
              type="text"
              name="address"
              onChange={handleChange}
              placeholder="Adres dostawy"
              className="p-2 border border-gray-400 rounded-md"
            />
            <textarea
              name="message"
              placeholder="Informacje dodatkowe"
              onChange={handleChange}
              className="p-2 border text-black border-gray-400 rounded-md"
            />
            <p className="text-black text-xs">
              Przesyłając ten formularz, wyrażam zgodę na przetwarzanie moich
              danych osobowych w celu udzielenia odpowiedzi na moje zapytanie
              oraz na otrzymywanie informacji handlowych i marketingowych drogą
              elektroniczną od AcelGarage. Więcej informacji na temat
              przetwarzania danych osobowych można znaleźć w Polityce
              Prywatności.
            </p>
            <button className="bg-slate-900 text-white p-2 rounded-md">
              Wyślij
            </button>
          </form>
        </Box>
      </Modal>
    </div>
  );
}
