import React from 'react';

function ThankYou() {
  return (
    <div className="bg-slate-200 min-h-screen flex items-center justify-center">
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-lg text-center">
        {/* Logo/Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">NewGarage</h1>
          <div className="w-24 h-1 bg-blue-500 mx-auto"></div>
        </div>

        {/* Thank you message */}
        <div className="mb-8">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-3xl font-bold text-slate-800 mb-4">Dziękujemy!</h2>
          <p className="text-lg text-slate-600 mb-6">
            Twój garaż został wysłany do wyceny. 
          </p>
          <p className="text-lg text-slate-600 mb-8">
            Postaramy się odezwać jak najwcześniej.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a 
            href="https://newgarage.pl/" 
            className="inline-block bg-slate-800 text-white px-8 py-3 rounded-lg font-semibold hover:bg-slate-700 transition-colors duration-200"
          >
            Strona główna
          </a>
          <button 
            onClick={() => window.location.href = '/'}
            className="inline-block bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors duration-200"
          >
            Nowa konfiguracja
          </button>
        </div>

        {/* Additional info */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <p className="text-sm text-slate-500">
            Jeśli masz pytania, skontaktuj się z nami przez stronę główną.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ThankYou;
