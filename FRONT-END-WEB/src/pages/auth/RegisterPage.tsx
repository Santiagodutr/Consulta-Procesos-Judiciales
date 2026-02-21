import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { authAPI } from '../../services/apiService.ts';
import {
  Mail,
  ArrowLeft,
  Shield,
  Smartphone,
  CheckCircle2,
  Loader2
} from 'lucide-react';

const registerSchema = z.object({
  email: z.string().email('Ingrese un email profesional válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string(),
  first_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  last_name: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  document_type: z.enum(['CC', 'CE', 'NIT', 'passport']),
  document_number: z.string().min(5, 'El número de documento debe tener al menos 5 dígitos'),
  phone_number: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos').optional(),
  user_type: z.enum(['natural', 'juridical', 'company']),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'Debe aceptar los términos y condiciones'
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"]
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      const { confirmPassword, acceptTerms, ...userData } = data;
      const response = await authAPI.register(userData);

      if (response.success || response.data?.success) {
        toast.success('¡Cuenta creada! Autenticando...');
        try {
          const loginResponse = await authAPI.login(userData.email, userData.password);
          if (loginResponse.success && loginResponse.data) {
            localStorage.setItem('access_token', loginResponse.data.access_token);
            localStorage.setItem('refresh_token', loginResponse.data.refresh_token);
            localStorage.setItem('user', JSON.stringify(loginResponse.data.user));
            toast.success('¡Bienvenido al sistema!');
            setTimeout(() => navigate('/dashboard'), 100);
          } else {
            navigate('/login');
          }
        } catch {
          navigate('/login');
        }
      } else {
        navigate('/login');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Error al crear la cuenta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans overflow-hidden">
      {/* Visual Side (LHS) */}
      <div className="hidden lg:flex lg:w-5/12 bg-primary-900 relative items-center justify-center p-20">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80')] opacity-10 bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-900/95 to-accent-500/10"></div>

        <div className="relative z-10 space-y-12 max-w-sm">
          <div className="space-y-6">
            <h1 className="text-5xl font-serif font-bold text-white leading-tight">
              Únase a la Élite <span className="text-accent-500">Legal</span>.
            </h1>
            <p className="text-lg text-white/50 leading-relaxed font-light">
              Cree su cuenta hoy y acceda a las herramientas de gestión judicial más avanzadas del país.
            </p>
          </div>

          <div className="space-y-6">
            {[
              { text: 'Seguimiento en tiempo real 24/7', icon: CheckCircle2 },
              { text: 'Alertas tempranas de actuaciones', icon: CheckCircle2 },
              { text: 'Descarga masiva de expedientes', icon: CheckCircle2 },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 group">
                <div className="w-8 h-8 rounded-full bg-accent-500/10 flex items-center justify-center text-accent-500 group-hover:bg-accent-500 group-hover:text-primary-900 transition-all">
                  <item.icon size={16} />
                </div>
                <span className="text-sm font-medium text-white/80">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Side (RHS) */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 md:p-12 bg-gray-50 overflow-y-auto">
        <div className="max-w-2xl w-full animate-scale-in my-12">
          <div className="mb-10 flex flex-col items-center">
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2 text-gray-400 hover:text-primary-900 transition-colors mb-8 group self-start"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-xs font-bold uppercase tracking-widest">Ya tengo cuenta</span>
            </button>
            <div className="mb-6">
              <div className="bg-primary-900 p-3 rounded-2xl shadow-xl border border-white/10">
                <img src="/logo_justitrack.png" alt="JustiTrack" className="h-10 w-auto" />
              </div>
            </div>
            <h2 className="text-4xl font-serif font-bold text-primary-900 tracking-tight mb-2">Crear nueva cuenta</h2>
            <p className="text-gray-500 text-center max-w-md">Complete el formulario para habilitar su acceso al ecosistema JustiTrack.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-gray-100">
            {/* Step 1: Account Type */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-xl bg-primary-900/5 flex items-center justify-center text-primary-900 font-bold text-xs italic">01</div>
                <h3 className="text-sm font-serif font-bold text-primary-900 uppercase tracking-widest">Tipo de Usuario</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Perfil Social</label>
                  <select
                    {...register('user_type')}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-primary-900 font-bold focus:ring-4 focus:ring-accent-500/10 focus:border-accent-500 transition-all outline-none"
                  >
                    <option value="">Seleccionar tipo</option>
                    <option value="natural">Persona Natural</option>
                    <option value="juridical">Persona Jurídica</option>
                    <option value="company">Empresa / Firma de Abogados</option>
                  </select>
                  {errors.user_type && <p className="text-xs font-bold text-danger-600 px-1 mt-1">{errors.user_type.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Documento de Identidad</label>
                  <div className="flex gap-2">
                    <select
                      {...register('document_type')}
                      className="w-1/3 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-primary-900 font-bold focus:ring-4 focus:ring-accent-500/10 focus:border-accent-500 transition-all outline-none"
                    >
                      <option value="CC">CC</option>
                      <option value="CE">CE</option>
                      <option value="NIT">NIT</option>
                    </select>
                    <input
                      {...register('document_number')}
                      type="text"
                      placeholder="Número"
                      className="w-2/3 bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-primary-900 font-bold focus:ring-4 focus:ring-accent-500/10 focus:border-accent-500 transition-all outline-none"
                    />
                  </div>
                  {(errors.document_type || errors.document_number) && <p className="text-xs font-bold text-danger-600 px-1 mt-1">Identificación requerida</p>}
                </div>
              </div>
            </div>

            {/* Step 2: Personal Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-xl bg-primary-900/5 flex items-center justify-center text-primary-900 font-bold text-xs italic">02</div>
                <h3 className="text-sm font-serif font-bold text-primary-900 uppercase tracking-widest">Datos Personales</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Nombre(s)</label>
                  <input
                    {...register('first_name')}
                    type="text"
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-primary-900 font-bold focus:ring-4 focus:ring-accent-500/10 focus:border-accent-500 transition-all outline-none"
                    placeholder="Ej. Juan Andrés"
                  />
                  {errors.first_name && <p className="text-xs font-bold text-danger-600 px-1 mt-1">{errors.first_name.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Apellido(s)</label>
                  <input
                    {...register('last_name')}
                    type="text"
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-primary-900 font-bold focus:ring-4 focus:ring-accent-500/10 focus:border-accent-500 transition-all outline-none"
                    placeholder="Ej. Pérez García"
                  />
                  {errors.last_name && <p className="text-xs font-bold text-danger-600 px-1 mt-1">{errors.last_name.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Correo Profesional</label>
                  <div className="relative group">
                    <Mail size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-accent-600" />
                    <input
                      {...register('email')}
                      type="email"
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-5 py-3.5 text-primary-900 font-bold focus:ring-4 focus:ring-accent-500/10 focus:border-accent-500 transition-all outline-none"
                      placeholder="abogado@firma.com"
                    />
                  </div>
                  {errors.email && <p className="text-xs font-bold text-danger-600 px-1 mt-1">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Teléfono Móvil</label>
                  <div className="relative group">
                    <Smartphone size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-accent-600" />
                    <input
                      {...register('phone_number')}
                      type="tel"
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-5 py-3.5 text-primary-900 font-bold focus:ring-4 focus:ring-accent-500/10 focus:border-accent-500 transition-all outline-none"
                      placeholder="300 123 4567"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Security */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-xl bg-primary-900/5 flex items-center justify-center text-primary-900 font-bold text-xs italic">03</div>
                <h3 className="text-sm font-serif font-bold text-primary-900 uppercase tracking-widest">Seguridad</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Nueva Contraseña</label>
                  <input
                    {...register('password')}
                    type="password"
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-primary-900 font-bold focus:ring-4 focus:ring-accent-500/10 focus:border-accent-500 transition-all outline-none"
                    placeholder="Consultar requisitos"
                  />
                  {errors.password && <p className="text-xs font-bold text-danger-600 px-1 mt-1">{errors.password.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Confirmar Contraseña</label>
                  <input
                    {...register('confirmPassword')}
                    type="password"
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-primary-900 font-bold focus:ring-4 focus:ring-accent-500/10 focus:border-accent-500 transition-all outline-none"
                    placeholder="Repetir..."
                  />
                  {errors.confirmPassword && <p className="text-xs font-bold text-danger-600 px-1 mt-1">{errors.confirmPassword.message}</p>}
                </div>
              </div>
            </div>

            {/* Terms and Submit */}
            <div className="pt-6 space-y-6">
              <label className="flex items-start gap-4 cursor-pointer group">
                <input
                  type="checkbox"
                  {...register('acceptTerms')}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-accent-600 focus:ring-accent-500"
                />
                <span className="text-xs font-medium text-gray-500 leading-relaxed">
                  Declaro que he leído y acepto los{' '}
                  <Link to="/terms" className="text-accent-600 font-bold hover:underline">Términos del Servicio</Link>{' '}
                  y la <Link to="/privacy" className="text-accent-600 font-bold hover:underline">Política de Tratamiento de Datos</Link>.
                </span>
              </label>
              {errors.acceptTerms && <p className="text-xs font-bold text-danger-600 px-1">{errors.acceptTerms.message}</p>}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary-900 text-white rounded-2xl py-5 font-bold text-sm hover:bg-accent-500 hover:text-primary-900 transition-all shadow-2xl shadow-primary-900/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 group"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Shield size={18} className="group-hover:scale-110 transition-transform" />}
                <span>{isLoading ? 'Creando cuenta profesional...' : 'Finalizar Registro'}</span>
              </button>
            </div>
          </form>

          <p className="text-center mt-12 text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">
            Protección de datos conforme a la Ley 1581 de 2012
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;