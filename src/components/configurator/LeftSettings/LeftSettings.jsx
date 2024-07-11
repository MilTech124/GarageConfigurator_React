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

export default function LeftSettings({selectedOptions, setSelectedOptions}) {
  return (
    <div className='overflow-scroll'>
      <Accordion defaultExpanded  >
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1-content" id="panel1-header" >
          <h3>Rozmiary oraz kolorystyka</h3>       
        </AccordionSummary>
        <AccordionDetails>
          <MainGarage selectedOptions={selectedOptions} setSelectedOptions={setSelectedOptions} />
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel2-content" id="panel2-header" >
          <h3>Typy spadów</h3>
        </AccordionSummary>
        <AccordionDetails>
          <TypeGarage selectedOptions={selectedOptions} setSelectedOptions={setSelectedOptions} />
        </AccordionDetails>
      </Accordion>
      <Accordion >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}  aria-controls="panel3-content" id="panel3-header" >
          <h3>Rodzaj dachu oraz kolorystyka</h3>
        </AccordionSummary>
        <AccordionDetails>
         <RoofSetting selectedOptions={selectedOptions} setSelectedOptions={setSelectedOptions} />
        </AccordionDetails>    
      </Accordion>
      <Accordion >
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel4-content" id="panel4-header"
        >
          <h3>Bramy</h3>
        </AccordionSummary>
        <AccordionDetails>
          <GateSetting2 selectedOptions={selectedOptions} setSelectedOptions={setSelectedOptions} />
        </AccordionDetails>
       
      </Accordion>
      <Accordion >
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel5-content" id="panel5-header" >
          <h3>Drzwi</h3>
        </AccordionSummary>
        <AccordionDetails>
          <DoorSettings selectedOptions={selectedOptions} setSelectedOptions={setSelectedOptions} />
        </AccordionDetails>       
      </Accordion>
      <Accordion >
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel6-content" id="panel6-header"
        >
          <h3>Okna</h3>
        </AccordionSummary>
        <AccordionDetails>
          <WindowSettings selectedOptions={selectedOptions} setSelectedOptions={setSelectedOptions} />
        </AccordionDetails>
        <AccordionActions>
          <Button>Cancel</Button>
          <Button>Agree</Button>
        </AccordionActions>
      </Accordion>
      <Accordion >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel3-content"
          id="panel3-header"
        >
          <h3>Wiaty</h3>
        </AccordionSummary>
        <AccordionDetails>
          <CarportSetting selectedOptions={selectedOptions} setSelectedOptions={setSelectedOptions} />
        </AccordionDetails>
        <AccordionActions>
          <Button>Cancel</Button>
          <Button>Agree</Button>
        </AccordionActions>
      </Accordion>
      <Accordion >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel3-content"
          id="panel3-header"
        >
          <h3>Akcesoria</h3>
        </AccordionSummary>
        <AccordionDetails>
          <Accessories selectedOptions={selectedOptions} setSelectedOptions={setSelectedOptions} />
        </AccordionDetails>
        <AccordionActions>
          <Button>Cancel</Button>
          <Button>Agree</Button>
        </AccordionActions>
      </Accordion>
      <Accordion >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel3-content"
          id="panel3-header"
        >
          <h3>Dodatkowe usługi</h3>
        </AccordionSummary>
        <AccordionDetails>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse
          malesuada lacus ex, sit amet blandit leo lobortis eget.
        </AccordionDetails>
        <AccordionActions>
          <Button>Cancel</Button>
          <Button>Agree</Button>
        </AccordionActions>
      </Accordion>
    </div>
  );
}
