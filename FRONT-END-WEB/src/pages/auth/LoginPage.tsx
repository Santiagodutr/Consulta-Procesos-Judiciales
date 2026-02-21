import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.tsx';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ChevronRight,
  ShieldCheck,
  Gavel,
  ArrowLeft,
  Loader2
} from 'lucide-react';

interface LoginFormData {
  email: string;
  password: string;
}

export const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {};

    if (!formData.email) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Ingrese un email profesional válido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await signIn(formData.email, formData.password);
      setTimeout(() => {
        navigate('/dashboard');
      }, 100);
    } catch (error: any) {
      console.error('Login error:', error);
      setErrors({ email: error.message || 'Credenciales inválidas. Intente nuevamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof LoginFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans overflow-hidden">
      {/* Visual Side (LHS) */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-900 relative items-center justify-center p-20">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80')] opacity-10 bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-900/90 to-accent-500/20"></div>

        <div className="relative z-10 space-y-12 max-w-lg">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-500/20 border border-accent-500/30 rounded-full text-accent-400">
              <ShieldCheck size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Plataforma Certificada</span>
            </div>
            <h1 className="text-6xl font-serif font-bold text-white leading-tight">
              Justicia <br />
              <span className="text-accent-500">Digital</span> de Alta Precisión.
            </h1>
            <p className="text-lg text-white/60 leading-relaxed font-light">
              Gestione su portafolio judicial con la herramienta líder en automatización y consulta de procesos gubernamentales en Colombia.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <p className="text-3xl font-serif font-bold text-white">24/7</p>
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Monitorización</p>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-serif font-bold text-white">99.9%</p>
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Sincronización</p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-12 left-20 right-20 flex justify-between items-center text-white/30">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em]">JustiTrack © 2026</p>
          <div className="flex gap-6">
            <Gavel size={16} />
            <ShieldCheck size={16} />
          </div>
        </div>
      </div>

      {/* Form Side (RHS) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="max-w-md w-full animate-scale-in">
          <div className="mb-10 text-center lg:text-left">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 text-gray-400 hover:text-primary-900 transition-colors mb-8 group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-xs font-bold uppercase tracking-widest">Volver al inicio</span>
            </button>
            <div className="flex justify-center lg:justify-start mb-6">
              <div className="bg-primary-900 p-3 rounded-2xl shadow-xl border border-white/10">
                <img src="/logo_justitrack.png" alt="JustiTrack" className="h-10 w-auto" />
              </div>
            </div>
            <h2 className="text-4xl font-serif font-bold text-primary-900 tracking-tight mb-2">Bienvenido de nuevo</h2>
            <p className="text-gray-500">Ingrese sus credenciales para acceder a su panel profesional.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                  Correo Electrónico
                </label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-accent-600 transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full bg-white border ${errors.email ? 'border-danger-500 shadow-danger-500/5' : 'border-gray-200 group-hover:border-gray-300 focus:border-accent-500'} rounded-2xl pl-14 pr-5 py-4 text-primary-900 font-bold focus:ring-4 focus:ring-accent-500/10 transition-all outline-none`}
                    placeholder="nombre@ejemplo.com"
                  />
                </div>
                {errors.email && <p className="text-xs font-bold text-danger-600 px-1 mt-1">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <label htmlFor="password" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Contraseña
                  </label>
                  <Link to="/forgot-password" className="text-[10px] font-bold text-accent-600 hover:text-primary-900 uppercase tracking-widest">
                    ¿Olvidó su clave?
                  </Link>
                </div>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-accent-600 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full bg-white border ${errors.password ? 'border-danger-500 shadow-danger-500/5' : 'border-gray-200 group-hover:border-gray-300 focus:border-accent-500'} rounded-2xl pl-14 pr-12 py-4 text-primary-900 font-bold focus:ring-4 focus:ring-accent-500/10 transition-all outline-none`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-primary-900 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs font-bold text-danger-600 px-1 mt-1">{errors.password}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-900 text-white rounded-2xl py-5 font-bold text-sm hover:bg-accent-500 hover:text-primary-900 transition-all shadow-xl shadow-primary-900/10 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 group"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />}
              <span>{isLoading ? 'Autenticando...' : 'Iniciar Sesión'}</span>
            </button>

            <div className="text-center pt-8">
              <p className="text-sm text-gray-500">
                ¿Aún no tiene cuenta profesional?{' '}
                <Link to="/register" className="font-bold text-accent-600 hover:text-primary-900 transition-colors underline decoration-accent-500/30 underline-offset-4">
                  Regístrese aquí
                </Link>
              </p>
            </div>
          </form>

          {/* Verification Badge */}
          <div className="mt-12 p-6 bg-white rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary-900/5 flex items-center justify-center text-primary-900">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Seguridad TLS 1.3</p>
              <p className="text-xs text-primary-900 font-bold">Sus datos están protegidos por encriptación bancaria.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;