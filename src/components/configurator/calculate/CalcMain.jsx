import React, { useEffect, useState } from "react";
import garagePrice, { getPrices, getPriceDataSync } from "./garagePrice.js";
import { getGutterLength, normalizeRoofKey } from "../domain/gutters.js";
import {
  calculateGateAdjustments,
} from "./sectionalGatePrice.js";

let priceConfigCache = null;
let cachedAddons = null;

const DEFAULTS = {
  heightPerCm: 700,
  ocynkExtra: 1400,
  gateDwuskrzydlowa: -400,
  automatic: 1300,
  blachodachowkaPerM2: 65,
  filcPerM2: 25,
  door: 450,
  window: 450,
  spadTyl: -500,
  carportBrak: 1000,
  carportOblachowane: 2000,
  carportAzury: 2500,
  carportPerHalfMeter: 500,
  carportVariable: 1000,
  gutterPerMeter: 100,
  includedUpAndOverGate: 0,
  transportNear: 250,
  transportFar: 500,
};

async function fetchPriceConfig() {
  if (priceConfigCache) return priceConfigCache;
  const wpConfig = window.__CONFIGURATOR_PLUGIN__ || {};
  try {
    const result = await getPrices();
    priceConfigCache = {
      showPrice: result.showPrice !== false,
      addons: result.addons || null,
      pdfLanguage: wpConfig.pdfLanguage || "pl",
      pdfCzkExchangeRate: wpConfig.pdfCzkExchangeRate || 6,
    };
  } catch {
    priceConfigCache = {
      showPrice: true,
      addons: null,
      pdfLanguage: wpConfig.pdfLanguage || "pl",
      pdfCzkExchangeRate: wpConfig.pdfCzkExchangeRate || 6,
    };
  }
  return priceConfigCache;
}

function getAddon(key) {
  const source = cachedAddons || DEFAULTS;
  return source[key] !== undefined ? Number(source[key]) : DEFAULTS[key];
}

