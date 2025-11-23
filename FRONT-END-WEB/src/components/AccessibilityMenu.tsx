import React, { useState } from 'react';
import { useAccessibility } from '../contexts/AccessibilityContext.tsx';

export const AccessibilityMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    settings,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    toggleHighContrast,
    toggleGrayscale,
    toggleUnderlineLinks,
    toggleReducedMotion,
    resetSettings,
  } = useAccessibility();

  return (
    <>
      {/* Botón flotante de accesibilidad */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 shadow-lg flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300"
        aria-label="Abrir menú de accesibilidad"
        title="Opciones de Accesibilidad"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-7 w-7" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" 
          />
        </svg>
      </button>

      {/* Panel de opciones de accesibilidad */}
      {isOpen && (
        <>
          {/* Overlay para cerrar al hacer clic fuera */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          ></div>

          {/* Panel de opciones */}
          <div className="fixed bottom-24 right-6 z-50 bg-white rounded-lg shadow-2xl w-80 max-h-[80vh] overflow-y-auto">
            {/* Encabezado */}
            <div className="sticky top-0 bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" 
                  />
                </svg>
                <h3 className="font-bold text-lg">Accesibilidad</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200 transition-colors"
                aria-label="Cerrar menú"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M6 18L18 6M6 6l12 12" 
                  />
                </svg>
              </button>
            </div>

            {/* Contenido del panel */}
            <div className="p-4 space-y-4">
              {/* Control de tamaño de fuente */}
              <div className="border-b pb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tamaño de Fuente
                </label>
                <div className="flex items-center justify-between">
                  <button
                    onClick={decreaseFontSize}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={settings.fontSize <= 80}
                    aria-label="Reducir tamaño de fuente"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  
                  <span className="text-lg font-medium text-gray-700">
                    {settings.fontSize}%
                  </span>
                  
                  <button
                    onClick={increaseFontSize}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={settings.fontSize >= 200}
                    aria-label="Aumentar tamaño de fuente"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
                <button
                  onClick={resetFontSize}
                  className="mt-2 w-full text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Restablecer tamaño
                </button>
              </div>

              {/* Alto contraste */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                  <label className="text-sm font-medium text-gray-700">
                    Alto Contraste
                  </label>
                </div>
                <button
                  onClick={toggleHighContrast}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.highContrast ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                  role="switch"
                  aria-checked={settings.highContrast}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.highContrast ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Escala de grises */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <label className="text-sm font-medium text-gray-700">
                    Escala de Grises
                  </label>
                </div>
                <button
                  onClick={toggleGrayscale}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.grayscale ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                  role="switch"
                  aria-checked={settings.grayscale}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.grayscale ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Subrayar enlaces */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <label className="text-sm font-medium text-gray-700">
                    Subrayar Enlaces
                  </label>
                </div>
                <button
                  onClick={toggleUnderlineLinks}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.underlineLinks ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                  role="switch"
                  aria-checked={settings.underlineLinks}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.underlineLinks ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Reducir movimiento */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <label className="text-sm font-medium text-gray-700">
                    Reducir Movimiento
                  </label>
                </div>
                <button
                  onClick={toggleReducedMotion}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.reducedMotion ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                  role="switch"
                  aria-checked={settings.reducedMotion}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.reducedMotion ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Botón de restablecer todo */}
              <button
                onClick={resetSettings}
                className="w-full mt-4 bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Restablecer Todo
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};
