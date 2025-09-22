import React from 'react';

const TestPage: React.FC = () => {
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <h1 style={{ color: '#333', fontSize: '24px' }}>
        🎯 Sistema de Consulta de Procesos Judiciales
      </h1>
      <p style={{ color: '#666' }}>
        La aplicación se está cargando correctamente. 
        Esta es una página de prueba simple.
      </p>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        marginTop: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2>Estado del Sistema:</h2>
        <ul>
          <li>✅ Frontend funcionando</li>
          <li>✅ React cargado</li>
          <li>✅ Componentes preparados</li>
        </ul>
      </div>
    </div>
  );
};

export default TestPage;