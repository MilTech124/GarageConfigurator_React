import Accordion from '@mui/material/Accordion';
import AccordionActions from '@mui/material/AccordionActions';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Button from '@mui/material/Button';
import MainGarage from "../Settings/MainSetting";
import RoofSetting from '../Settings/RoofSetting';
import TypeGarage from '../Settings/TypeGarage';
import GateSetting2 from '../Settings/GateSetting2';
import DoorSettings from '../Settings/DoorSettings';
import WindowSettings from '../Settings/WindowSettings';
import CarportSetting from '../Settings/CarportSetting';
import Accessories from '../Settings/Accessories';

export default function LeftSettings({ selectedOptions, setSelectedOptions, t, o, lang }) {
  return (
    <div className='md:w-[430px] md:max-w-[44vw] shrink-0 h-full min-h-0 overflow-y-auto max-sm:order-2'>
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1-content" id="panel1-header">
          <h3>{t("sectionDimensions")}</h3>
        </AccordionSummary>
        <AccordionDetails>
          <MainGarage selectedOptions={selectedOptions} setSelectedOptions={setSelectedOptions} t={t} o={o} lang={lang} />
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel2-content" id="panel2-header">
          <h3>{t("sectionRoofSlope")}</h3>
        </AccordionSummary>
        <AccordionDetails>
          <TypeGarage selectedOptions={selectedOptions} setSelectedOptions={setSelectedOptions} o={o} />
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel3-content" id="panel3-header">
          <h3>{t("sectionRoofType")}</h3>
        </AccordionSummary>
        <AccordionDetails>
          <RoofSetting selectedOptions={selectedOptions} setSelectedOptions={setSelectedOptions} o={o} />
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel4-content" id="panel4-header">
          <h3>{t("sectionGates")}</h3>
        </AccordionSummary>
        <AccordionDetails>
          <GateSetting2 selectedOptions={selectedOptions} setSelectedOptions={setSelectedOptions} t={t} o={o} />
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel5-content" id="panel5-header">
          <h3>{t("sectionDoors")}</h3>
        </AccordionSummary>
        <AccordionDetails>
          <DoorSettings selectedOptions={selectedOptions} setSelectedOptions={setSelectedOptions} t={t} o={o} />
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel6-content" id="panel6-header">
          <h3>{t("sectionWindows")}</h3>
        </AccordionSummary>
        <AccordionDetails>
          <WindowSettings selectedOptions={selectedOptions} setSelectedOptions={setSelectedOptions} t={t} o={o} />
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel7-content" id="panel7-header">
          <h3>{t("sectionCarports")}</h3>
        </AccordionSummary>
        <AccordionDetails>
          <CarportSetting selectedOptions={selectedOptions} setSelectedOptions={setSelectedOptions} t={t} o={o} />
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel8-content" id="panel8-header">
          <h3>{t("sectionAccessories")}</h3>
        </AccordionSummary>
        <AccordionDetails>
          <Accessories selectedOptions={selectedOptions} setSelectedOptions={setSelectedOptions} t={t} />
        </AccordionDetails>
      </Accordion>
      {/* <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel9-content" id="panel9-header">
          <h3>Dodatkowe uslugi</h3>
        </AccordionSummary>
        <AccordionDetails>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse malesuada lacus ex, sit amet blandit leo lobortis eget.
        </AccordionDetails>
        <AccordionActions>
          <Button>Cancel</Button>
          <Button>Agree</Button>
        </AccordionActions>
      </Accordion> */}
    </div>
  );
}
