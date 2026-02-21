import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    ShieldCheck,
    Lightbulb,
    Target,
    Users,
    Award,
    ChevronRight
} from 'lucide-react';
import { PublicFooter } from '../components/PublicFooter.tsx';

export const AboutUsPage: React.FC = () => {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-primary-900 text-white font-sans overflow-x-hidden selection:bg-accent-500 selection:text-white">
            {/* Background Ambience & Depth */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,#1e293b_0%,#0f172a_100%)]"></div>

                {/* Animated Orbs */}
                <div className="absolute -top-[10%] -left-[5%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[120px] animate-pulse"></div>
                <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-accent-600/5 blur-[120px] animate-float" style={{ animationDelay: '1s' }}></div>

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
                            <Link to="/#features" className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-accent-400 transition-colors">Características</Link>
                            <Link to="/about" className="text-xs font-bold uppercase tracking-widest text-accent-400 hover:text-accent-300 transition-colors">Nosotros</Link>
                        </nav>

                        <div className="flex items-center gap-6">
                            <Link
                                to="/login"
                                className="text-xs font-bold uppercase tracking-widest text-gray-300 hover:text-white transition-colors border-b border-transparent hover:border-accent-500 pb-1"
                            >
                                Ingresar
                            </Link>
                            <Link
                                to="/register"
                                className="group relative px-6 py-3 overflow-hidden rounded-xl transition-all"
                            >
                                <div className="absolute inset-0 bg-accent-500 group-hover:bg-accent-400 transition-colors"></div>
                                <div className="relative flex items-center gap-2 text-primary-900 text-xs font-bold uppercase tracking-widest">
                                    Registrarse
                                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </div>
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-grow flex flex-col items-center justify-center pt-48 pb-24 px-6 md:px-12">
                    <div className="max-w-4xl mx-auto w-full space-y-20">

                        {/* Hero Section */}
                        <div className="text-center space-y-8 animate-fade-in">
                            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-accent-500/20 bg-accent-500/5 text-accent-400 text-[10px] tracking-[0.2em] uppercase font-bold mb-4 shadow-inner">
                                Nuestra Visión
                            </div>

                            <h1 className="text-5xl md:text-7xl font-serif font-bold text-white tracking-tight leading-[1]">
                                Innovando la <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-200 via-accent-400 to-accent-200 animate-gradient-x italic">
                                    Práctica Legal.
                                </span>
                            </h1>

                            <p className="text-lg md:text-xl text-gray-400 font-light leading-relaxed max-w-2xl mx-auto">
                                En JustiTrack, combinamos tecnología de vanguardia con experiencia jurídica para transformar la forma en que los profesionales del derecho gestionan su información.
                            </p>
                        </div>

                        {/* Values Grid */}
                        <div className="grid md:grid-cols-2 gap-8 pt-12 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                            {[
                                {
                                    icon: <Target className="w-8 h-8" />,
                                    title: "Misión",
                                    desc: "Democratizar y agilizar el acceso a la información judicial en Colombia mediante soluciones tecnológicas seguras e intuitivas."
                                },
                                {
                                    icon: <Award className="w-8 h-8" />,
                                    title: "Visión",
                                    desc: "Ser la plataforma líder en automatización legal de la región, estableciendo el estándar de oro en gestión de expedientes."
                                }
                            ].map((item, idx) => (
                                <div
                                    key={idx}
                                    className="group relative p-10 rounded-[2rem] border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-500 hover:-translate-y-1 overflow-hidden"
                                >
                                    <div className="absolute -bottom-10 -right-10 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-700 pointer-events-none scale-150">
                                        {item.icon}
                                    </div>
                                    <div className="space-y-6 relative z-10">
                                        <div className="w-16 h-16 rounded-2xl bg-primary-800/80 flex items-center justify-center border border-white/5 group-hover:border-accent-500/30 transition-all duration-500 shadow-xl text-accent-500">
                                            {item.icon}
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-serif font-bold text-white mb-4 group-hover:text-accent-400 transition-colors">{item.title}</h3>
                                            <p className="text-gray-400 text-sm leading-relaxed font-light group-hover:text-gray-300 transition-colors">
                                                {item.desc}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Our Principles */}
                        <div className="pt-16 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                            <h2 className="text-3xl font-serif font-bold text-white text-center mb-12">Nuestros Principios</h2>
                            <div className="grid md:grid-cols-3 gap-6">
                                {[
                                    { icon: <ShieldCheck />, title: "Integridad", desc: "Máxima confidencialidad y ética en el manejo de datos." },
                                    { icon: <Lightbulb />, title: "Innovación", desc: "Mejora continua y adaptación tecnológica constante." },
                                    { icon: <Users />, title: "Excelencia", desc: "Servicio premium orientado al éxito de nuestros clientes." }
                                ].map((item, idx) => (
                                    <div key={idx} className="p-8 rounded-2xl border border-white/5 bg-white/[0.01] text-center space-y-4 hover:border-accent-500/20 transition-colors">
                                        <div className="inline-flex p-3 rounded-xl bg-primary-800 text-accent-400">
                                            {item.icon}
                                        </div>
                                        <h4 className="text-lg font-bold text-white tracking-wide">{item.title}</h4>
                                        <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </main>

                <PublicFooter />
            </div>
        </div>
    );
};
