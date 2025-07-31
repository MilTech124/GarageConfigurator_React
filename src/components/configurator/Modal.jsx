import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import Checkbox from '@mui/material/Checkbox';
import { toast } from "react-toastify";
import { FormControl, Select, MenuItem, InputLabel } from "@mui/material";
import SendEmailWP from "../../utils/SendMailWP";
import { validateForm } from "../../utils/validation";
import { variable } from "./Variable";

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

export default function BasicModal({ selectedOptions, setSelectedOptions, modal, price, setModal, setCapture, imageURL }) {
  const handleClose = () => {
    setModal(false);
    setContact({
      name: "",
      email: "",
      email2: "",
      phone: "", 
      address: "",
      message: "",
      honeypot: "",
      zgoda: false, 
      marketing: true,    
    });
    setValidationErrors({});
    setFormStartTime(null);
  };

  const selectedWojewodztwo = selectedOptions.wojewodztwo;
  const [contact, setContact] = React.useState({
    name: "",
    email: "",
    email2: "",
    phone: "", 
    address: "",
    message: "",
    honeypot: "",
    zgoda: false, 
    marketing: true,    
  });

  const [validationErrors, setValidationErrors] = React.useState({});
  const [formStartTime, setFormStartTime] = React.useState(null);
  const [pendingEmailData, setPendingEmailData] = React.useState(null);

  React.useEffect(() => {
    if (modal && !formStartTime) {
      setFormStartTime(Date.now());
    }
  }, [modal]);

  React.useEffect(() => {
    if (imageURL && pendingEmailData) {
      const { contact, selectedOptions, price } = pendingEmailData;

      let doorList = selectedOptions.door.map((door, index) => `Door ${index + 1}: ${JSON.stringify(door)}`).join('\n');   
      let windowList = selectedOptions.window.map((window, index) => `Window ${index + 1}: ${JSON.stringify(window)}`).join('\n');
      let carportSides = `Lewo: ${selectedOptions.carportSides.lewo ? "Tak" : "Nie"}\nPrawo: ${selectedOptions.carportSides.prawo ? "Tak" : "Nie"}\nPrzód: ${selectedOptions.carportSides.przod ? "Tak" : "Nie"}\nTył: ${selectedOptions.carportSides.tyl ? "Tak" : "Nie"}`;
      let carportSides2 = `Lewo: ${selectedOptions.carportSides2.lewo ? "Tak" : "Nie"}\nPrawo: ${selectedOptions.carportSides2.prawo ? "Tak" : "Nie"}\nPrzód: ${selectedOptions.carportSides2.przod ? "Tak" : "Nie"}\nTył: ${selectedOptions.carportSides2.tyl ? "Tak" : "Nie"}`;

      SendEmailWP(
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
          carportSides2: carportSides2,
        },
        "configurator"
      );

      setPendingEmailData(null);
    }
  }, [imageURL]);

  function handleChange(e) {
    setContact({ ...contact, [e.target.name]: e.target.value });
  }

  function setWoj(e) {
    setSelectedOptions({...selectedOptions, wojewodztwo: e.target.value});        
  }

  const sendData = async (e) => {
    e.preventDefault();
    setValidationErrors({});

    if (!contact.zgoda) {
      toast.error("Zaznacz zgodę na kontakt");
      return;
    }

    if (contact.email !== contact.email2) {
      toast.error("Adresy email nie są takie same");
      return;
    }

    if (contact.name === "" || contact.email === "" || contact.phone === "" || contact.address === "") {
      toast.error("Wypełnij wszystkie pola");
      return;
    }

    const validation = validateForm(contact, formStartTime);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);

      if (validation.errors.general) {
        toast.error(validation.errors.general);
        return;
      }
      const firstError = Object.values(validation.errors)[0];
      if (firstError) {
        toast.error(firstError);
        return;
      }
    }

    console.log("sendData - validation passed");

    const contactSnapshot = { ...contact }; // snapshot danych
    const selectedOptionsSnapshot = { ...selectedOptions };

    setPendingEmailData({
      contact: contactSnapshot,
      selectedOptions: selectedOptionsSnapshot,
      price: price,
    });

    await setCapture(true); // robi screenshot

    handleClose();
  };

  return (
    <div>
      <Modal
        open={modal}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"   
      >
        <Box sx={style}>
          <h4 className="text-black">Kontakt</h4>
          <form className="flex flex-col gap-2" onSubmit={sendData}>
            <input
              type="text"
              name="honeypot"
              value={contact.honeypot}
              onChange={handleChange}
              style={{ display: 'none' }}
              tabIndex="-1"
              autoComplete="off"
            />
            <div>
              <input
                type="text"
                name="name"
                placeholder="Imię i nazwisko"
                value={contact.name}
                onChange={handleChange}
                className={`p-2 border rounded-md w-full ${validationErrors.name ? 'border-red-500' : 'border-gray-400'}`}
              />
              {validationErrors.name && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.name}</p>
              )}
            </div>
            <div>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={contact.email}
                onChange={handleChange}
                className={`p-2 border rounded-md w-full ${validationErrors.email ? 'border-red-500' : 'border-gray-400'}`}
              />
              {validationErrors.email && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>
              )}
            </div>
            <div>
              <input
                type="email"
                name="email2"
                placeholder="Potwierdź Email"
                value={contact.email2}
                onChange={handleChange}
                className="p-2 border rounded-md w-full"
                style={{borderColor: contact.email !== contact.email2 ? "red" : "green"}}
              />
            </div>
            <FormControl fullWidth>
              <InputLabel id="woj-label">Województwo</InputLabel>
              <Select labelId="woj-label" value={selectedWojewodztwo} onChange={setWoj}>
                {variable.wojewodztwa.map((wojewodztwo) => (
                  <MenuItem key={wojewodztwo} value={wojewodztwo}>{wojewodztwo}</MenuItem>
                ))}
              </Select>              
            </FormControl>
            <div>
              <input
                type="text"
                name="address"
                placeholder="Adres dostawy"
                value={contact.address}
                onChange={handleChange}
                className={`p-2 border rounded-md w-full ${validationErrors.address ? 'border-red-500' : 'border-gray-400'}`}
              />
              {validationErrors.address && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.address}</p>
              )}
            </div>
            <div>
              <input
                type="tel"
                name="phone"
                placeholder="Telefon"
                value={contact.phone}
                onChange={handleChange}
                className={`p-2 border rounded-md w-full ${validationErrors.phone ? 'border-red-500' : 'border-gray-400'}`}
              />
              {validationErrors.phone && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.phone}</p>
              )}
            </div>
            <p className="font-light">Cena z transportem: <b className="text-blue-500 font-bold">{price} zł</b></p>
            <div className="text-xs flex">
              <Checkbox onChange={(e) => setContact({...contact, zgoda: e.target.checked})} />
              <p>Wyrażam zgodę na przetwarzanie moich danych osobowych, w tym numeru telefonu, przez NewGarage w celu kontaktu telefonicznego dotyczącego mojego zapytania.</p>
            </div>
            <div className="text-xs flex">
              <Checkbox onChange={(e) => setContact({...contact, marketing: e.target.checked})} />
              <p>Wyrażam zgodę na przetwarzanie moich danych osobowych, w tym adresu e-mail, w celu przesyłania mi informacji handlowych, ofert promocyjnych oraz innych treści marketingowych związanych z ofertą garaży blaszanych.</p>
            </div>
            <Button type="submit" variant="contained" className="bg-slate-900 text-white p-2 rounded-md">
              Wyślij
            </Button>
          </form>
        </Box>
      </Modal>
    </div>
  );
}
