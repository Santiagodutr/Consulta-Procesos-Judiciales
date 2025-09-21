import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

interface CreateProcessFormData {
  processNumber: string;
  court: string;
  processType: string;
  subject: string;
  role: string;
  startDate: string;
  description?: string;
  enableMonitoring: boolean;
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    inApp: boolean;
  };
}

export const CreateProcessPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<CreateProcessFormData>({
    defaultValues: {
      enableMonitoring: true,
      notificationPreferences: {
        email: true,
        sms: false,
        inApp: true
      }
    }
  });

  const watchProcessType = watch('processType');

  const onSubmit = async (data: CreateProcessFormData) => {
    try {
      setIsLoading(true);
      
      // Here you would call your API to create the process
      // const response = await createProcess(data);
      
      // Mock success for now
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Proceso creado exitosamente');
      
      // Redirect to processes list or the new process detail
      navigate('/processes');
      
    } catch (error: any) {
      toast.error(error.message || 'Error al crear el proceso');
    } finally {
      setIsLoading(false);
    }
  };

  const processTypes = [
    { value: 'civil', label: 'Civil' },
    { value: 'laboral', label: 'Laboral' },
    { value: 'penal', label: 'Penal' },
    { value: 'administrativo', label: 'Contencioso Administrativo' },
    { value: 'familia', label: 'Familia' },
    { value: 'comercial', label: 'Comercial' },
    { value: 'constitucional', label: 'Constitucional' },
    { value: 'disciplinario', label: 'Disciplinario' }
  ];

  const roles = [
    { value: 'demandante', label: 'Demandante' },
    { value: 'demandado', label: 'Demandado' },
    { value: 'tercero', label: 'Tercero' },
    { value: 'apoderado', label: 'Apoderado' },
    { value: 'ministerio_publico', label: 'Ministerio Público' },
    { value: 'otro', label: 'Otro' }
  ];

  const courts = [
    'Juzgado 1º Civil del Circuito de Bogotá',
    'Juzgado 2º Civil del Circuito de Bogotá',
    'Juzgado 3º Civil del Circuito de Bogotá',
    'Juzgado 1º Laboral del Circuito de Bogotá',
    'Juzgado 2º Laboral del Circuito de Bogotá',
    'Juzgado 1º Penal del Circuito de Bogotá',
    'Juzgado 2º Penal del Circuito de Bogotá',
    'Tribunal Superior de Bogotá - Sala Civil',
    'Tribunal Superior de Bogotá - Sala Laboral',
    'Tribunal Superior de Bogotá - Sala Penal',
    'Consejo de Estado',
    'Corte Suprema de Justicia',
    'Corte Constitucional'
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agregar Nuevo Proceso</h1>
            <p className="mt-2 text-sm text-gray-700">
              Registra un proceso judicial para comenzar su monitoreo automático
            </p>
          </div>
          <button
            onClick={() => navigate('/processes')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Información Básica</h2>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Process Number */}
            <div className="sm:col-span-1">
              <label htmlFor="processNumber" className="block text-sm font-medium text-gray-700">
                Número de Proceso <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="processNumber"
                {...register('processNumber', {
                  required: 'El número de proceso es requerido',
                  pattern: {
                    value: /^[0-9]{4}-[0-9]{5,6}$/,
                    message: 'Formato: YYYY-NNNNN o YYYY-NNNNNN'
                  }
                })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Ej: 2024-00123"
              />
              {errors.processNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.processNumber.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Formato: Año-Número (Ej: 2024-00123)
              </p>
            </div>

            {/* Process Type */}
            <div className="sm:col-span-1">
              <label htmlFor="processType" className="block text-sm font-medium text-gray-700">
                Tipo de Proceso <span className="text-red-500">*</span>
              </label>
              <select
                id="processType"
                {...register('processType', { required: 'Seleccione un tipo de proceso' })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">Seleccionar tipo</option>
                {processTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.processType && (
                <p className="mt-1 text-sm text-red-600">{errors.processType.message}</p>
              )}
            </div>

            {/* Court */}
            <div className="sm:col-span-2">
              <label htmlFor="court" className="block text-sm font-medium text-gray-700">
                Juzgado o Tribunal <span className="text-red-500">*</span>
              </label>
              <input
                list="courts"
                id="court"
                {...register('court', { required: 'El juzgado es requerido' })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Escriba o seleccione el juzgado"
              />
              <datalist id="courts">
                {courts.map((court, index) => (
                  <option key={index} value={court} />
                ))}
              </datalist>
              {errors.court && (
                <p className="mt-1 text-sm text-red-600">{errors.court.message}</p>
              )}
            </div>

            {/* Subject */}
            <div className="sm:col-span-2">
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                Asunto del Proceso <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="subject"
                {...register('subject', { required: 'El asunto es requerido' })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Ej: Cobro Ejecutivo de Obligaciones"
              />
              {errors.subject && (
                <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
              )}
            </div>

            {/* Role */}
            <div className="sm:col-span-1">
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Su Rol en el Proceso <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                {...register('role', { required: 'Seleccione su rol' })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">Seleccionar rol</option>
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>

            {/* Start Date */}
            <div className="sm:col-span-1">
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                Fecha de Inicio
              </label>
              <input
                type="date"
                id="startDate"
                {...register('startDate')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Descripción Adicional
              </label>
              <textarea
                id="description"
                rows={3}
                {...register('description')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Información adicional sobre el proceso (opcional)"
              />
            </div>
          </div>
        </div>

        {/* Monitoring Settings */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Configuración de Monitoreo</h2>
          
          <div className="space-y-6">
            {/* Enable Monitoring */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="enableMonitoring"
                  type="checkbox"
                  {...register('enableMonitoring')}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="enableMonitoring" className="font-medium text-gray-700">
                  Activar monitoreo automático
                </label>
                <p className="text-gray-500">
                  El sistema verificará automáticamente las actualizaciones de este proceso
                </p>
              </div>
            </div>

            {/* Notification Preferences */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Preferencias de Notificación</h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="notificationEmail"
                      type="checkbox"
                      {...register('notificationPreferences.email')}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="notificationEmail" className="font-medium text-gray-700">
                      Notificaciones por correo electrónico
                    </label>
                    <p className="text-gray-500">Recibir actualizaciones por email</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="notificationSms"
                      type="checkbox"
                      {...register('notificationPreferences.sms')}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="notificationSms" className="font-medium text-gray-700">
                      Notificaciones por SMS
                    </label>
                    <p className="text-gray-500">Recibir alertas por mensaje de texto</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="notificationInApp"
                      type="checkbox"
                      {...register('notificationPreferences.inApp')}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="notificationInApp" className="font-medium text-gray-700">
                      Notificaciones en la aplicación
                    </label>
                    <p className="text-gray-500">Mostrar alertas dentro de la plataforma</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Information Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Información importante
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>El sistema realizará consultas automáticas en el portal judicial correspondiente</li>
                  <li>Las actualizaciones se verifican diariamente si el monitoreo está activo</li>
                  <li>Puedes modificar las preferencias de notificación en cualquier momento</li>
                  <li>Los datos se almacenan de forma segura y están protegidos por encriptación</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/processes')}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creando proceso...
              </>
            ) : (
              <>
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Crear Proceso
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};