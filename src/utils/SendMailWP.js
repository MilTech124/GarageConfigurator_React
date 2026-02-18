import { toast } from "react-toastify";

function resolveThankYouPath(wpConfig, lang) {
  if (lang === "cs") {
    return wpConfig.thankYouPathCs || "/dekujeme";
  }
  return wpConfig.thankYouPathPl || wpConfig.thankYouPath || "/dziekujemy";
}

// Send inquiry to WordPress REST API
function SendEmailWP(data, templateType = "default", lang = "pl") {
  const wpConfig = window.__CONFIGURATOR_PLUGIN__ || {};
  const wpApiUrl =
    wpConfig.inquiryEndpoint ||
    `${window.location.origin}/wp-json/configurator/v1/inquiry`;

  toast.info("Wysylanie wiadomosci", {
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
  });

  const emailData = {
    template_type: templateType,
    contact: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      wojewodztwo: data.wojewodztwo,
      address: data.address,
      message: data.message || "",
    },
    garage_config: {
      width: data.data?.width,
      depth: data.data?.depth,
      height: data.data?.height,
      color: data.data?.color,
      emboss: data.data?.emboss,
      direction: data.data?.direction,
      roof: data.data?.roof,
      roofColor: data.data?.roofColor,
      roofType: data.data?.roofType,
      gateCount: data.data?.gateCount,
      gateType1: data.data?.gateType1,
      gateColor1: data.data?.gateColor1,
      gateWidth1: data.data?.gateWidth1,
      gateHeight1: data.data?.gateHeight1,
      gateType2: data.data?.gateType2,
      gateColor2: data.data?.gateColor2,
      gateWidth2: data.data?.gateWidth2,
      gateHeight2: data.data?.gateHeight2,
      gateType3: data.data?.gateType3,
      gateColor3: data.data?.gateColor3,
      gateWidth3: data.data?.gateWidth3,
      gateHeight3: data.data?.gateHeight3,
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
      automatic: data.data?.automatic,
      countAutomatic: data.data?.countAutomatic,
      filc: data.data?.filc,
      transport: data.data?.transport,
    },
    price: data.price,
    imageURL: data.imageURL,
  };

  fetch(wpApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(wpConfig.nonce ? { "X-WP-Nonce": wpConfig.nonce } : {}),
    },
    body: JSON.stringify(emailData),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((result) => {
      if (result.success) {
        toast.success("Wyslano wiadomosc", {
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
      toast.error("Blad wysylania wiadomosci: " + error.message, {
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
    });
}

export default SendEmailWP;
