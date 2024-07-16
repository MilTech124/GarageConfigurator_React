import data from "./data.json";
import dataOcynk from "./dataOcynk.json";

const garagePrice = ({ selectedOptions }) => {
  const { width, depth } = selectedOptions;

  if(selectedOptions.color === "Ocynk") {
    const garagePrice = dataOcynk.find((garage) => garage.width === width && garage.depth === depth);
    if (!garagePrice) {
      // Handle the case where no matching garage is found
      console.error("No matching garage found");
      return null; // or return a default value or throw an error
    }
    return garagePrice.price;
  }
  const garagePrice = data.find((garage) => garage.width === width && garage.depth === depth);

  if (!garagePrice) {
    // Handle the case where no matching garage is found
    console.error("No matching garage found");
    return null; // or return a default value or throw an error
  }

  return garagePrice.price;
};

export default garagePrice;