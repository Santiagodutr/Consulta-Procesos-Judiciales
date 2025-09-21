import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

export const VerifyEmailPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'error' | 'expired'>('verifying');
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { signIn } = useAuth();

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setVerificationStatus('error');
        setIsLoading(false);
        return;
      }

      try {
        // Simulate API call to verify email
        // await verifyEmailToken(token);
        
        setTimeout(() => {
          setVerificationStatus('success');
          setIsLoading(false);
          toast.success('¡Correo electrónico verificado exitosamente!');
        }, 2000);
        
      } catch (error: any) {
        console.error('Email verification error:', error);
        
        if (error.status === 410) {
          setVerificationStatus('expired');
        } else {
          setVerificationStatus('error');
        }
        
        setIsLoading(false);
        toast.error('Error al verificar el correo electrónico');
      }
    };

    verifyEmail();
  }, [token]);

  const handleResendVerification = async () => {
    try {
      setIsLoading(true);
      // await resendVerificationEmail();
      toast.success('Nuevo correo de verificación enviado');
    } catch (error) {
      toast.error('Error al reenviar el correo de verificación');
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    switch (verificationStatus) {
      case 'verifying':
        return (
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
              <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Verificando correo electrónico
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Por favor espera mientras verificamos tu correo electrónico...
            </p>
            <div className="mt-4">
              <div className="animate-pulse flex space-x-1 justify-center">
                <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                <div className="h-2 w-2 bg-blue-600 rounded-full animation-delay-200"></div>
                <div className="h-2 w-2 bg-blue-600 rounded-full animation-delay-400"></div>
              </div>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              ¡Correo verificado!
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Tu correo electrónico ha sido verificado exitosamente. 
              Ahora puedes acceder a todas las funcionalidades de tu cuenta.
            </p>
            
            <div className="mt-8 bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Cuenta activada
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Puedes iniciar sesión con tu correo y contraseña</li>
                      <li>Accede a consultar procesos judiciales</li>
                      <li>Configura notificaciones automáticas</li>
                      <li>Gestiona tus documentos procesales</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => navigate('/login')}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                Continuar al inicio de sesión
              </button>
            </div>
          </div>
        );

      case 'expired':
        return (
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-yellow-100">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Enlace expirado
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Este enlace de verificación ha expirado. 
              Los enlaces de verificación son válidos por 24 horas por seguridad.
            </p>

            <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="text-sm text-yellow-700">
                <p className="font-medium mb-2">¿Qué puedes hacer?</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Solicitar un nuevo correo de verificación</li>
                  <li>Verificar que el enlace esté completo</li>
                  <li>Contactar soporte si el problema persiste</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 flex flex-col space-y-3">
              <button
                onClick={handleResendVerification}
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : null}
                Enviar nuevo correo de verificación
              </button>
              
              <Link
                to="/login"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Volver al inicio de sesión
              </Link>
            </div>
          </div>
        );

      case 'error':
      default:
        return (
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Error de verificación
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              No pudimos verificar tu correo electrónico. 
              El enlace puede ser inválido o haber expirado.
            </p>

            <div className="mt-8 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-sm text-red-700">
                <p className="font-medium mb-2">Posibles problemas:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>El enlace fue copiado incorrectamente</li>
                  <li>El enlace ya fue utilizado</li>
                  <li>El correo ya está verificado</li>
                  <li>Error temporal del servidor</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 flex flex-col space-y-3">
              <button
                onClick={handleResendVerification}
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : null}
                Intentar nuevamente
              </button>
              
              <Link
                to="/register"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Crear nueva cuenta
              </Link>

              <Link
                to="/login"
                className="text-sm text-indigo-600 hover:text-indigo-500 transition-colors"
              >
                ¿Ya tienes cuenta verificada? Inicia sesión
              </Link>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {renderContent()}
      </div>
    </div>
  );
};