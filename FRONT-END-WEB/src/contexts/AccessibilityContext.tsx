import React, { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilitySettings {
  fontSize: number; // Tamaño de fuente en porcentaje (100 = normal)
  highContrast: boolean;
  grayscale: boolean;
  underlineLinks: boolean;
  reducedMotion: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetFontSize: () => void;
  toggleHighContrast: () => void;
  toggleGrayscale: () => void;
  toggleUnderlineLinks: () => void;
  toggleReducedMotion: () => void;
  resetSettings: () => void;
}

const defaultSettings: AccessibilitySettings = {
  fontSize: 100,
  highContrast: false,
  grayscale: false,
  underlineLinks: false,
  reducedMotion: false,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    // Cargar configuración guardada del localStorage
    const saved = localStorage.getItem('accessibilitySettings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  // Guardar configuración en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('accessibilitySettings', JSON.stringify(settings));
  }, [settings]);

  // Aplicar estilos al documento
  useEffect(() => {
    const root = document.documentElement;
    
    // Aplicar tamaño de fuente
    root.style.fontSize = `${settings.fontSize}%`;
    
    // Aplicar alto contraste
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Aplicar escala de grises
    if (settings.grayscale) {
      root.classList.add('grayscale');
    } else {
      root.classList.remove('grayscale');
    }
    
    // Aplicar subrayado de enlaces
    if (settings.underlineLinks) {
      root.classList.add('underline-links');
    } else {
      root.classList.remove('underline-links');
    }
    
    // Aplicar movimiento reducido
    if (settings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
  }, [settings]);

  const increaseFontSize = () => {
    setSettings(prev => ({
      ...prev,
      fontSize: Math.min(prev.fontSize + 10, 200) // Máximo 200%
    }));
  };

  const decreaseFontSize = () => {
    setSettings(prev => ({
      ...prev,
      fontSize: Math.max(prev.fontSize - 10, 80) // Mínimo 80%
    }));
  };

  const resetFontSize = () => {
    setSettings(prev => ({
      ...prev,
      fontSize: 100
    }));
  };

  const toggleHighContrast = () => {
    setSettings(prev => ({
      ...prev,
      highContrast: !prev.highContrast
    }));
  };

  const toggleGrayscale = () => {
    setSettings(prev => ({
      ...prev,
      grayscale: !prev.grayscale
    }));
  };

  const toggleUnderlineLinks = () => {
    setSettings(prev => ({
      ...prev,
      underlineLinks: !prev.underlineLinks
    }));
  };

  const toggleReducedMotion = () => {
    setSettings(prev => ({
      ...prev,
      reducedMotion: !prev.reducedMotion
    }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        increaseFontSize,
        decreaseFontSize,
        resetFontSize,
        toggleHighContrast,
        toggleGrayscale,
        toggleUnderlineLinks,
        toggleReducedMotion,
        resetSettings,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};
