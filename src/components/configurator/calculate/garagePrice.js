import dataDefault from "./data.json";
import dataOcynkDefault from "./dataOcynk.json";
import dataStandingSeamDefault from "./dataStandingSeam.json";
import sectionalGatesDefaultCatalog from "./sectionalGates.json";
import { expandSectionalGateCatalog } from "./sectionalGatePrice.js";
import { usesStandingSeamPrice } from "../domain/standingSeamPricing.js";

const sectionalGatesDefault = expandSectionalGateCatalog(sectionalGatesDefaultCatalog);
const defaultPrices = {
  standard: dataDefault,
  galvanized: dataOcynkDefault,
  standingSeam: dataStandingSeamDefault,
  sectionalGates: sectionalGatesDefault,
};

let cachedPrices = null;
let cachedAddons = null;
let cachedShowPrice = true;
let fetchPromise = null;

async function fetchPrices() {
  if (cachedPrices) return { ...cachedPrices, addons: cachedAddons, showPrice: cachedShowPrice };
  if (fetchPromise) return fetchPromise;

  const wpConfig = window.__CONFIGURATOR_PLUGIN__ || {};
  const endpoint = wpConfig.pricesEndpoint;

  if (!endpoint) {
    cachedPrices = defaultPrices;
    return { ...cachedPrices, addons: null, showPrice: true };
  }

  fetchPromise = fetch(endpoint)
    .then((res) => res.json())
    .then((result) => {
      if (result.success && result.data) {
        cachedPrices = {
          standard: result.data.standard || dataDefault,
          galvanized: result.data.galvanized || dataOcynkDefault,
          standingSeam: result.data.standingSeam || dataStandingSeamDefault,
          sectionalGates: result.data.sectionalGates || sectionalGatesDefault,
        };
        if (result.data.addons) cachedAddons = result.data.addons;
        cachedShowPrice = result.data.showPrice !== false;
      } else {
        cachedPrices = defaultPrices;
      }
      fetchPromise = null;
      return { ...cachedPrices, addons: cachedAddons, showPrice: cachedShowPrice };
    })
    .catch(() => {
      cachedPrices = defaultPrices;
      fetchPromise = null;
      return { ...cachedPrices, addons: null, showPrice: true };
    });

  return fetchPromise;
}

export async function getPrices() {
  return fetchPrices();
}

export function getPriceDataSync() {
  return cachedPrices || defaultPrices;
}

function findPrice(prices, width, depth) {
  // Try exact match first (supports half-meter values like 3.5, 4.5)
  const exact = prices.find(
    (g) => g.width === width && g.depth === depth
  );
  if (exact) return exact.price;

  // Fall back to rounding up to next full meter
  const w = Math.ceil(width);
  const d = Math.ceil(depth);
  return prices.find(
    (g) => g.width === w && g.depth === d
  )?.price ?? null;
}

const garagePrice = ({ selectedOptions }) => {
  const width = selectedOptions.width;
  const depth = selectedOptions.depth;
  const prices = cachedPrices || defaultPrices;

  if (usesStandingSeamPrice(selectedOptions)) {
    const price = findPrice(prices.standingSeam, width, depth);
    if (price === null) {
      console.error("No matching standing-seam garage found");
      return null;
    }
    return price;
  }

  if (selectedOptions.color === "Ocynk") {
    const price = findPrice(prices.galvanized, width, depth);
    if (price === null) {
      console.error("No matching garage found");
      return null;
    }
    const ocynkExtra = cachedAddons ? (cachedAddons.ocynkExtra || 1400) : 1400;
    return price + ocynkExtra;
  }

  const price = findPrice(prices.standard, width, depth);
  if (price === null) {
    console.error("No matching garage found");
    return null;
  }

  return price;
};

export default garagePrice;
