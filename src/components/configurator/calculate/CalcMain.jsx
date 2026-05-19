import React, { useState, useEffect } from "react";
import garagePrice from "./garagePrice.js";

let priceConfigCache = null;

async function fetchPriceConfig() {
  if (priceConfigCache !== null) return priceConfigCache;
  const wpConfig = window.__CONFIGURATOR_PLUGIN__ || {};
  const endpoint = wpConfig.pricesEndpoint;
  if (!endpoint) {
    priceConfigCache = { showPrice: true, addons: null };
    return priceConfigCache;
  }
  try {
    const res = await fetch(endpoint);
    const result = await res.json();
    priceConfigCache = {
      showPrice: result.data.showPrice !== false,
      addons: result.data.addons || null,
    };
    return priceConfigCache;
  } catch {
    priceConfigCache = { showPrice: true, addons: null };
    return priceConfigCache;
  }
}

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
  transportNear: 250,
  transportFar: 500,
};

let cachedAddons = null;

function getAddon(key) {
  const a = cachedAddons || DEFAULTS;
  return a[key] !== undefined ? a[key] : DEFAULTS[key];
}

function CalcMain({ selectedOptions, price, setPrice, t = (key) => key }) {
  const SoloGaragePrice = garagePrice({ selectedOptions });
  const [showPrice, setShowPrice] = useState(true);
  const [addonsLoaded, setAddonsLoaded] = useState(false);

  useEffect(() => {
    fetchPriceConfig().then((cfg) => {
      setShowPrice(cfg.showPrice);
      if (cfg.addons) cachedAddons = cfg.addons;
      setAddonsLoaded(true);
    });
  }, []);

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
    gateType1,
    gateType2,
    gateType3,
    gateCount,
    carportSide,
  } = selectedOptions;

  const roofKey = String(roof || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0142/g, "l")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const calcHeightPrice = () => {
    const standardHeight = 213;
    const heightDifference = Number(height) - standardHeight;
    const heightSteps = Math.round(heightDifference / 10);
    return heightSteps * getAddon("heightPerCm");
  };

  const calcCarportPrice = () => {
    if (!carport) return 0;
    const typePrice =
      carportType === "brak"
        ? getAddon("carportBrak")
        : carportType === "oblachowane"
        ? getAddon("carportOblachowane")
        : getAddon("carportAzury");
    return (
      ((carportWidth - 1) / 0.5) * getAddon("carportPerHalfMeter") +
      typePrice +
      getAddon("carportVariable")
    );
  };

  const calcGutterPrice = () => {
    const perMeter = getAddon("gutterPerMeter");
    let resault = 0;
    if (roof === "dwuspad" || roof === "dwuspad przod-tyl") {
      if (carport && roof === "dwuspad" && (carportSide === "przod" || carportSide === "tyl")) {
        return (resault = (width + carportWidth) * 2 * perMeter);
      }
      resault = depth * 2 * perMeter;
      if (
        carport &&
        roof === "dwuspad przod-tyl" &&
        (carportSide === "lewo" || carportSide === "prawo")
      ) {
        resault = (depth + carportWidth) * 2 * perMeter;
      }
    } else {
      if (carportSide === "lewo" || carportSide === "prawo") {
        if (carport) {
          return (resault = (depth + carportWidth) * perMeter);
        }
        return (resault = depth * perMeter);
      }
      if (carport) {
        return (resault = width * perMeter);
      }
      return (resault = width * perMeter);
    }
    return resault;
  };

  const transportPrice = (woj) => {
    const near = getAddon("transportNear");
    const far = getAddon("transportFar");
    if (
      woj === "dolnośląskie" || woj === "lubelskie" || woj === "lubuskie" ||
      woj === "łódzkie" || woj === "małopolskie" || woj === "mazowieckie" ||
      woj === "opolskie" || woj === "podkarpackie" || woj === "śląskie" ||
      woj === "świętokrzyskie" || woj === "wielkopolskie"
    ) {
      return near;
    }
    if (
      woj === "kujawsko-pomorskie" || woj === "podlaskie" ||
      woj === "pomorskie" || woj === "warmińsko-mazurskie" ||
      woj === "zachodniopomorskie"
    ) {
      return far;
    }
    return null;
  };

  const gatePrice = () => {
    let resault = 0;
    const gateType = [gateType1, gateType2, gateType3];
    const dwuPrice = getAddon("gateDwuskrzydlowa");
    for (let i = 0; i <= gateCount; i++) {
      if (gateType[i] === "dwuskrzydłowa") {
        resault += dwuPrice;
      }
    }
    return resault;
  };

  const filcPrice = () => {
    if (!filc) return 0;
    const perM2 = getAddon("filcPerM2");
    if (carport) {
      return depth * (width + carportWidth) * perM2;
    }
    return depth * width * perM2;
  };

  const calculatePrice = () => {
    const fullPrice =
      SoloGaragePrice +
      (roofKey === "spad tyl" ? getAddon("spadTyl") : 0) +
      calcHeightPrice() +
      gatePrice() +
      (automatic ? getAddon("automatic") * countAutomatic : 0) +
      (roofType === "blachodachówka" ? depth * width * getAddon("blachodachowkaPerM2") : 0) +
      filcPrice() +
      (door.length >= 0 ? door.length * getAddon("door") : 0) +
      (window.length >= 0 ? window.length * getAddon("window") : 0) +
      (carport ? calcCarportPrice() : 0) +
      (gutter ? calcGutterPrice() : 0) +
      transportPrice(wojewodztwo);

    setPrice(fullPrice);
  };
  calculatePrice();

  if (!showPrice) return null;

  return (
    <div>
      <p className="text-4xl max-sm:text-base md:pt-5 text-red-800 font-bold">
        {t("priceLabel")}:
        <span className="underline ml-5 font-black">{price} zł</span>
      </p>
      <p className="md:text-sm text-xs md:pb-2">
        {t("priceNotice")}
      </p>
    </div>
  );
}

export default CalcMain;
