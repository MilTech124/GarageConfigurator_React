import React from "react";

function resolveThankYouLang(wpConfig, currentPath) {
  if (currentPath === (wpConfig.thankYouPathCs || "/dekujeme") || wpConfig.lang === "cs") {
    return "cs";
  }
  if (currentPath === (wpConfig.thankYouPathSl || "/dakujeme") || wpConfig.lang === "sl") {
    return "sl";
  }
  if (currentPath === (wpConfig.thankYouPathHu || "/koszonjuk") || wpConfig.lang === "hu") {
    return "hu";
  }
  return "pl";
}

function ThankYou() {
  const wpConfig = window.__CONFIGURATOR_PLUGIN__ || {};
  const siteUrl = wpConfig.siteUrl || window.location.origin;
  const currentPath = window.location.pathname;
  const lang = resolveThankYouLang(wpConfig, currentPath);

  const textByLang = {
    pl: {
      title: "Konfigurator",
      thanks: "Dziekujemy!",
      line1: "Twoj garaz zostal wyslany do wyceny.",
      line2: "Postaramy sie odezwac jak najszybciej.",
      home: "Strona glowna",
      newConfig: "Nowa konfiguracja",
      footer: "Jesli masz pytania, skontaktuj sie z nami przez strone glowna.",
    },
    cs: {
      title: "Konfigurator",
      thanks: "Dekujeme!",
      line1: "Vase konfigurace garaze byla odeslana k naceneni.",
      line2: "Ozveme se vam co nejdrive.",
      home: "Hlavni stranka",
      newConfig: "Nova konfigurace",
      footer: "Pokud mate dotazy, kontaktujte nas pres hlavni stranku.",
    },
    sl: {
      title: "Konfigurator",
      thanks: "Dakujeme!",
      line1: "Vasa konfiguracia garaze bola odoslana na nacenenie.",
      line2: "Ozveme sa vam co najskor.",
      home: "Hlavna stranka",
      newConfig: "Nova konfiguracia",
      footer: "Ak mate otazky, kontaktujte nas cez hlavnu stranku.",
    },
    hu: {
      title: "Konfigurator",
      thanks: "Koszonjuk!",
      line1: "A garaz konfiguraciojat elkuldtuk arajanlat keszitesre.",
      line2: "Hamarosan felvesszuk Onnel a kapcsolatot.",
      home: "Fooldal",
      newConfig: "Uj konfiguracio",
      footer: "Ha kerdese van, lepjen kapcsolatba velunk a fooldalon keresztul.",
    },
  };

  const text = textByLang[lang] ?? textByLang.pl;

  return (
    <div className="bg-slate-200 min-h-screen flex items-center justify-center">
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-lg text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">{text.title}</h1>
          <div className="w-24 h-1 bg-blue-500 mx-auto"></div>
        </div>

        <div className="mb-8">
          <div className="text-6xl mb-4">OK</div>
          <h2 className="text-3xl font-bold text-slate-800 mb-4">{text.thanks}</h2>
          <p className="text-lg text-slate-600 mb-6">{text.line1}</p>
          <p className="text-lg text-slate-600 mb-8">{text.line2}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href={siteUrl}
            className="inline-block bg-slate-800 text-white px-8 py-3 rounded-lg font-semibold hover:bg-slate-700 transition-colors duration-200"
          >
            {text.home}
          </a>
          <button
            onClick={() => (window.location.href = "/")}
            className="inline-block bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors duration-200"
          >
            {text.newConfig}
          </button>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200">
          <p className="text-sm text-slate-500">{text.footer}</p>
        </div>
      </div>
    </div>
  );
}

export default ThankYou;
