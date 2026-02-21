import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Gavel,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Search,
  ShieldCheck,
  Building2
} from 'lucide-react';

export const PublicFooter: React.FC = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: 'Plataforma',
      links: [
        { label: 'Inicio', onClick: () => navigate('/') },
        { label: 'Panel de Control', onClick: () => navigate('/dashboard') },
        { label: 'Mis Procesos', onClick: () => navigate('/my-processes') },
        { label: 'Analítica', onClick: () => navigate('/analytics') },
      ]
    },
    {
      title: 'Legal',
      links: [
        { label: 'Términos de Servicio', onClick: () => { } },
        { label: 'Protección de Datos', onClick: () => { } },
        { label: 'Seguridad Legal', onClick: () => { } },
        { label: 'Cookies', onClick: () => { } },
      ]
    },
    {
      title: 'Soporte',
      links: [
        { label: 'Centro de Ayuda', onClick: () => { } },
        { label: 'Contacto Directo', onClick: () => { } },
        { label: 'Estado del Sistema', onClick: () => { } },
      ]
    }
  ];

  return (
    <footer className="bg-primary-900 text-white pt-20 pb-10 border-t border-accent-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-16">
          {/* Brand Section */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center gap-3">
              <img src="/logo_justitrack.png" alt="JustiTrack" className="h-12 w-auto" />
              <div className="h-8 w-px bg-white/20 mx-2"></div>
              <span className="text-lg font-serif tracking-widest text-accent-500 uppercase">JustiTrack</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed max-w-sm">
              Potenciando la transparencia judicial en Colombia con tecnología de vanguardia.
              Consultas en tiempo real, monitoreo inteligente y reportes ejecutivos.
            </p>
            <div className="flex gap-4">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                <button
                  key={i}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-accent-500 hover:text-primary-900 transition-all active:scale-95 border border-white/10"
                >
                  <Icon size={18} />
                </button>
              ))}
            </div>
          </div>

          {/* Links Sections */}
          {footerLinks.map((section, idx) => (
            <div key={idx} className="lg:col-span-2 space-y-6">
              <h4 className="text-[10px] font-bold text-accent-500 uppercase tracking-[0.2em]">{section.title}</h4>
              <ul className="space-y-4">
                {section.links.map((link, i) => (
                  <li key={i}>
                    <button
                      onClick={link.onClick}
                      className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2 group"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-500 scale-0 group-hover:scale-100 transition-transform"></div>
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact Section */}
          <div className="lg:col-span-2 space-y-6">
            <h4 className="text-[10px] font-bold text-accent-500 uppercase tracking-[0.2em]">Oficinas Centrales</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-accent-500 shrink-0 mt-0.5" />
                <span className="text-sm text-gray-400">Bogotá D.C., Colombia<br />Edificio Alpha, Calle 100</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-accent-500 shrink-0" />
                <span className="text-sm text-gray-400">contacto@justitrack.co</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-accent-500 shrink-0" />
                <span className="text-sm text-gray-400">+57 (601) 555-0123</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Badges/Certifications Overlay Idea */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-10 border-y border-white/5 mb-10">
          {[
            { icon: ShieldCheck, label: 'Seguridad Bancaria', sub: 'Encriptación AES-256' },
            { icon: Building2, label: 'Oficialía Judicial', sub: 'Datos Rama Judicial' },
            { icon: Search, label: 'Forense Digital', sub: 'Certificación de Integridad' },
            { icon: Gavel, label: 'Estándar Legal', sub: 'Cumplimiento Normativo' },
          ].map((badge, i) => (
            <div key={i} className="flex items-center gap-4 opacity-50 hover:opacity-100 transition-opacity">
              <badge.icon className="text-accent-500" size={32} />
              <div>
                <p className="text-[10px] font-bold text-white uppercase tracking-widest">{badge.label}</p>
                <p className="text-[9px] text-gray-500">{badge.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs text-gray-500">
            © {currentYear} JustiTrack Legal Tech. Reservados todos los derechos.{' '}
            <span className="text-gray-400">
              - Desarrollado por{' '}
              <a href="https://portafolio-santiago-duarte.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-accent-500 hover:text-white transition-colors">
                Santiago Duarte
              </a>
            </span>
          </p>
          <div className="flex items-center gap-8 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success-500"></div>
              <span>Sistemas Online</span>
            </div>
            <p>Versión 4.2.0-PRO</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
