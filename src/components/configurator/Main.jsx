"use client";

import React, { useState, useEffect } from "react";
import GarageConfigurator from "./GarageConfigurator";
import GarageViewer from "./GarageViewer";
import Modal from "./Modal";
import axios from 'axios';
import LeftSettings from "./LeftSettings/LeftSettings";
import CalcMain from "./calculate/CalcMain";
import Button from "@mui/material/Button";
import SendIcon from "@mui/icons-material/Send";
import { generateOrderPdf } from "../../utils/pdfGenerator";
import TagManager from 'react-gtm-module';
import { LANG, t as translate, translateOption } from "./i18n";
import { getPrices } from "./calculate/garagePrice";


function resolveInitialLang() {
  const runtimeLang = globalThis?.__CONFIGURATOR_PLUGIN__?.lang;
  return Object.values(LANG).includes(runtimeLang) ? runtimeLang : LANG.PL;
}

function Main() {
  const [lang, setLang] = useState(resolveInitialLang);
  const t = (key) => translate(lang, key);
  const o = (value) => translateOption(lang, value);

  const [selectedOptions, setSelectedOptions] = useState({
    color: "Złoty Dąb",
    colorRal: null,
    width: 6,
    depth: 6,
    height: 213,
    emboss: "waskie",
    direction: "poziom",

    roof: "dwuspad",
    roofColor: "Antracyt",
    roofColorRal: "#272C38",
    roofType: "trapezowa",

    gateEmbose: "waskie",
    gateDirection: "poziom",

    gateCount: 2,   //2 wczesniej
    gateType1: "uchylna",
    gateColor1: "Złoty Dąb",
    gateColorRal1: null,
    gateWidth1: 3,
    gateHeight1: 200,
    gatePositionValue1: 0,
    gateDrive1: "came",

    gateType2: "uchylna",
    gateColor2: "Złoty Dąb",
    gateColorRal2: null,
    gateWidth2: 3,
    gateHeight2: 200,
    gatePositionValue2: 300,
    gateDrive2: "came",

    gateType3: "uchylna",
    gateColor3: "Złoty Dąb",
    gateColorRal3: null,
    gateWidth3: 3,
    gateHeight3: 200,
    gatePositionValue3: 600,
    gateDrive3: "came",

    door: [],
    window: [],

    carport: false,
    carportWidth: 3,
    carportSide: "lewo",
    carportSideName: "lewo",
    carportType: "brak",
    carportSides:{lewo:false,prawo:false,przod:false,tyl:true},
    carportSides2:{lewo:false,prawo:false,przod:false,tyl:false},

    gutter: false,
    roofFlashing: false,
    roofFlashingColorMode: "roof",
    roofFlashingColor: "",
    roofFlashingColorRal: null,
    garageFlashing: false,
    garageFlashingColorMode: "garage",
    garageFlashingColor: "",
    garageFlashingColorRal: null,
    automatic: false,
    countAutomatic: 1,
    filc: false,
    transport: false,
    wojewodztwo: ""
  });
  const [modal, setModal] = useState(false);
  const [capture, setCapture] = useState(false);
  const [imageURL, setImageURL] = useState(null);
  const [price, setPrice] = useState(0);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showPrice, setShowPrice] = useState(true);

  useEffect(() => {
    getPrices().then((cfg) => {
      if (cfg) setShowPrice(cfg.showPrice !== false);
    });
  }, []);


  //use effects helpers

  useEffect(() => {
    const isStandingSeam = selectedOptions.emboss === "na_rabek";
    const isGalvanized = selectedOptions.color === "Ocynk";
    if (!isStandingSeam && !isGalvanized) return;

    const updates = { direction: "pion" };
    if (isGalvanized && !isStandingSeam) updates.emboss = "waskie";
    if (isGalvanized) {
      Object.assign(updates, {
        gateType1: "dwuskrzydłowa",
        gateType2: "dwuskrzydłowa",
        roofColorRal: "#A7ABA7",
        gateColor1: "Ocynk",
        gateColor2: "Ocynk",
        gateColor3: "Ocynk",
      });
    }
    const changed = Object.entries(updates).some(([key, value]) => selectedOptions[key] !== value);
    if (changed) setSelectedOptions((current) => ({ ...current, ...updates }));
  }, [selectedOptions.color, selectedOptions.emboss, selectedOptions.direction]);

  useEffect(() => {
    const updates = {};
    for (let index = 1; index <= 3; index += 1) {
      if (
        selectedOptions[`gateType${index}`] === "segmentowa" &&
        selectedOptions[`gateDrive${index}`] !== "came"
      ) {
        updates[`gateDrive${index}`] = "came";
      }
    }
    if (Object.keys(updates).length) {
      setSelectedOptions((current) => ({ ...current, ...updates }));
    }
  }, [
    selectedOptions.gateType1,
    selectedOptions.gateType2,
    selectedOptions.gateType3,
    selectedOptions.gateDrive1,
    selectedOptions.gateDrive2,
    selectedOptions.gateDrive3,
  ]);




  const wpConfig = window.__CONFIGURATOR_PLUGIN__ || {};
  const uploadEndpoint =
    wpConfig.uploadEndpoint ||
    `${window.location.origin}/wp-json/configurator/v1/upload-image`;

  const isAdmin = wpConfig.isAdmin === true;

  const generateTestPdf = () => {
    setPdfLoading(true);
    try {
      const pdfLang = globalThis?.__CONFIGURATOR_PLUGIN__?.pdfLanguage || lang;
      const czkExchangeRate = globalThis?.__CONFIGURATOR_PLUGIN__?.pdfCzkExchangeRate || 6;
      const doc = generateOrderPdf({
        garage: {
          width: selectedOptions.width,
          depth: selectedOptions.depth,
          height: selectedOptions.height,
          color: selectedOptions.color,
          colorRal: selectedOptions.colorRal,
          emboss: selectedOptions.emboss,
          direction: selectedOptions.direction,
          roof: selectedOptions.roof,
          roofColor: selectedOptions.roofColor,
          roofColorRal: selectedOptions.roofColorRal,
          roofType: selectedOptions.roofType,
          gateEmbose: selectedOptions.gateEmbose,
          gateDirection: selectedOptions.gateDirection,
          gateCount: selectedOptions.gateCount,
          gateType1: selectedOptions.gateType1,
          gateColor1: selectedOptions.gateColor1,
          gateWidth1: selectedOptions.gateWidth1,
          gateHeight1: selectedOptions.gateHeight1,
          gatePositionValue1: selectedOptions.gatePositionValue1,
          gateDrive1: selectedOptions.gateDrive1,
          gateType2: selectedOptions.gateType2,
          gateColor2: selectedOptions.gateColor2,
          gateWidth2: selectedOptions.gateWidth2,
          gateHeight2: selectedOptions.gateHeight2,
          gatePositionValue2: selectedOptions.gatePositionValue2,
          gateDrive2: selectedOptions.gateDrive2,
          gateType3: selectedOptions.gateType3,
          gateColor3: selectedOptions.gateColor3,
          gateWidth3: selectedOptions.gateWidth3,
          gateHeight3: selectedOptions.gateHeight3,
          gatePositionValue3: selectedOptions.gatePositionValue3,
          gateDrive3: selectedOptions.gateDrive3,
          doors: selectedOptions.door?.map((d, i) => `Drzwi ${i + 1}: ${JSON.stringify(d)}`).join("\n") || "",
          windows: selectedOptions.window?.map((w, i) => `Okno ${i + 1}: ${JSON.stringify(w)}`).join("\n") || "",
          doorList: selectedOptions.door || [],
          windowList: selectedOptions.window || [],
          doorCount: selectedOptions.door?.length || 0,
          windowCount: selectedOptions.window?.length || 0,
          carport: selectedOptions.carport,
          carportWidth: selectedOptions.carportWidth,
          carportSide: selectedOptions.carportSide,
          carportType: selectedOptions.carportType,
          carportSides: selectedOptions.carportSides,
          carportSides2: selectedOptions.carportSides2,
          gutter: selectedOptions.gutter,
          roofFlashing: selectedOptions.roofFlashing,
          roofFlashingColorMode: selectedOptions.roofFlashingColorMode,
          roofFlashingColor: selectedOptions.roofFlashingColor,
          roofFlashingColorRal: selectedOptions.roofFlashingColorRal,
          garageFlashing: selectedOptions.garageFlashing,
          garageFlashingColorMode: selectedOptions.garageFlashingColorMode,
          garageFlashingColor: selectedOptions.garageFlashingColor,
          garageFlashingColorRal: selectedOptions.garageFlashingColorRal,
          automatic: selectedOptions.automatic,
          countAutomatic: selectedOptions.countAutomatic,
          filc: selectedOptions.filc,
          transport: selectedOptions.transport,
          wojewodztwo: selectedOptions.wojewodztwo,
        },
        contact: {
          name: "Test",
          email: "test@test.pl",
          phone: "000 000 000",
          postal_code: "00-000",
          city: "Testowo",
          address: "ul. Testowa 1",
          message: "Generowanie testowe PDF",
        },
        price: price ? String(price) : "",
        imageUrl: imageURL || "",
        lang: pdfLang,
        czkExchangeRate,
      });

      doc.save(pdfLang === "cs" ? "poptavka-test.pdf" : "zamowienie-test.pdf");
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Blad generowania PDF: " + err.message);
    } finally {
      setPdfLoading(false);
    }
  };

  // Funkcja do wysylania zdarzenia do GTM
  const sendGTMEvent = () => {
    TagManager.dataLayer({
      dataLayer: {
        event: 'order_button_click',
        eventCategory: 'Configurator',
        eventAction: 'Click',
        eventLabel: 'Zamow Button',
      }
    });
  };

  const captureScreenshot = async (image) => {

    const fetchResponse = await fetch(image);
    const blob = await fetchResponse.blob();

    const resizeImage = (blob, maxWidth, maxHeight) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = URL.createObjectURL(blob);

        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate the new dimensions while maintaining the aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height *= maxWidth / width));
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width *= maxHeight / height));
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((resizedBlob) => {
            resolve(resizedBlob);
          }, 'image/png');
        };

      });

    };

    const resizedBlob = await resizeImage(blob, 800, 600); // Set your desired max width and height

    const formData = new FormData();
    formData.append('file', resizedBlob, 'screenshot.png');

    try {
      // Use the custom upload endpoint instead of WordPress media endpoint
      const response = await axios.post(
        uploadEndpoint,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...(wpConfig.nonce ? { 'X-WP-Nonce': wpConfig.nonce } : {}),
          },
        }
      );
      console.log("Response", response.data);

      if (response.data.success) {
        await setImageURL(response.data.url);
      } else {
        console.error("Upload failed:", response.data.message);
        await setImageURL("");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      await setImageURL("");
    }
    await setCapture(false);

  };

  return (
    <div className="bg-slate-200 relative w-full min-h-screen flex items-start max-md:flex-col max-md:h-auto max-md:min-h-screen">

   {capture && <div class="absolute top-0 left-0 w-full h-full flex-col gap-4  flex items-center justify-center !z-50 bg-black/50 ">
        <div class="w-28 h-28 border-8 text-blue-400 text-4xl animate-spin border-gray-300 flex items-center justify-center border-t-blue-400 rounded-full">
          <svg viewBox="0 0 24 24" fill="currentColor" height="1em" width="1em" class="animate-ping">
            <path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.337 6.182 14.976 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.337 13.382 8.976 12 6.001 12z"></path>
          </svg>
        </div>
      </div> }

      <LeftSettings selectedOptions={selectedOptions} setSelectedOptions={setSelectedOptions} t={t} o={o} lang={lang} />
      <Modal selectedOptions={selectedOptions} setSelectedOptions={setSelectedOptions} modal={modal} price={price} setModal={setModal} setCapture={setCapture} capture={capture} imageURL={imageURL} setImageURL={setImageURL} t={t} lang={lang} />
      <div id='capture' className="configurator-viewer-sticky w-full md:self-start md:h-[62vh] relative flex flex-col max-md:order-1 max-md:h-auto">
        <div className="configurator-canvas-area relative w-full min-h-0 flex-1 max-md:h-[30vh] max-md:flex-none">
          <GarageViewer selectedOptions={selectedOptions} captureScreenshot={captureScreenshot} capture={capture} lang={lang} setLang={setLang} />
        </div>
        <div className="md:pl-[10%] relative flex shrink-0 justify-center items-center gap-2 p-2 border-2 border-slate-800 bg-slate-200">
          <div className="min-w-0 flex-1">
            <CalcMain selectedOptions={selectedOptions} price={price} setPrice={setPrice} t={t} />
          </div>

          {isAdmin && (
            <Button
              onClick={generateTestPdf}
              disabled={pdfLoading}
              variant="outlined"
              size="large"
              sx={{ fontSize: "0.85rem", px: 2, py: 1.2, fontWeight: 600, mr: 1, borderColor: "#666", color: "#333", "&:hover": { borderColor: "#333", bgcolor: "rgba(0,0,0,0.04)" } }}
            >
              {pdfLoading ? "Generowanie..." : "Test PDF"}
            </Button>
          )}

          <Button
            onClick={() => {
              sendGTMEvent();
              setModal(true);
            }}
            variant="contained"
            disabled={price === null}
            size="large"
            endIcon={<SendIcon />}
            sx={{ fontSize: "1.1rem", px: 3, py: 1.2, fontWeight: 700 }}
          >
            {showPrice ? t("order") : t("orderQuote")}
          </Button>

        </div>

        {/* <button
          onClick={() => (setModal(true))}
          className="fixed z-50 btn-acel max-sm:py-2 w-full py-5 text-2xl bottom-0 right-0  animate-pulse  bg-slate-900 text-white rounded-md"
        >
          Wyslij wycene
        </button> */}


      </div>


    </div>
  );
}

export default Main;
