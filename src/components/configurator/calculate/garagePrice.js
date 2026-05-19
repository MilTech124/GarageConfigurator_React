import dataDefault from "./data.json";
import dataOcynkDefault from "./dataOcynk.json";

let cachedPrices = null;
let cachedAddons = null;
let fetchPromise = null;

async function fetchPrices() {
  if (cachedPrices) return cachedPrices;
  if (fetchPromise) return fetchPromise;

  const wpConfig = window.__CONFIGURATOR_PLUGIN__ || {};
  const endpoint = wpConfig.pricesEndpoint;

  if (!endpoint) {
    cachedPrices = { standard: dataDefault, galvanized: dataOcynkDefault };
    return cachedPrices;
  }

  fetchPromise = fetch(endpoint)
    .then((res) => res.json())
    .then((result) => {
      if (result.success && result.data) {
        cachedPrices = {
          standard: result.data.standard || dataDefault,
          galvanized: result.data.galvanized || dataOcynkDefault,
        };
        if (result.data.addons) cachedAddons = result.data.addons;
      } else {
        cachedPrices = { standard: dataDefault, galvanized: dataOcynkDefault };
      }
      fetchPromise = null;
      return cachedPrices;
    })
    .catch(() => {
      cachedPrices = { standard: dataDefault, galvanized: dataOcynkDefault };
      fetchPromise = null;
      return cachedPrices;
    });

  return fetchPromise;
}

export async function getPrices() {
  return fetchPrices();
}

export function getPriceDataSync() {
  return cachedPrices || { standard: dataDefault, galvanized: dataOcynkDefault };
}

const garagePrice = ({ selectedOptions }) => {
  const width = Math.ceil(selectedOptions.width);
  const depth = Math.ceil(selectedOptions.depth);
  const prices = cachedPrices || { standard: dataDefault, galvanized: dataOcynkDefault };

  if (selectedOptions.color === "Ocynk") {
    const garagePrice = prices.galvanized.find(
      (garage) => garage.width === width && garage.depth === depth
    );
    if (!garagePrice) {
      console.error("No matching garage found");
      return null;
    }
    const ocynkExtra = cachedAddons ? (cachedAddons.ocynkExtra || 1400) : 1400;
    return garagePrice.price + ocynkExtra;
  }
  const garagePrice = prices.standard.find(
    (garage) => garage.width === width && garage.depth === depth
  );
  if (!garagePrice) {
    console.error("No matching garage found");
    return null;
  }

  return garagePrice.price;
};

export default garagePrice;
