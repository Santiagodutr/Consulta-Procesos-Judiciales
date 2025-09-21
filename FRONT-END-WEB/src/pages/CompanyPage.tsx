import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface Company {
  id: string;
  name: string;
  nit: string;
  legalRepresentative: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  department: string;
  businessType: string;
  createdAt: string;
  isActive: boolean;
  processCount: number;
}

interface CompanyFormData {
  name: string;
  nit: string;
  legalRepresentative: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  department: string;
  businessType: string;
}

export const CompanyPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch
  } = useForm<CompanyFormData>();

  // Fetch companies
  const {
    data: companies = [],
    isLoading
  } = useQuery({
    queryKey: ['companies', user?.id],
    queryFn: async (): Promise<Company[]> => {
      // Mock data for now
      return [
        {
          id: '1',
          name: 'Corporación Jurídica Andina S.A.S.',
          nit: '900123456-7',
          legalRepresentative: 'María Elena Rodríguez',
          email: 'legal@corporacionandina.com',
          phone: '+57 1 234-5678',
          address: 'Carrera 15 #93-47 Oficina 501',
          city: 'Bogotá',
          department: 'Cundinamarca',
          businessType: 'Servicios jurídicos',
          createdAt: '2023-06-15T10:00:00Z',
          isActive: true,
          processCount: 15
        },
        {
          id: '2',
          name: 'Bufete Legal Santander Ltda.',
          nit: '890654321-4',
          legalRepresentative: 'Carlos Alberto Mejía',
          email: 'contacto@bufetesantander.com',
          phone: '+57 7 321-9876',
          address: 'Calle 36 #19-02 Piso 3',
          city: 'Bucaramanga',
          department: 'Santander',
          businessType: 'Consultoría jurídica',
          createdAt: '2023-08-20T14:30:00Z',
          isActive: true,
          processCount: 8
        }
      ];
    },
    enabled: !!user
  });

  // Create company mutation
  const createCompanyMutation = useMutation({
    mutationFn: async (data: CompanyFormData): Promise<Company> => {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newCompany: Company = {
        id: Date.now().toString(),
        ...data,
        createdAt: new Date().toISOString(),
        isActive: true,
        processCount: 0
      };

      return newCompany;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Empresa creada exitosamente');
      setShowAddForm(false);
      reset();
    },
    onError: (error) => {
      console.error('Error creating company:', error);
      toast.error('Error al crear la empresa');
    }
  });

  // Update company mutation
  const updateCompanyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CompanyFormData> }) => {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { id, ...data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Empresa actualizada exitosamente');
      setIsEditing(false);
    },
    onError: (error) => {
      console.error('Error updating company:', error);
      toast.error('Error al actualizar la empresa');
    }
  });

  // Toggle company status mutation
  const toggleCompanyStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return { id, isActive };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Estado de empresa actualizado');
    },
    onError: (error) => {
      console.error('Error toggling company status:', error);
      toast.error('Error al cambiar el estado de la empresa');
    }
  });

  const onSubmit = (data: CompanyFormData) => {
    if (isEditing) {
      // Find the company being edited (you'd need to track this in state)
      // updateCompanyMutation.mutate({ id: editingCompanyId, data });
    } else {
      createCompanyMutation.mutate(data);
    }
  };

  const handleToggleStatus = (company: Company) => {
    toggleCompanyStatusMutation.mutate({
      id: company.id,
      isActive: !company.isActive
    });
  };

  const departments = [
    'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bolívar', 'Boyacá', 'Caldas', 'Caquetá',
    'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca', 'Guainía', 'Guaviare',
    'Huila', 'La Guajira', 'Magdalena', 'Meta', 'Nariño', 'Norte de Santander', 'Putumayo',
    'Quindío', 'Risaralda', 'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima',
    'Valle del Cauca', 'Vaupés', 'Vichada'
  ];

  const businessTypes = [
    'Servicios jurídicos',
    'Consultoría jurídica',
    'Bufete de abogados',
    'Firma de abogados',
    'Asesoría legal empresarial',
    'Derecho corporativo',
    'Litigio civil',
    'Derecho laboral',
    'Derecho penal',
    'Derecho administrativo',
    'Mediación y arbitraje',
    'Otros servicios legales'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Empresas</h1>
          <p className="mt-2 text-sm text-gray-700">
            Administra las empresas asociadas a tu cuenta
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar Empresa
          </button>
        </div>
      </div>

      {/* Add/Edit Company Form */}
      {showAddForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900">
              {isEditing ? 'Editar Empresa' : 'Agregar Nueva Empresa'}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Completa la información de la empresa para agregarla a tu cuenta
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              {/* Company Name */}
              <div className="sm:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nombre de la empresa *
                </label>
                <input
                  type="text"
                  id="name"
                  {...register('name', { required: 'El nombre es requerido' })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              {/* NIT */}
              <div>
                <label htmlFor="nit" className="block text-sm font-medium text-gray-700">
                  NIT *
                </label>
                <input
                  type="text"
                  id="nit"
                  {...register('nit', { 
                    required: 'El NIT es requerido',
                    pattern: {
                      value: /^\d{9,10}-\d{1}$/,
                      message: 'Formato de NIT inválido (ej: 900123456-7)'
                    }
                  })}
                  placeholder="900123456-7"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {errors.nit && (
                  <p className="mt-1 text-sm text-red-600">{errors.nit.message}</p>
                )}
              </div>

              {/* Legal Representative */}
              <div>
                <label htmlFor="legalRepresentative" className="block text-sm font-medium text-gray-700">
                  Representante legal *
                </label>
                <input
                  type="text"
                  id="legalRepresentative"
                  {...register('legalRepresentative', { required: 'El representante legal es requerido' })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {errors.legalRepresentative && (
                  <p className="mt-1 text-sm text-red-600">{errors.legalRepresentative.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Correo electrónico *
                </label>
                <input
                  type="email"
                  id="email"
                  {...register('email', { 
                    required: 'El correo es requerido',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Correo electrónico inválido'
                    }
                  })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  id="phone"
                  {...register('phone', { required: 'El teléfono es requerido' })}
                  placeholder="+57 1 234-5678"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>

              {/* Address */}
              <div className="sm:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Dirección *
                </label>
                <input
                  type="text"
                  id="address"
                  {...register('address', { required: 'La dirección es requerida' })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                )}
              </div>

              {/* City */}
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  Ciudad *
                </label>
                <input
                  type="text"
                  id="city"
                  {...register('city', { required: 'La ciudad es requerida' })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                )}
              </div>

              {/* Department */}
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                  Departamento *
                </label>
                <select
                  id="department"
                  {...register('department', { required: 'El departamento es requerido' })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">Seleccionar departamento</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                {errors.department && (
                  <p className="mt-1 text-sm text-red-600">{errors.department.message}</p>
                )}
              </div>

              {/* Business Type */}
              <div className="sm:col-span-2">
                <label htmlFor="businessType" className="block text-sm font-medium text-gray-700">
                  Tipo de negocio *
                </label>
                <select
                  id="businessType"
                  {...register('businessType', { required: 'El tipo de negocio es requerido' })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">Seleccionar tipo de negocio</option>
                  {businessTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {errors.businessType && (
                  <p className="mt-1 text-sm text-red-600">{errors.businessType.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setIsEditing(false);
                  reset();
                }}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || createCompanyMutation.isPending}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting || createCompanyMutation.isPending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </>
                ) : (
                  isEditing ? 'Actualizar Empresa' : 'Crear Empresa'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Companies List */}
      {isLoading ? (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      ) : companies.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay empresas</h3>
          <p className="mt-1 text-sm text-gray-500">
            Comienza agregando tu primera empresa para gestionar procesos corporativos
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Agregar primera empresa
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {companies.map((company) => (
              <li key={company.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-medium text-gray-900">{company.name}</h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            company.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {company.isActive ? 'Activa' : 'Inactiva'}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                          <span>NIT: {company.nit}</span>
                          <span>•</span>
                          <span>{company.legalRepresentative}</span>
                          <span>•</span>
                          <span>{company.processCount} procesos</span>
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          {company.city}, {company.department} • {company.businessType}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleStatus(company)}
                        disabled={toggleCompanyStatusMutation.isPending}
                        className={`inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md ${
                          company.isActive
                            ? 'text-red-700 bg-red-100 hover:bg-red-200'
                            : 'text-green-700 bg-green-100 hover:bg-green-200'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50`}
                      >
                        {company.isActive ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        className="text-indigo-600 hover:text-indigo-500 text-sm"
                        onClick={() => {
                          setIsEditing(true);
                          setShowAddForm(true);
                          // Here you would populate the form with company data
                        }}
                      >
                        Editar
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};