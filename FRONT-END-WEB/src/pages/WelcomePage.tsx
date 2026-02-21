import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    ArrowRight,
    Search,
    History,
    ShieldCheck,
    ChevronRight,
    Globe,
    Bell,
    Scale
} from 'lucide-react';
import { PublicFooter } from '../components/PublicFooter.tsx';

export const WelcomePage: React.FC = () => {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-primary-900 text-white font-sans overflow-x-hidden selection:bg-accent-500 selection:text-white">
            {/* Background Ambience & Depth */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#1e293b_0%,#0f172a_100%)]"></div>

                {/* Animated Orbs */}
                <div className="absolute -top-[10%] -right-[5%] w-[60%] h-[60%] rounded-full bg-accent-600/5 blur-[120px] animate-pulse"></div>
                <div className="absolute top-[40%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px] animate-float" style={{ animationDelay: '2s' }}></div>

                {/* Subtle Grid Pattern */}
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                {/* Header */}
                <header className="w-full py-8 px-6 sm:px-12 border-b border-white/5 backdrop-blur-md fixed top-0 z-50 transition-all duration-300">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
                            <div className="flex flex-col">
                                <span className="text-xl font-serif font-bold tracking-tight text-white leading-none">Justi<span className="text-accent-400">Track</span></span>
                                <span className="text-[9px] uppercase tracking-[0.3em] text-accent-500/60 font-bold">Rama Judicial</span>
                            </div>
                        </div>

                        <nav className="hidden md:flex items-center gap-10">
                            <a href="#features" className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-accent-400 transition-colors">Características</a>
                            <Link to="/about" className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-accent-400 transition-colors">Nosotros</Link>
                        </nav>

                        <div className="flex items-center gap-6">
                            <a
                                href="/login"
                                className="text-xs font-bold uppercase tracking-widest text-gray-300 hover:text-white transition-colors border-b border-transparent hover:border-accent-500 pb-1"
                            >
                                Ingresar
                            </a>
                            <a
                                href="/register"
                                className="group relative px-6 py-3 overflow-hidden rounded-xl transition-all"
                            >
                                <div className="absolute inset-0 bg-accent-500 group-hover:bg-accent-400 transition-colors"></div>
                                <div className="relative flex items-center gap-2 text-primary-900 text-xs font-bold uppercase tracking-widest">
                                    Registrarse
                                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </div>
                            </a>
                        </div>
                    </div>
                </header>

                {/* Hero Section */}
                <main className="flex-grow flex flex-col items-center justify-center pt-48 pb-24 px-6 md:px-12">
                    <div className="max-w-6xl mx-auto w-full text-center space-y-16">

                        <div className="space-y-8 animate-fade-in">
                            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-accent-500/20 bg-accent-500/5 text-accent-400 text-[10px] tracking-[0.2em] uppercase font-bold mb-4 shadow-inner">
                                <div className="flex -space-x-2">
                                    <div className="w-2 h-2 rounded-full bg-accent-500 animate-ping"></div>
                                    <div className="w-2 h-2 rounded-full bg-accent-500"></div>
                                </div>
                                Portal de Inteligencia Judicial v2.0
                            </div>

                            <h1 className="text-6xl md:text-8xl font-serif font-bold text-white tracking-tight leading-[0.9] md:leading-[1]">
                                Justicia Digital <br />
                                <span className="relative inline-block mt-4">
                                    <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-accent-200 via-accent-400 to-accent-200 animate-gradient-x italic">
                                        Simplificada.
                                    </span>
                                    <div className="absolute -bottom-2 md:-bottom-4 left-0 w-full h-1 md:h-2 bg-accent-500/20 blur-sm"></div>
                                </span>
                            </h1>

                            <p className="max-w-2xl mx-auto text-lg md:text-2xl text-gray-400 font-light leading-relaxed">
                                Monitoree sus procesos en tiempo real con la plataforma más avanzada de <span className="text-white font-medium italic underline decoration-accent-500/50 underline-offset-8">automatización legal</span> en Colombia.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-8 justify-center items-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
                            <a
                                href="/login"
                                className="group relative w-full sm:w-auto px-10 py-5 bg-primary-900 overflow-hidden rounded-2xl transition-all shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:shadow-accent-500/10 hover:shadow-2xl"
                            >
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-accent-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="absolute inset-0 border border-accent-500/30 rounded-2xl group-hover:border-accent-500/60 transition-colors"></div>
                                <div className="relative flex items-center justify-center gap-4">
                                    <span className="text-accent-400 font-bold tracking-[0.2em] text-xs uppercase group-hover:text-accent-300 transition-colors">EMPEZAR AHORA</span>
                                    <ArrowRight size={18} className="text-accent-500 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </a>

                            <a
                                href="/register"
                                className="group w-full sm:w-auto px-10 py-5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl backdrop-blur-sm transition-all text-xs font-bold uppercase tracking-[0.2em] text-gray-300 hover:text-white"
                            >
                                Crear Portafolio Gratuito
                            </a>
                        </div>

                        {/* Feature Cards */}
                        <div id="features" className="grid md:grid-cols-3 gap-8 pt-24 text-left animate-slide-up" style={{ animationDelay: '0.4s' }}>
                            {[
                                {
                                    icon: <Search className="w-8 h-8" />,
                                    title: "Consultas Directas",
                                    label: "REAL-TIME SYNC",
                                    desc: "Conexión encriptada y directa con los servidores oficiales de la Rama Judicial para datos precisos.",
                                    color: "text-blue-400"
                                },
                                {
                                    icon: <History className="w-8 h-8" />,
                                    title: "Gestión Inteligente",
                                    label: "HISTORY TRACKING",
                                    desc: "Panel centralizado para administrar múltiples expedientes con alertas automáticas y analítica avanzada.",
                                    color: "text-accent-500"
                                },
                                {
                                    icon: <ShieldCheck className="w-8 h-8" />,
                                    title: "Seguridad Elite",
                                    label: "SECURE PROTOCOL",
                                    desc: "Protección de datos de nivel bancario con cifrado de extremo a extremo para su información legal.",
                                    color: "text-emerald-400"
                                }
                            ].map((item, idx) => (
                                <div
                                    key={idx}
                                    className="group relative p-10 rounded-[2.5rem] border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-500 hover:-translate-y-2 overflow-hidden"
                                >
                                    {/* Decorative background icon */}
                                    <div className="absolute -bottom-10 -right-10 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700 pointer-events-none scale-150">
                                        {item.icon}
                                    </div>

                                    <div className="space-y-6 relative z-10">
                                        <div className={`w-16 h-16 rounded-2xl bg-primary-800/80 flex items-center justify-center border border-white/5 group-hover:border-accent-500/30 transition-all duration-500 shadow-xl ${item.color}`}>
                                            {item.icon}
                                        </div>

                                        <div>
                                            <span className="text-[10px] font-bold tracking-[0.3em] text-accent-500/60 uppercase mb-2 block">{item.label}</span>
                                            <h3 className="text-2xl font-serif font-bold text-white mb-4 group-hover:text-accent-400 transition-colors">{item.title}</h3>
                                            <p className="text-gray-400 text-sm leading-relaxed font-light group-hover:text-gray-300 transition-colors">
                                                {item.desc}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Trust Section */}
                        <div className="pt-24 opacity-40 animate-fade-in" style={{ animationDelay: '0.6s' }}>
                            <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-gray-400 mb-12">Garantizando Transparencia Legal</p>
                            <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 grayscale group-hover:grayscale-0 transition-all duration-700">
                                <div className="flex items-center gap-2">
                                    <Scale size={20} />
                                    <span className="text-sm font-bold uppercase tracking-widest">Rama Judicial</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Globe size={20} />
                                    <span className="text-sm font-bold uppercase tracking-widest">Justicia Global</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Bell size={20} />
                                    <span className="text-sm font-bold uppercase tracking-widest">Alertas v2</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </main>

                <PublicFooter />
            </div>
        </div>
    );
};
