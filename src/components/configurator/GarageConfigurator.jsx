import React, { useState } from "react";
import MainGarage from "./Settings/MainSetting";
import TypeGarage from "./Settings/TypeGarage";
import RoofSetting from "./Settings/RoofSetting";
import GateSetting2 from "./Settings/GateSetting2";
import DoorSettings from "./Settings/DoorSettings";
import WindowSettings from "./Settings/WindowSettings";
import CarportSetting from "./Settings/CarportSetting";
import Accessories from "./Settings/Accessories";
// importuj inne selektory

const GarageConfigurator = ({ selectedOptions, setSelectedOptions }) => {
  return (
    <>
      <TypeGarage
        selectedOptions={selectedOptions}
        setSelectedOptions={setSelectedOptions}
      />
      <MainGarage
        selectedOptions={selectedOptions}
        setSelectedOptions={setSelectedOptions}
      />
      <RoofSetting
        selectedOptions={selectedOptions}
        setSelectedOptions={setSelectedOptions}
      />
      <GateSetting2
        selectedOptions={selectedOptions}
        setSelectedOptions={setSelectedOptions}
      />
      <DoorSettings
        selectedOptions={selectedOptions}
        setSelectedOptions={setSelectedOptions}
      />
      <WindowSettings
        selectedOptions={selectedOptions}
        setSelectedOptions={setSelectedOptions}
      />
      <CarportSetting
        selectedOptions={selectedOptions}
        setSelectedOptions={setSelectedOptions}
      />
      <Accessories
        selectedOptions={selectedOptions}
        setSelectedOptions={setSelectedOptions}
      />
    </>
  );
};

export default GarageConfigurator;
