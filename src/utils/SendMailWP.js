import { toast } from "react-toastify";
import { generateOrderPdf } from "./pdfGenerator";

function resolveThankYouPath(wpConfig, lang) {
  if (lang === "cs") return wpConfig.thankYouPathCs || "/dekujeme";
  if (lang === "sl") return wpConfig.thankYouPathSl || "/dakujeme";
  if (lang === "hu") return wpConfig.thankYouPathHu || "/koszonjuk";
  return wpConfig.thankYouPathPl || wpConfig.thankYouPath || "/dziekujemy";
}

function getToastCopy(lang) {
  if (lang === "cs") {
    return {
      sending: "Odesilani zpravy",
      sent: "Zprava byla odeslana",
      error: "Chyba pri odeslani zpravy: ",
    };
  }
  if (lang === "sl") {
    return {
      sending: "Odosiela sa sprava",
      sent: "Sprava bola odoslana",
      error: "Chyba pri odoslani spravy: ",
    };
  }
  if (lang === "hu") {
    return {
      sending: "Uzenet kuldese folyamatban",
      sent: "Az uzenet elkuldve",
      error: "Hiba az uzenet kuldese kozben: ",
    };
  }
  return {
    sending: "Wysylanie wiadomosci",
    sent: "Wyslano wiadomosc",
    error: "Blad wysylania wiadomosci: ",
  };
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return btoa(binary);
}

function buildPdfPayload(data, lang) {
  const wpConfig = window.__CONFIGURATOR_PLUGIN__ || {};
  const pdfLang = wpConfig.pdfLanguage || lang;
  const czkExchangeRate = wpConfig.pdfCzkExchangeRate || 6;
  const selectedOptions = data.data || {};
  const doc = generateOrderPdf({
    garage: {
      ...selectedOptions,
      doors: data.door || "",
      windows: data.window || "",
      doorList: Array.isArray(selectedOptions.door) ? selectedOptions.door : [],
      windowList: Array.isArray(selectedOptions.window) ? selectedOptions.window : [],
      doorCount: Array.isArray(selectedOptions.door) ? selectedOptions.door.length : 0,
      windowCount: Array.isArray(selectedOptions.window) ? selectedOptions.window.length : 0,
    },
    contact: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      postal_code: data.postalCode,
      city: data.city,
      address: data.address,
      message: data.message || "",
    },
    price: data.price,
    imageUrl: data.imageURL || "",
    lang: pdfLang,
    czkExchangeRate,
  });

  return {
    filename: `${pdfLang === "cs" ? "poptavka-garaz" : "zapytanie-garaz"}-${new Date().toISOString().slice(0, 10)}.pdf`,
    mimeType: "application/pdf",
    contentBase64: arrayBufferToBase64(doc.output("arraybuffer")),
  };
}

// Send inquiry to WordPress REST API
function SendEmailWP(data, templateType = "default", lang = "pl") {
  const wpConfig = window.__CONFIGURATOR_PLUGIN__ || {};
  const wpApiUrl =
    wpConfig.inquiryEndpoint ||
    `${window.location.origin}/wp-json/configurator/v1/inquiry`;
  const toastCopy = getToastCopy(lang);

  toast.info(toastCopy.sending, {
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
  });

  let pdfPayload = null;
  try {
    pdfPayload = buildPdfPayload(data, lang);
  } catch (error) {
    console.error("PDF generation failed before sending inquiry:", error);
    toast.error(toastCopy.error + "Nie udalo sie wygenerowac PDF", {
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
    });
    return;
  }

  const emailData = {
    template_type: templateType,
    lang,
    contact: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      postalCode: data.postalCode,
      city: data.city,
      address: data.address,
      message: data.message || "",
    },
    garage_config: {
      width: data.data?.width,
      depth: data.data?.depth,
      height: data.data?.height,
      color: data.data?.color,
      colorRal: data.data?.colorRal,
      emboss: data.data?.emboss,
      direction: data.data?.direction,
      roof: data.data?.roof,
      roofColor: data.data?.roofColor,
      roofColorRal: data.data?.roofColorRal,
      roofType: data.data?.roofType,
      gateEmbose: data.data?.gateEmbose,
      gateDirection: data.data?.gateDirection,
      gateCount: data.data?.gateCount,
      gateType1: data.data?.gateType1,
      gateColor1: data.data?.gateColor1,
      gateWidth1: data.data?.gateWidth1,
      gateHeight1: data.data?.gateHeight1,
      gateDrive1: data.data?.gateDrive1,
      gateType2: data.data?.gateType2,
      gateColor2: data.data?.gateColor2,
      gateWidth2: data.data?.gateWidth2,
      gateHeight2: data.data?.gateHeight2,
      gateDrive2: data.data?.gateDrive2,
      gateType3: data.data?.gateType3,
      gateColor3: data.data?.gateColor3,
      gateWidth3: data.data?.gateWidth3,
      gateHeight3: data.data?.gateHeight3,
      gateDrive3: data.data?.gateDrive3,
      gatePositionValue1: data.data?.gatePositionValue1,
      gatePositionValue2: data.data?.gatePositionValue2,
      gatePositionValue3: data.data?.gatePositionValue3,
      doors: data.door || "",
      windows: data.window || "",
      doorCount: data.doorList || 0,
      windowCount: data.windowList || 0,
      carport: data.data?.carport,
      carportWidth: data.data?.carportWidth,
      carportSide: data.data?.carportSide,
      carportType: data.data?.carportType,
      carportSides: data.carportSides || "",
      carportSides2: data.carportSides2 || "",
      gutter: data.data?.gutter,
      roofFlashing: data.data?.roofFlashing,
      roofFlashingColorMode: data.data?.roofFlashingColorMode,
      roofFlashingColor: data.data?.roofFlashingColor,
      roofFlashingColorRal: data.data?.roofFlashingColorRal,
      garageFlashing: data.data?.garageFlashing,
      garageFlashingColorMode: data.data?.garageFlashingColorMode,
      garageFlashingColor: data.data?.garageFlashingColor,
      garageFlashingColorRal: data.data?.garageFlashingColorRal,
      automatic: data.data?.automatic,
      countAutomatic: data.data?.countAutomatic,
      filc: data.data?.filc,
      transport: data.data?.transport,
      wojewodztwo: data.data?.wojewodztwo,
    },
    price: data.price,
    imageURL: data.imageURL,
    pdf: pdfPayload,
  };

  fetch(wpApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(wpConfig.nonce ? { "X-WP-Nonce": wpConfig.nonce } : {}),
    },
    body: JSON.stringify(emailData),
  })
    .then(async (response) => {
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.message || result?.code || `HTTP error! status: ${response.status}`);
      }
      return result;
    })
    .then((result) => {
      if (result.success) {
        toast.success(toastCopy.sent, {
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
        });

        setTimeout(() => {
          const thankYouPath = resolveThankYouPath(wpConfig, lang);
          window.history.pushState({}, "", thankYouPath);
          window.dispatchEvent(new PopStateEvent("popstate"));
        }, 4000);
      } else {
        throw new Error(result.message || "Blad wysylania");
      }
    })
    .catch((error) => {
      console.error("FAILED...", error);
      toast.error(toastCopy.error + error.message, {
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
    });
}

export default SendEmailWP;
