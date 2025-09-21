import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Consulta de Procesos Judiciales
        </h1>
        <p className="text-gray-600 mb-4">
          ¡Excelente! El servidor está funcionando correctamente. 
          La aplicación está en desarrollo.
        </p>
        <div className="mt-4">
          <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Comenzar
          </button>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          <p>🎉 React está funcionando</p>
          <p>🎨 Tailwind CSS está funcionando</p>
          <p>🔥 Hot reload está funcionando</p>
        </div>
      </div>
    </div>
  );
}

const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);