import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Clock,
  ChevronRight,
  User,
  Gavel
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { judicialAPI, notificationAPI } from '../services/apiService.ts';
import { PublicFooter } from '../components/PublicFooter.tsx';
import { Header } from '../components/Header.tsx';
import { useTour } from '../hooks/useTour.ts';
import { HelpButton } from '../components/HelpButton.tsx';
import { dashboardTourSteps } from '../tours/dashboardTour.ts';

interface ConsultationHistoryItem {
  consultation_id: string;
  process_id: string;
  numero_radicacion: string;
  despacho: string;
  demandante: string;
  demandado: string;
  consulted_at: string;
}

export const SimpleDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [consultationHistory, setConsultationHistory] = useState<ConsultationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const { startTour, hasCompletedTour } = useTour(dashboardTourSteps, 'dashboard');

  useEffect(() => {
    loadConsultationHistory();
    loadUnreadNotifications();
  }, []);

  const loadConsultationHistory = async () => {
    try {
      setLoading(true);
      const response = await judicialAPI.getConsultationHistory(10);
      if (response.success && response.data) {
        setConsultationHistory(response.data);
      }
    } catch (error) {
      console.error('Error loading consultation history:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadNotifications = async () => {
    try {
      const response = await notificationAPI.getUnreadNotifications(50);
      if (response?.success && Array.isArray(response.data)) {
        setUnreadNotifications(response.data.length);
      }
    } catch (error) {
      console.error('Error loading unread notifications:', error);
    }
  };

  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Usuario';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header title="Dashboard Administrativo" showBack={false} />

      {/* Hero Banner Section */}
      <div className="bg-primary-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&q=80')] opacity-5 bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900 via-primary-900/90 to-transparent"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 relative z-10">
          <div className="max-w-2xl animate-fade-in">
            <h2 className="text-accent-400 font-bold uppercase tracking-[0.3em] text-xs mb-4">Portal Profesional</h2>
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 leading-tight">
              Bienvenido, {user?.first_name || 'Colega'}
            </h1>
            <p className="text-white/60 text-lg md:text-xl font-light leading-relaxed mb-10">
              Administre sus procesos, monitoree actuaciones y optimice su práctica legal con nuestra tecnología de sincronización avanzada.
            </p>
            <div className="flex flex-wrap gap-4" data-tour="quick-actions">
              <button
                onClick={() => navigate('/consulta')}
                className="bg-accent-500 text-primary-900 px-8 py-4 rounded-2xl font-bold text-sm hover:bg-white transition-all shadow-2xl shadow-accent-500/20 active:scale-95"
              >
                Nueva Consulta
              </button>
              <button
                onClick={() => navigate('/processes')}
                className="bg-white/10 text-white border border-white/20 backdrop-blur-sm px-8 py-4 rounded-2xl font-bold text-sm hover:bg-white/20 transition-all active:scale-95"
              >
                Ver Mi Portafolio
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent History Section */}
          <section className="lg:col-span-2 space-y-8 animate-fade-in-up" data-tour="history-table">
            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-primary-900">Actividad Reciente</h2>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Últimos procesos consultados</p>
                </div>
                <button
                  onClick={() => navigate('/processes')}
                  className="text-xs font-bold text-accent-600 hover:text-primary-900 uppercase tracking-widest underline decoration-accent-500/30 underline-offset-8"
                >
                  Ver todo el historial
                </button>
              </div>

              {loading ? (
                <div className="p-20 flex flex-col items-center justify-center text-gray-400 bg-gray-50/30">
                  <div className="animate-spin mb-4">
                    <Gavel size={40} className="text-accent-500" />
                  </div>
                  <p className="font-serif italic">Sincronizando con bases de datos públicas...</p>
                </div>
              ) : consultationHistory.length === 0 ? (
                <div className="p-20 text-center bg-gray-50/30">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-medium">No hay consultas recientes registradas.</p>
                  <button onClick={() => navigate('/consulta')} className="mt-4 text-accent-600 font-bold text-sm">Realizar primera búsqueda</button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50/50">
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Radicación</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Despacho / Partes</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fecha Consulta</th>
                        <th className="px-6 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {consultationHistory.map((item) => (
                        <tr key={item.consultation_id} className="group hover:bg-primary-50/30 transition-colors">
                          <td className="px-6 py-5">
                            <span className="px-3 py-1 bg-primary-50 text-primary-900 text-xs font-bold font-mono rounded-md ring-1 ring-primary-100">
                              {item.numero_radicacion}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="max-w-xs">
                              <p className="text-sm font-bold text-primary-900 truncate mb-1">{item.despacho}</p>
                              <p className="text-xs text-gray-500 truncate italic">
                                {item.demandante ? `Demandante: ${item.demandante}` : 'Sin datos de demandante'}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="text-xs font-bold text-primary-900 font-mono">
                              {new Date(item.consulted_at).toLocaleDateString()}
                            </div>
                            <div className="text-[10px] text-gray-400">
                              {new Date(item.consulted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <button
                              onClick={() => navigate(`/process/${item.numero_radicacion}`)}
                              className="p-2 text-gray-300 group-hover:text-accent-500 hover:bg-white rounded-lg transition-all"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          {/* User Details Sidebar */}
          <aside className="space-y-8 animate-fade-in" data-tour="user-info">
            <h2 className="text-2xl font-serif font-bold text-primary-900 border-b-2 border-accent-400 pb-1 inline-block">
              Perfil de Usuario
            </h2>

            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
              <div className="bg-primary-900 p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-accent-500/10 rounded-full -mr-12 -mt-12"></div>
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-accent-500 rounded-3xl flex items-center justify-center text-primary-900 shadow-xl mx-auto mb-4 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                    <User className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-serif font-bold text-white mb-1">{displayName}</h3>
                  <p className="text-accent-400 text-xs font-bold uppercase tracking-widest">{user?.user_type || 'Abogado'}</p>
                </div>
              </div>

              <div className="p-8 space-y-6">
                {[
                  { label: 'Email', value: user?.email, icon: <Bell className="w-4 h-4" /> },
                  { label: 'Estado de Cuenta', value: 'Activo / Certificado', icon: <Gavel className="w-4 h-4" /> },
                  { label: 'Último Acceso', value: new Date().toLocaleDateString(), icon: <Clock className="w-4 h-4" /> }
                ].map((field, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="mt-1 p-2 bg-gray-50 text-gray-400 rounded-lg">
                      {field.icon}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{field.label}</p>
                      <p className="text-sm font-bold text-primary-900">{field.value}</p>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => navigate('/profile')}
                  className="w-full mt-4 py-3 bg-gray-50 text-primary-900 text-sm font-bold rounded-xl border border-gray-200 hover:bg-gray-100 hover:border-accent-500 transition-all"
                >
                  Gestionar Perfil
                </button>
              </div>
            </div>

            {/* General Stats Box */}
            <div className="bg-accent-500 rounded-3xl p-8 shadow-xl shadow-accent-500/20 relative overflow-hidden group">
              <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative z-10">
                <h4 className="text-primary-900 font-serif font-bold text-lg mb-2">Resumen General</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-primary-900/60 uppercase mb-1">Total Consultas</p>
                    <p className="text-2xl font-bold text-primary-900">{consultationHistory.length}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-primary-900/60 uppercase mb-1">Alertas</p>
                    <p className="text-2xl font-bold text-primary-900">{unreadNotifications}</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <HelpButton onClick={startTour} showNotification={!hasCompletedTour} />
      <PublicFooter />
    </div>
  );
};

export default SimpleDashboard;