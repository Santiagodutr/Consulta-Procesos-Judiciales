import React from 'react';
import { HelpCircle } from 'lucide-react';

interface HelpButtonProps {
  onClick: () => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  showNotification?: boolean;
}

export const HelpButton: React.FC<HelpButtonProps> = ({ 
  onClick, 
  position = 'top-right',
  showNotification = true
}) => {
  const positionClasses = {
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
    'bottom-right': 'bottom-24 right-6',
    'bottom-left': 'bottom-24 left-6',
  };

  return (
    <button
      onClick={onClick}
      className={`fixed ${positionClasses[position]} z-40 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full w-14 h-14 shadow-lg flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300 hover:scale-110 group`}
      aria-label="Iniciar tour guiado"
      title="Ayuda - Tour Guiado"
      data-tour-help-button
    >
      <HelpCircle className="h-7 w-7 group-hover:rotate-12 transition-transform duration-200" />
      
      {showNotification && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
        </span>
      )}
    </button>
  );
};
