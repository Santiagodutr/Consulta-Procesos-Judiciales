import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { authAPI } from '../../services/apiService.ts';
import {
  KeyRound,
  Mail,
  ArrowLeft,
  ChevronRight,
  Loader2,
  ShieldCheck,
  FileCheck,
  RefreshCcw,
  CheckCircle2
} from 'lucide-react';

interface ForgotPasswordFormData {
  email: string;
}

export const ForgotPasswordPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues
  } = useForm<ForgotPasswordFormData>();

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsLoading(true);
      const response = await authAPI.forgotPassword(data.email);
      if (response.success) {
        setEmailSent(true);
        toast.success(response.message || 'Enlace de recuperación enviado');
      } else {
        throw new Error(response.message || 'Error al enviar el enlace');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Error al enviar el enlace');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    const email = getValues('email');
    if (!email) {
      toast.error('Ingrese su correo');
      return;
    }
    try {
      setIsLoading(true);
      const response = await authAPI.forgotPassword(email);
      if (response.success) {
        toast.success('Enlace reenviado exitosamente');
      } else {
        throw new Error(response.message || 'Error al reenviar');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Error al reenviar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full animate-scale-in">
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
          <div className="p-10 md:p-12">
            {/* Header */}
            <div className="text-center mb-10">
              <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-3xl bg-accent-500/10 text-accent-600 mb-8 border border-accent-500/20">
                {emailSent ? <FileCheck size={40} /> : <KeyRound size={40} />}
              </div>
              <h2 className="text-3xl font-serif font-bold text-primary-900 tracking-tight">
                {emailSent ? 'Correo Enviado' : 'Recuperar Clave'}
              </h2>
              <p className="mt-3 text-gray-500 leading-relaxed font-medium">
                {emailSent
                  ? 'Hemos enviado un enlace seguro para restablecer su acceso profesional.'
                  : 'Ingrese su correo institucional para recibir las instrucciones de recuperación.'}
              </p>
            </div>

            {!emailSent ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                    Correo Profesional
                  </label>
                  <div className="relative group">
                    <Mail size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-accent-600" />
                    <input
                      id="email"
                      type="email"
                      {...register('email', {
                        required: 'El correo electrónico es requerido',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Ingrese un correo electrónico válido'
                        }
                      })}
                      className={`w-full bg-gray-50 border ${errors.email ? 'border-danger-500' : 'border-gray-100 focus:border-accent-500'} rounded-2xl pl-14 pr-5 py-4 text-primary-900 font-bold focus:ring-4 focus:ring-accent-500/10 transition-all outline-none`}
                      placeholder="nombre@ejemplo.com"
                    />
                  </div>
                  {errors.email && <p className="text-xs font-bold text-danger-600 px-1">{errors.email.message}</p>}
                </div>

                <div className="py-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary-900 text-white rounded-2xl py-5 font-bold text-sm hover:bg-accent-500 hover:text-primary-900 transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : <ChevronRight size={18} />}
                    <span>{isLoading ? 'Procesando...' : 'Enviar Enlace'}</span>
                  </button>
                </div>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="inline-flex items-center gap-2 text-[10px] font-bold text-gray-400 hover:text-primary-900 uppercase tracking-widest transition-colors group"
                  >
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Volver al inicio de sesión</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-8">
                <div className="bg-success-50 border border-success-100 rounded-3xl p-6 flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-success-500/10 flex items-center justify-center text-success-600 shrink-0">
                    <CheckCircle2 size={24} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-success-800">Operación Exitosa</p>
                    <p className="text-xs text-success-700 leading-relaxed">
                      El enlace expirará en 60 minutos por motivos de alta seguridad institucional.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleResendEmail}
                    disabled={isLoading}
                    className="w-full bg-white text-primary-900 border border-gray-200 rounded-2xl py-4 font-bold text-xs hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                    <span>Reenviar Correo</span>
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full bg-primary-900 text-white rounded-2xl py-4 font-bold text-xs hover:bg-accent-500 hover:text-primary-900 transition-all active:scale-95"
                  >
                    Regresar al Portal
                  </button>
                </div>

                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 text-[10px] text-gray-500 leading-relaxed font-medium">
                  <p className="font-bold uppercase tracking-widest text-gray-400 mb-2">Soporte Técnico:</p>
                  <ul className="space-y-1">
                    <li>• Verifique su bandeja de SPAM</li>
                    <li>• Asegúrese que el correo sea el registrado</li>
                    <li>• Si el problema persiste, contacte a su administrador</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security Badge */}
        <div className="mt-8 flex items-center justify-center gap-4 text-gray-400">
          <ShieldCheck size={16} />
          <span className="text-[10px] font-bold uppercase tracking-widest">JustiTrack Security Protocol</span>
        </div>
      </div>
    </div>
  );
};