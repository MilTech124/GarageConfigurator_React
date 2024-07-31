import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import SendEmail from "../../utils/SendMail";
import { toast } from "react-toastify";
import Checkbox from '@mui/material/Checkbox';
import { variable } from "./Variable";
import { FormControl, Select } from "@mui/material";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from "@mui/material/InputLabel";

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



export default function BasicModal({ selectedOptions, setSelectedOptions, modal,price, setModal,setCapture, capture,imageURL }) {
  const handleOpen = () => setModal(true);
  const handleClose = () => setModal(false);
  const selectedWojewodztwo = selectedOptions.wojewodztwo;
  const [contact, setContact] = React.useState({
    name: "",
    email: "",
    phone: "", 
    address: "",
    message: "",

    zgoda: false, 
    marketing: true,    
  });

  React.useEffect(() => {
    if (imageURL) {
      console.log("imageurl" ,imageURL);
      toast.success("Zrobiono zrzut ekranu");
  
      let doorList = selectedOptions.door.map((door, index) => `Door ${index + 1}: ${JSON.stringify(door)}`).join('\n');   
      let windowList = selectedOptions.window.map((window, index) => `Window ${index + 1}: ${JSON.stringify(window)}`).join('\n');
      let carportSides = `Lewo: ${selectedOptions.carportSides.lewo ? "Tak" : "Nie"}\nPrawo: ${selectedOptions.carportSides.prawo ? "Tak" : "Nie"}\nPrzód: ${selectedOptions.carportSides.przod ? "Tak" : "Nie"}\nTył: ${selectedOptions.carportSides.tyl ? "Tak" : "Nie"}`;
      SendEmail(
        {
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          wojewodztwo: selectedOptions.wojewodztwo,
          address: contact.address,
          message: contact.message,
          windowList: selectedOptions.window.length,
          doorList: selectedOptions.door.length,
          door: doorList,
          window: windowList,
          data: selectedOptions,
          imageURL: imageURL,
          price: price,
          carportSides: carportSides,
        },
        "template_xkwkwj5"
      );
    }
  }, [imageURL]);
  

  function handleChange(e) {
    setContact({ ...contact, [e.target.name]: e.target.value });
  }

  function setWoj(e){
    setSelectedOptions({...selectedOptions, wojewodztwo: e.target.value});        
   
  }

 const sendData = async (e) =>{
    e.preventDefault();
    
    if(!contact.zgoda){
      toast.error("Zaznacz zgodę na kontakt");
      return;
    }

    if(contact.email !== contact.email2){
      toast.error("Adresy email nie są takie same");
      return;
    }
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
          <h4 className="text-black">Kontakt</h4>
          <form className="flex flex-col gap-2" onSubmit={sendData}>
            <input
              type="text"
              name="name"
              placeholder="Imię i nazwisko"
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
              type="email2"
              name="email2"
              placeholder="Potwierdz Email"
              onChange={handleChange}
              className="p-2 border border-gray-400 rounded-md"
              style={{borderColor: contact.email !== contact.email2 ? "red" : "green"}}
            
            />
            <FormControl fullWidth>
              <InputLabel id="demo-simple-select-label">Województwo</InputLabel>
              <Select value={selectedWojewodztwo} onChange={setWoj}  >
                {variable.wojewodztwa.map((wojewodztwo) => (
                  <MenuItem key={wojewodztwo} value={wojewodztwo}>{wojewodztwo}</MenuItem>
                ))}

              </Select>              
          </FormControl>

            <input
              type="text"
              name="address"
              onChange={handleChange}
              placeholder="Adres dostawy"
              className="p-2 border border-gray-400 rounded-md"
            />
            <div className="flex">
              <input
                type="tel"
                name="phone"
                placeholder="Telefon"
                onChange={handleChange}
                className="p-2 border border-gray-400 rounded-md"
              />             
            </div>
            <p className="font-light">Cena z transportem :<b className="text-blue-500 font-bold">{price} zł</b> </p>
            <div className="text-xs flex">            
            <Checkbox onChange={(e) => setContact({...contact, zgoda: e.target.checked})} />
              <p>Wyrażam zgodę na przetwarzanie moich danych osobowych, w tym numeru telefonu, przez NewGarage w celu kontaktu telefonicznego dotyczącego mojego zapytania.</p>
            </div>
            <div className="text-xs flex">
            <Checkbox onChange={(e) => setContact({...contact, marketing: e.target.checked})} />
              <p>Wyrażam zgodę na przetwarzanie moich danych osobowych, w tym adresu e-mail. W celu przesyłania mi informacji handlowych, ofert promocyjnych oraz innych treści marketingowych związanych z ofertą garaży blaszanych</p>
            </div>           
           
         
            <Button variant="contained" onClick={sendData}  className="bg-slate-900 text-white p-2 rounded-md">
              Wyślij
            </Button>
          </form>
        </Box>
      </Modal>
    </div>
  );
}
