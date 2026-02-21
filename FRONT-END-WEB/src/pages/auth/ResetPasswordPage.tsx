import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { authAPI } from '../../services/apiService.ts';
import {
  ShieldAlert,
  Lock,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Eye,
  EyeOff,
  ChevronRight,
  RefreshCcw,
  AlertCircle
} from 'lucide-react';

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

export const ResetPasswordPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<ResetPasswordFormData>();

  const password = watch('password');

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsValidToken(false);
        return;
      }
      try {
        // Simulating verification for UI flow
        setIsValidToken(true);
      } catch (error) {
        setIsValidToken(false);
        toast.error('Enlace de recuperación inválido o expirado');
      }
    };
    verifyToken();
  }, [token]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;
    try {
      setIsLoading(true);
      const response = await authAPI.resetPassword(token, data.password);
      if (response.success) {
        toast.success('Contraseña restablecida exitosamente');
        navigate('/login', {
          state: { message: 'Contraseña restablecida. Ya puede iniciar sesión.' }
        });
      } else {
        throw new Error(response.message || 'Error al restablecer');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Error al restablecer la contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidToken === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col gap-6">
        <Loader2 className="animate-spin text-accent-500" size={48} strokeWidth={1} />
        <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.3em] animate-pulse">Verificando Credenciales...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full animate-scale-in">
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
          <div className="p-10 md:p-12">
            {!isValidToken ? (
              <div className="text-center">
                <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-3xl bg-danger-50 text-danger-500 mb-8 border border-danger-100">
                  <ShieldAlert size={40} />
                </div>
                <h2 className="text-3xl font-serif font-bold text-primary-900 tracking-tight mb-4">
                  Enlace Caducado
                </h2>
                <div className="bg-danger-50 rounded-2xl p-6 mb-8 text-left border border-danger-50">
                  <p className="text-[10px] font-bold text-danger-700 uppercase tracking-widest mb-3">Motivos de seguridad:</p>
                  <ul className="text-xs text-danger-600 space-y-2">
                    <li className="flex items-center gap-2">• Validez máxima de 60 minutos</li>
                    <li className="flex items-center gap-2">• Token utilizado anteriormente</li>
                    <li className="flex items-center gap-2">• Error en la URL de acceso</li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <button
                    onClick={() => navigate('/forgot-password')}
                    className="w-full bg-primary-900 text-white rounded-2xl py-4 font-bold text-sm hover:bg-accent-500 hover:text-primary-900 transition-all active:scale-95"
                  >
                    Solicitar Nuevo Enlace
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full bg-gray-100 text-gray-500 rounded-2xl py-4 font-bold text-sm hover:bg-gray-200 transition-all active:scale-95"
                  >
                    Volver al Inicio
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-center mb-10">
                  <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-3xl bg-accent-500/10 text-accent-600 mb-8 border border-accent-500/20">
                    <RefreshCcw size={40} />
                  </div>
                  <h2 className="text-3xl font-serif font-bold text-primary-900 tracking-tight">Restablecer Clave</h2>
                  <p className="mt-3 text-gray-500 leading-relaxed font-medium">Establezca una nueva contraseña de alta seguridad para su cuenta profesional.</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Nueva Contraseña</label>
                      <div className="relative group">
                        <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-accent-600" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          {...register('password', {
                            required: 'Requerido',
                            minLength: { value: 8, message: 'Mínimo 8 caracteres' },
                            pattern: { value: /^(?=.*[A-Za-z])(?=.*\d)/, message: 'Debe incluir letras y números' }
                          })}
                          className={`w-full bg-gray-50 border ${errors.password ? 'border-danger-500' : 'border-gray-100 focus:border-accent-500'} rounded-2xl pl-14 pr-12 py-4 text-primary-900 font-bold focus:ring-4 focus:ring-accent-500/10 transition-all outline-none`}
                          placeholder="••••••••"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-primary-900">
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {errors.password && <p className="text-xs font-bold text-danger-600 px-1">{errors.password.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Confirmar Contraseña</label>
                      <div className="relative group">
                        <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-accent-600" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          {...register('confirmPassword', {
                            validate: v => v === password || 'Las contraseñas no coinciden'
                          })}
                          className={`w-full bg-gray-50 border ${errors.confirmPassword ? 'border-danger-500' : 'border-gray-100 focus:border-accent-500'} rounded-2xl pl-14 pr-12 py-4 text-primary-900 font-bold focus:ring-4 focus:ring-accent-500/10 transition-all outline-none`}
                          placeholder="••••••••"
                        />
                      </div>
                      {errors.confirmPassword && <p className="text-xs font-bold text-danger-600 px-1">{errors.confirmPassword.message}</p>}
                    </div>
                  </div>

                  <div className="p-6 bg-accent-500/5 rounded-3xl border border-accent-500/10 space-y-4">
                    <p className="text-[10px] font-bold text-accent-700 uppercase tracking-widest flex items-center gap-2">
                      <AlertCircle size={12} /> Sugerencias de Seguridad
                    </p>
                    <ul className="text-[11px] text-primary-800/70 space-y-2 font-medium">
                      <li className="flex items-center gap-3">
                        <div className={`w-1.5 h-1.5 rounded-full ${password?.length >= 8 ? 'bg-success-500' : 'bg-gray-300'}`}></div>
                        Al menos 8 caracteres alfanuméricos
                      </li>
                      <li className="flex items-center gap-3">
                        <div className={`w-1.5 h-1.5 rounded-full ${password && /[A-Z]/.test(password) ? 'bg-success-500' : 'bg-gray-300'}`}></div>
                        Uso de mayúsculas y minúsculas
                      </li>
                    </ul>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary-900 text-white rounded-2xl py-5 font-bold text-sm hover:bg-accent-500 hover:text-primary-900 transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 group"
                  >
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} className="group-hover:scale-110 transition-transform" />}
                    <span>{isLoading ? 'Actualizando...' : 'Restablecer Acceso'}</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mt-8 flex items-center justify-center gap-4 text-gray-400">
        <ShieldCheck size={16} />
        <span className="text-[10px] font-bold uppercase tracking-widest">Protocolo de Seguridad Activado</span>
      </div>
    </div>
  );
};