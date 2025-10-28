import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { authAPI } from '../../services/apiService.ts';

const registerSchema = z.object({
  email: z.string().email('Ingrese un email válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string(),
  first_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  last_name: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  document_type: z.enum(['CC', 'CE', 'NIT', 'passport'], {
    errorMap: () => ({ message: 'Seleccione un tipo de documento válido' })
  }),
  document_number: z.string().min(5, 'El número de documento debe tener al menos 5 caracteres'),
  phone_number: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos').optional(),
  user_type: z.enum(['natural', 'juridical', 'company'], {
    errorMap: () => ({ message: 'Seleccione un tipo de usuario válido' })
  }),
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
    watch,
    formState: { errors }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema)
  });

  const watchUserType = watch('user_type');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      
      const { confirmPassword, acceptTerms, ...userData } = data;
      
      console.log('🚀 Iniciando registro con datos:', userData);
      
      // Llamar directamente a la API de registro
      const response = await authAPI.register(userData);
      
      console.log('📋 Respuesta del servidor:', response);
      
      // Verificar diferentes formatos de respuesta exitosa
      if (response.success || response.data?.success || response.message?.includes('success')) {
        toast.success('¡Cuenta creada exitosamente! Iniciando sesión...');
        
        // Después del registro exitoso, iniciar sesión automáticamente
        try {
          const loginResponse = await authAPI.login(userData.email, userData.password);
          
          console.log('🔐 Respuesta del login:', loginResponse);
          
          if (loginResponse.success && loginResponse.data) {
            // Guardar el token y datos del usuario
            localStorage.setItem('access_token', loginResponse.data.access_token);
            localStorage.setItem('refresh_token', loginResponse.data.refresh_token);
            localStorage.setItem('user', JSON.stringify(loginResponse.data.user));
            
            console.log('✅ Login automático exitoso, tokens guardados');
            
            toast.success('¡Bienvenido al sistema!');
            
            // Esperar un poco para que se guarden los datos y luego redirigir
            setTimeout(() => {
              navigate('/');
            }, 100);
          } else {
            toast.success('Cuenta creada exitosamente. Por favor inicia sesión.');
            navigate('/login');
          }
        } catch (loginError) {
          console.error('❌ Error en login automático:', loginError);
          toast.success('Cuenta creada exitosamente. Por favor inicia sesión.');
          navigate('/login');
        }
      } else {
        // Si no hay indicador de éxito claro, pero tampoco hay error, asumir éxito
        console.log('⚠️ Respuesta ambigua, pero probablemente exitosa');
        toast.success('Cuenta creada exitosamente. Por favor inicia sesión.');
        navigate('/login');
      }
      
    } catch (error: any) {
      console.error('❌ Error completo en registro:', error);
      
      // Mejorar el manejo de errores
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Error al crear la cuenta. Por favor intenta nuevamente.';
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <img src="/usuario.png" alt="Icono de usuario" className="h-8 w-8 object-contain" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Crear nueva cuenta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            O{' '}
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              inicia sesión con tu cuenta existente
            </Link>
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Tipo de Usuario */}
            <div>
              <label htmlFor="user_type" className="block text-sm font-medium text-gray-700">
                Tipo de Usuario
              </label>
              <select
                id="user_type"
                {...register('user_type')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccionar tipo</option>
                <option value="natural">Persona Natural</option>
                <option value="juridical">Persona Jurídica</option>
              </select>
              {errors.user_type && (
                <p className="mt-1 text-sm text-red-600">{errors.user_type.message}</p>
              )}
            </div>

            {/* Nombres y Apellidos */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                  Nombres
                </label>
                <input
                  id="first_name"
                  type="text"
                  {...register('first_name')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ingrese sus nombres"
                />
                {errors.first_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                  Apellidos
                </label>
                <input
                  id="last_name"
                  type="text"
                  {...register('last_name')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ingrese sus apellidos"
                />
                {errors.last_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
                )}
              </div>
            </div>



            {/* Documento */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="document_type" className="block text-sm font-medium text-gray-700">
                  Tipo de Documento
                </label>
                <select
                  id="document_type"
                  {...register('document_type')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccionar</option>
                  <option value="CC">Cédula de Ciudadanía</option>
                  <option value="CE">Cédula de Extranjería</option>
                  <option value="passport">Pasaporte</option>
                </select>
                {errors.document_type && (
                  <p className="mt-1 text-sm text-red-600">{errors.document_type.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="document_number" className="block text-sm font-medium text-gray-700">
                  Número de Documento
                </label>
                <input
                  id="document_number"
                  type="text"
                  {...register('document_number')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Número sin puntos ni comas"
                />
                {errors.document_number && (
                  <p className="mt-1 text-sm text-red-600">{errors.document_number.message}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="correo@ejemplo.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Teléfono */}
            <div>
              <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">
                Teléfono (Opcional)
              </label>
              <input
                id="phone_number"
                type="tel"
                {...register('phone_number')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: 3001234567"
              />
              {errors.phone_number && (
                <p className="mt-1 text-sm text-red-600">{errors.phone_number.message}</p>
              )}
            </div>

            {/* Contraseñas */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  {...register('password')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Mínimo 8 caracteres"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirmar Contraseña
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  {...register('confirmPassword')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Repetir contraseña"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            {/* Términos y condiciones */}
            <div className="flex items-start">
              <input
                id="acceptTerms"
                type="checkbox"
                {...register('acceptTerms')}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-700">
                Acepto los{' '}
                <Link to="/terms" className="text-blue-600 hover:text-blue-500">
                  términos y condiciones
                </Link>{' '}
                y la{' '}
                <Link to="/privacy" className="text-blue-600 hover:text-blue-500">
                  política de privacidad
                </Link>
              </label>
            </div>
            {errors.acceptTerms && (
              <p className="text-sm text-red-600">{errors.acceptTerms.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              Crear Cuenta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};