function CalcMain({ selectedOptions, price, setPrice, t = (key) => key }) {
  const baseGaragePrice = garagePrice({ selectedOptions });
  const [showPrice, setShowPrice] = useState(true);
  const [pdfLanguage, setPdfLanguage] = useState((globalThis.__CONFIGURATOR_PLUGIN__ || {}).pdfLanguage || "pl");
  const [pdfCzkExchangeRate, setPdfCzkExchangeRate] = useState((globalThis.__CONFIGURATOR_PLUGIN__ || {}).pdfCzkExchangeRate || 6);
  const [pricingRevision, setPricingRevision] = useState(0);

  useEffect(() => {
    fetchPriceConfig().then((config) => {
      setShowPrice(config.showPrice);
      setPdfLanguage(config.pdfLanguage || "pl");
      setPdfCzkExchangeRate(Number(config.pdfCzkExchangeRate) > 0 ? Number(config.pdfCzkExchangeRate) : 6);
      if (config.addons) cachedAddons = config.addons;
      setPricingRevision((revision) => revision + 1);
    });
  }, []);

  useEffect(() => {
    const {
      width,
      depth,
      roof,
      height,
      automatic,
      roofType,
      filc,
      door,
      window,
      carport,
      carportWidth,
      gutter,
      carportType,
      wojewodztwo,
      countAutomatic,
      gateCount,
      carportSide,
    } = selectedOptions;

    const roofKey = normalizeRoofKey(roof);
    const standardHeight = 213;
    const heightSteps = Math.round((Number(height) - standardHeight) / 10);
    const heightPrice = heightSteps * getAddon("heightPerCm");

    const carportPrice = carport
      ? ((Number(carportWidth) - 1) / 0.5) * getAddon("carportPerHalfMeter") +
        (carportType === "brak"
          ? getAddon("carportBrak")
          : carportType === "oblachowane"
          ? getAddon("carportOblachowane")
          : getAddon("carportAzury")) +
        getAddon("carportVariable")
      : 0;

    const gutterPrice = gutter
      ? getGutterLength({ width, depth, roof, carport, carportWidth, carportSide }) * getAddon("gutterPerMeter")
      : 0;

    const activeGateCount = Math.min(3, Math.max(0, Number(gateCount) || 0));
    const gateTypes = [selectedOptions.gateType1, selectedOptions.gateType2, selectedOptions.gateType3];
    const gateWidths = [selectedOptions.gateWidth1, selectedOptions.gateWidth2, selectedOptions.gateWidth3];
    const gateHeights = [selectedOptions.gateHeight1, selectedOptions.gateHeight2, selectedOptions.gateHeight3];
    const sectionalPrices = getPriceDataSync().sectionalGates;
    const gates = calculateGateAdjustments({
      gates: gateTypes.slice(0, activeGateCount).map((type, index) => ({
        type,
        width: gateWidths[index],
        height: gateHeights[index],
      })),
      prices: sectionalPrices,
      includedUpAndOverGate: getAddon("includedUpAndOverGate"),
      doubleLeafAdjustment: getAddon("gateDwuskrzydlowa"),
    });

    if (baseGaragePrice === null || !gates.valid) {
      setPrice(null);
      return;
    }

    const automationUnits = automatic
      ? Math.min(Number(countAutomatic) || 0, gates.nonSectionalCount)
      : 0;
    const filcPrice = filc
      ? Number(depth) * (Number(width) + (carport ? Number(carportWidth) : 0)) * getAddon("filcPerM2")
      : 0;

    const nearRegions = [
      "dolnoĹ›lÄ…skie", "lubelskie", "lubuskie", "Ĺ‚Ăłdzkie", "maĹ‚opolskie",
      "mazowieckie", "opolskie", "podkarpackie", "Ĺ›lÄ…skie", "Ĺ›wiÄ™tokrzyskie", "wielkopolskie",
    ];
    const farRegions = ["kujawsko-pomorskie", "podlaskie", "pomorskie", "warmiĹ„sko-mazurskie", "zachodniopomorskie"];
    const transportPrice = nearRegions.includes(wojewodztwo)
      ? getAddon("transportNear")
      : farRegions.includes(wojewodztwo)
      ? getAddon("transportFar")
      : 0;

    const fullPrice =
      Number(baseGaragePrice) +
      (roofKey === "spad tyl" ? getAddon("spadTyl") : 0) +
      heightPrice +
      gates.amount +
      getAddon("automatic") * automationUnits +
      (normalizeRoofKey(roofType) === "blachodachowka" ? Number(depth) * Number(width) * getAddon("blachodachowkaPerM2") : 0) +
      filcPrice +
      (door?.length || 0) * getAddon("door") +
      (window?.length || 0) * getAddon("window") +
      carportPrice +
      gutterPrice +
      transportPrice;

    setPrice(fullPrice);
  }, [selectedOptions, baseGaragePrice, pricingRevision, setPrice]);

  if (!showPrice) return null;
  if (price === null) {
    return <p className="text-base md:text-lg text-red-800 font-bold">{t("sectionalPriceUnavailable")}</p>;
  }

  const isCzechPdf = pdfLanguage === "cs";
  const displayPrice = isCzechPdf
    ? Math.round((Number(price) || 0) * pdfCzkExchangeRate).toLocaleString("cs-CZ").replace(/\s/g, " ")
    : Math.round(Number(price) || 0).toLocaleString("pl-PL").replace(/\s/g, " ");
  const displayCurrency = isCzechPdf ? "CZK" : "zł";

  return (
    <div>
      <p className="text-4xl max-sm:text-base md:pt-5 text-red-800 font-bold">
        {t("priceLabel")}:
        <span className="underline ml-5 font-black">{displayPrice} {displayCurrency}</span>
      </p>
      <p className="md:text-sm text-xs md:pb-2">{t("priceNotice")}</p>
    </div>
  );
}

export default CalcMain;
