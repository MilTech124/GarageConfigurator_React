import React from "react";

function ThankYou() {
  const wpConfig = window.__CONFIGURATOR_PLUGIN__ || {};
  const siteUrl = wpConfig.siteUrl || window.location.origin;
  const currentPath = window.location.pathname;
  const lang =
    currentPath === (wpConfig.thankYouPathCs || "/dekujeme") || wpConfig.lang === "cs"
      ? "cs"
      : "pl";

  const text =
    lang === "cs"
      ? {
          title: "Konfigurator",
          thanks: "Dìkujeme!",
          line1: "Vaše konfigurace garáže byla odeslána k nacenìní.",
          line2: "Ozveme se vám co nejdøíve.",
          home: "Hlavní stránka",
          newConfig: "Nová konfigurace",
          footer: "Pokud máte dotazy, kontaktujte nás pøes hlavní stránku.",
        }
      : {
          title: "Konfigurator",
          thanks: "Dziêkujemy!",
          line1: "Twój gara¿ zosta³ wys³any do wyceny.",
          line2: "Postaramy siê odezwaæ jak najszybciej.",
          home: "Strona g³ówna",
          newConfig: "Nowa konfiguracja",
          footer: "Jeœli masz pytania, skontaktuj siê z nami przez stronê g³ówn¹.",
        };

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
