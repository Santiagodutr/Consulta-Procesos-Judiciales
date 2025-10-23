import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { directJudicialAPI } from '../services/apiService.ts';
import { Star, Eye, Trash2, AlertCircle } from 'lucide-react';

interface FavoriteProcess {
  id?: number;
  numero_radicacion: string;
  despacho: string;
  demandante: string;
  demandado: string;
  tipo_proceso: string;
  fecha_radicacion: string;
}

const MyProcessesPage: React.FC = () => {
  const navigate = useNavigate();
  const [favoriteProcesses, setFavoriteProcesses] = useState<FavoriteProcess[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await directJudicialAPI.getFavoriteProcesses();
      if (response.success && Array.isArray(response.data)) {
        setFavoriteProcesses(response.data);
      } else {
        setFavoriteProcesses([]);
      }
    } catch (err: any) {
      console.error('Error cargando favoritos:', err);
      setError(err.message || 'Error al cargar los procesos favoritos');
      setFavoriteProcesses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFavorite = async (numeroRadicacion: string) => {
    if (!window.confirm('¿Está seguro de quitar este proceso de favoritos?')) {
      return;
    }

    try {
      await directJudicialAPI.removeFavoriteProcess(numeroRadicacion);
      setFavoriteProcesses(prev => prev.filter(p => p.numero_radicacion !== numeroRadicacion));
      alert('Proceso removido de favoritos');
    } catch (err: any) {
      console.error('Error removiendo favorito:', err);
      alert('Error al remover el proceso de favoritos');
    }
  };

  const handleViewDetails = (numeroRadicacion: string) => {
    // Navegar a la página de consulta con el número de radicación
    navigate('/', { state: { searchRadicacion: numeroRadicacion } });
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-CO', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando procesos favoritos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2 text-center">Error</h2>
          <p className="text-gray-600 text-center mb-4">{error}</p>
          <button
            onClick={loadFavorites}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" />
            <h1 className="text-3xl font-bold text-gray-800">Mis Procesos</h1>
          </div>
          <p className="text-gray-600">
            Procesos judiciales guardados como favoritos ({favoriteProcesses.length})
          </p>
        </div>

        {/* Empty State */}
        {favoriteProcesses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              No tienes procesos favoritos
            </h2>
            <p className="text-gray-600 mb-6">
              Consulta un proceso y haz clic en el botón "Guardar" para agregarlo a tus favoritos
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Consultar Procesos
            </button>
          </div>
        ) : (
          /* Process List */
          <div className="grid gap-4">
            {favoriteProcesses.map((process) => (
              <div
                key={process.numero_radicacion}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Process Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="h-5 w-5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                      <h3 className="text-lg font-semibold text-gray-800">
                        {process.numero_radicacion}
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Despacho:</span>
                        <p className="text-gray-600 mt-1">{process.despacho}</p>
                      </div>

                      <div>
                        <span className="font-medium text-gray-700">Tipo de Proceso:</span>
                        <p className="text-gray-600 mt-1">{process.tipo_proceso || 'No especificado'}</p>
                      </div>

                      <div>
                        <span className="font-medium text-gray-700">Demandante:</span>
                        <p className="text-gray-600 mt-1">{process.demandante || 'No especificado'}</p>
                      </div>

                      <div>
                        <span className="font-medium text-gray-700">Demandado:</span>
                        <p className="text-gray-600 mt-1">{process.demandado || 'No especificado'}</p>
                      </div>

                      <div>
                        <span className="font-medium text-gray-700">Fecha de Radicación:</span>
                        <p className="text-gray-600 mt-1">{formatDate(process.fecha_radicacion)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleViewDetails(process.numero_radicacion)}
                      className="flex items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                      title="Ver detalles del proceso"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Ver Detalles</span>
                    </button>

                    <button
                      onClick={() => handleRemoveFavorite(process.numero_radicacion)}
                      className="flex items-center gap-2 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors whitespace-nowrap"
                      title="Quitar de favoritos"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Quitar</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyProcessesPage;
