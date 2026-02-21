import React from 'react';
import { PublicFooter } from '../components/PublicFooter.tsx';

export const WelcomePage: React.FC = () => {
    return (
        <div className="min-h-screen bg-primary-900 text-white font-sans overflow-x-hidden selection:bg-accent-500 selection:text-white">
            {/* Background Ambience */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary-900 via-primary-800 to-primary-900 opacity-90"></div>
                <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-accent-600/10 blur-[100px] animate-float"></div>
                <div className="absolute top-[20%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px] animate-float" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                {/* Header */}
                <header className="w-full py-6 px-4 sm:px-6 lg:px-8 border-b border-white/5 backdrop-blur-sm fixed top-0 z-50 transition-all duration-300">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <img src="/logo_justitrack.png" alt="JustiTrack" className="h-10 w-auto" />
                            {/* Optional: Add text logo if needed */}
                            {/* <span className="text-xl font-serif tracking-widest text-white">JUSTITRACK</span> */}
                        </div>
                        <div className="flex items-center gap-4">
                            <a
                                href="/login"
                                className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
                            >
                                Ingresar
                            </a>
                            <a
                                href="/register"
                                className="px-5 py-2 text-sm font-medium text-primary-900 bg-accent-400 hover:bg-accent-300 rounded-sm transition-all shadow-[0_0_15px_rgba(212,187,108,0.3)] hover:shadow-[0_0_20px_rgba(212,187,108,0.5)]"
                            >
                                Registrarse
                            </a>
                        </div>
                    </div>
                </header>

                {/* Hero Section */}
                <main className="flex-grow flex items-center justify-center pt-24 pb-12 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-5xl mx-auto w-full text-center space-y-12">

                        <div className="space-y-6 animate-fade-in">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent-500/30 bg-accent-500/10 text-accent-300 text-xs tracking-widest uppercase font-semibold mb-4">
                                <span className="w-2 h-2 rounded-full bg-accent-400 animate-pulse"></span>
                                Plataforma Oficial de Consulta
                            </div>

                            <h1 className="text-5xl md:text-7xl font-serif font-bold text-white tracking-tight leading-tight">
                                Justicia Digital, <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-200 via-accent-400 to-accent-200 animate-gradient-x">
                                    Al Alcance de un Clic
                                </span>
                            </h1>

                            <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-300/90 font-light leading-relaxed">
                                Accede de forma rápida, segura y centralizada a la información actualizada de
                                procesos judiciales en Colombia. Sincronización directa con la Rama Judicial.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
                            <a
                                href="/login"
                                className="group relative px-8 py-4 bg-transparent overflow-hidden rounded-sm transition-all"
                            >
                                <div className="absolute inset-0 w-full h-full bg-accent-500/20 group-hover:bg-accent-500/30 transition-all border border-accent-500/50"></div>
                                <div className="relative flex items-center gap-3">
                                    <span className="text-accent-100 font-semibold tracking-wide group-hover:text-white transition-colors">INICIAR SESIÓN</span>
                                    <svg className="w-5 h-5 text-accent-300 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </div>
                            </a>

                            <a
                                href="/register"
                                className="group px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-sm backdrop-blur-sm transition-all"
                            >
                                <span className="text-white/90 font-medium tracking-wide group-hover:text-white">Crear cuenta gratuita</span>
                            </a>
                        </div>

                        {/* Feature Cards */}
                        <div className="grid md:grid-cols-3 gap-6 pt-16 text-left animate-slide-up" style={{ animationDelay: '0.4s' }}>
                            {[
                                {
                                    icon: "/consultar.png",
                                    title: "Consultas Directas",
                                    desc: "Información en tiempo real desde el portal oficial de la Rama Judicial."
                                },
                                {
                                    icon: "/analyitics.png",
                                    title: "Historial Completo",
                                    desc: "Mantén un registro de todas tus consultas y procesos de interés."
                                },
                                {
                                    icon: "/lock.png",
                                    title: "Seguridad Garantizada",
                                    desc: "Acceso seguro con autenticación y auditoría de protección de datos."
                                }
                            ].map((item, idx) => (
                                <div
                                    key={idx}
                                    className="group p-8 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 hover:border-accent-500/30 transition-all duration-300 hover:-translate-y-1"
                                >
                                    <div className="w-14 h-14 bg-primary-800/50 rounded-lg flex items-center justify-center mb-6 border border-white/5 group-hover:border-accent-500/30 transition-all">
                                        <img src={item.icon} alt={item.title} className="h-8 w-8 object-contain opacity-80 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <h3 className="text-xl font-serif text-white mb-3 group-hover:text-accent-300 transition-colors">{item.title}</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed group-hover:text-gray-300 transition-colors">
                                        {item.desc}
                                    </p>
                                </div>
                            ))}
                        </div>

                    </div>
                </main>

                <PublicFooter />
            </div>
        </div>
    );
};
