import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import Checkbox from "@mui/material/Checkbox";
import { toast } from "react-toastify";
import { FormControl, Select, MenuItem, InputLabel } from "@mui/material";
import SendEmailWP from "../../utils/SendMailWP";
import { validateForm } from "../../utils/validation";

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

export default function BasicModal({
  selectedOptions,
  setSelectedOptions,
  modal,
  price,
  setModal,
  setCapture,
  imageURL,
  setImageURL,
  t,
  lang,
}) {
  const tr = t || ((key) => key);
  const regionOptions =
    lang === "cs"
      ? [
          "Hlavni mesto Praha",
          "Stredocesky kraj",
          "Jihocesky kraj",
          "Plzensky kraj",
          "Karlovarsky kraj",
          "Ustecky kraj",
          "Liberecky kraj",
          "Kralovehradecky kraj",
          "Pardubicky kraj",
          "Vysocina",
          "Jihomoravsky kraj",
          "Olomoucky kraj",
          "Zlinsky kraj",
          "Moravskoslezsky kraj",
        ]
      : [
          "dolnoslaskie",
          "kujawsko-pomorskie",
          "lubelskie",
          "lubuskie",
          "lodzkie",
          "malopolskie",
          "mazowieckie",
          "opolskie",
          "podkarpackie",
          "podlaskie",
          "pomorskie",
          "slaskie",
          "swietokrzyskie",
          "warminsko-mazurskie",
          "wielkopolskie",
          "zachodniopomorskie",
        ];

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
    if (pendingEmailData && imageURL !== null) {
      const { contact: c, selectedOptions: so, price: pr } = pendingEmailData;

      const doorList = so.door
        .map((door, index) => `Door ${index + 1}: ${JSON.stringify(door)}`)
        .join("\n");
      const windowList = so.window
        .map((window, index) => `Window ${index + 1}: ${JSON.stringify(window)}`)
        .join("\n");

      const carportSides = `Lewo: ${so.carportSides.lewo ? "Tak" : "Nie"}\nPrawo: ${so.carportSides.prawo ? "Tak" : "Nie"}\nPrzod: ${so.carportSides.przod ? "Tak" : "Nie"}\nTyl: ${so.carportSides.tyl ? "Tak" : "Nie"}`;
      const carportSides2 = `Lewo: ${so.carportSides2.lewo ? "Tak" : "Nie"}\nPrawo: ${so.carportSides2.prawo ? "Tak" : "Nie"}\nPrzod: ${so.carportSides2.przod ? "Tak" : "Nie"}\nTyl: ${so.carportSides2.tyl ? "Tak" : "Nie"}`;

      SendEmailWP(
        {
          name: c.name,
          email: c.email,
          phone: c.phone,
          wojewodztwo: so.wojewodztwo,
          address: c.address,
          message: c.message,
          windowList: so.window.length,
          doorList: so.door.length,
          door: doorList,
          window: windowList,
          data: so,
          imageURL: imageURL || "",
          price: pr,
          carportSides,
          carportSides2,
        },
        "configurator",
        lang
      );

      setPendingEmailData(null);
    }
  }, [imageURL, pendingEmailData]);

  function handleChange(e) {
    setContact({ ...contact, [e.target.name]: e.target.value });
  }

  function setWoj(e) {
    setSelectedOptions({ ...selectedOptions, wojewodztwo: e.target.value });
  }

  const sendData = async (e) => {
    e.preventDefault();
    setValidationErrors({});

    if (!contact.zgoda) {
      toast.error(tr("formConsentRequired"));
      return;
    }

    if (contact.email !== contact.email2) {
      toast.error(tr("formEmailsMismatch"));
      return;
    }

    if (
      contact.name === "" ||
      contact.email === "" ||
      contact.phone === "" ||
      contact.address === ""
    ) {
      toast.error(tr("formFillAllFields"));
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

    const contactSnapshot = { ...contact };
    const selectedOptionsSnapshot = { ...selectedOptions };

    setPendingEmailData({
      contact: contactSnapshot,
      selectedOptions: selectedOptionsSnapshot,
      price,
    });

    setImageURL(null);
    await setCapture(true);

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
          <h4 className="text-black">{tr("formContact")}</h4>
          <form className="flex flex-col gap-2" onSubmit={sendData}>
            <input
              type="text"
              name="honeypot"
              value={contact.honeypot}
              onChange={handleChange}
              style={{ display: "none" }}
              tabIndex="-1"
              autoComplete="off"
            />
            <div>
              <input
                type="text"
                name="name"
                placeholder={tr("formName")}
                value={contact.name}
                onChange={handleChange}
                className={`p-2 border rounded-md w-full ${
                  validationErrors.name ? "border-red-500" : "border-gray-400"
                }`}
              />
              {validationErrors.name && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.name}</p>
              )}
            </div>
            <div>
              <input
                type="email"
                name="email"
                placeholder={tr("formEmail")}
                value={contact.email}
                onChange={handleChange}
                className={`p-2 border rounded-md w-full ${
                  validationErrors.email ? "border-red-500" : "border-gray-400"
                }`}
              />
              {validationErrors.email && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>
              )}
            </div>
            <div>
              <input
                type="email"
                name="email2"
                placeholder={tr("formConfirmEmail")}
                value={contact.email2}
                onChange={handleChange}
                className="p-2 border rounded-md w-full"
                style={{ borderColor: contact.email !== contact.email2 ? "red" : "green" }}
              />
            </div>
            <FormControl fullWidth>
              <InputLabel id="woj-label">{tr("formRegion")}</InputLabel>
              <Select labelId="woj-label" value={selectedWojewodztwo} onChange={setWoj}>
                {regionOptions.map((wojewodztwo) => (
                  <MenuItem key={wojewodztwo} value={wojewodztwo}>
                    {wojewodztwo}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <div>
              <input
                type="text"
                name="address"
                placeholder={tr("formAddress")}
                value={contact.address}
                onChange={handleChange}
                className={`p-2 border rounded-md w-full ${
                  validationErrors.address ? "border-red-500" : "border-gray-400"
                }`}
              />
              {validationErrors.address && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.address}</p>
              )}
            </div>
            <div>
              <input
                type="tel"
                name="phone"
                placeholder={tr("formPhone")}
                value={contact.phone}
                onChange={handleChange}
                className={`p-2 border rounded-md w-full ${
                  validationErrors.phone ? "border-red-500" : "border-gray-400"
                }`}
              />
              {validationErrors.phone && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.phone}</p>
              )}
            </div>
            <div className="text-xs flex">
              <Checkbox onChange={(e) => setContact({ ...contact, zgoda: e.target.checked })} />
              <p>{tr("formConsentText")}</p>
            </div>
            <div className="text-xs flex">
              <Checkbox
                defaultChecked
                onChange={(e) => setContact({ ...contact, marketing: e.target.checked })}
              />
              <p>{tr("formMarketingText")}</p>
            </div>
            <Button type="submit" variant="contained" className="bg-slate-900 text-white p-2 rounded-md">
              {tr("formSend")}
            </Button>
          </form>
        </Box>
      </Modal>
    </div>
  );
}
