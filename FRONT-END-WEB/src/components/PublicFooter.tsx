import React from 'react';

export const PublicFooter: React.FC = () => (
  <footer className="bg-secondary-900 text-white py-10 mt-16">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center space-y-6">
        <img src="/logo_justitrack.png" alt="JustiTrack" className="h-16 w-auto" />
        <p className="text-sm text-white/80 text-center max-w-2xl">
          Sistema desarrollado para la consulta y seguimiento de procesos judiciales en Colombia.
          Accede a información oficial de manera segura y centralizada.
        </p>
        <div className="flex flex-wrap justify-center gap-6">
          <img src="/consultar.png" alt="Consultas" className="h-10 w-10 object-contain" />
          <img src="/misProcesos.png" alt="Procesos" className="h-10 w-10 object-contain" />
          <img src="/notificaciones.png" alt="Notificaciones" className="h-10 w-10 object-contain" />
          <img src="/usuario.png" alt="Usuarios" className="h-10 w-10 object-contain" />
        </div>
      </div>
    </div>
  </footer>
);

export default PublicFooter;
