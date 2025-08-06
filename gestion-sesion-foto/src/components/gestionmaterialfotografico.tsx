import { useState, useEffect } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import API_BASE_URL from '../apiBaseUrl';

// Interfaces para los datos
interface Delivery {
  id: string | number;
  title: string;
  description: string;
  file_type: string;
  file_url: string;
  expiry_date?: string;
  is_active?: boolean;
  created_at: string;
  download_count?: number;
  session_title?: string;
  session_date?: string;
}

interface Session {
  id: string | number;
  title: string;
  user_name: string;
  date: string;
}

interface UploadData {
  session_id: string;
  title: string;
  description: string;
  file_type: string;
  file_url: string;
  expiry_date: string;
}

const PhotoDelivery = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadData, setUploadData] = useState<UploadData>({
    session_id: '',
    title: '',
    description: '',
    file_type: 'link',
    file_url: '',
    expiry_date: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [userRole, setUserRole] = useState('client');

  useEffect(() => {
    fetchData();
    // Get user role from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(user.role || 'client');
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch photo deliveries
      const deliveriesResponse = await fetch(`${API_BASE_URL}/api/photo-deliveries`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (deliveriesResponse.ok) {
        const deliveriesData = await deliveriesResponse.json();
        setDeliveries(deliveriesData);
      }

      // Fetch sessions for upload form (admin only)
      if (userRole === 'admin') {
        const sessionsResponse = await fetch(`${API_BASE_URL}/api/search?type=sessions`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (sessionsResponse.ok) {
          const sessionsData = await sessionsResponse.json();
          setSessions(sessionsData.sessions || []);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      // Add form fields
      (Object.keys(uploadData) as (keyof UploadData)[]).forEach(key => {
        if (uploadData[key]) {
          formData.append(key, uploadData[key]);
        }
      });

      // Add file if selected
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      const response = await fetch(`${API_BASE_URL}/api/photo-deliveries`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        alert('Material fotográfico subido exitosamente');
        setShowUploadForm(false);
        setUploadData({
          session_id: '',
          title: '',
          description: '',
          file_type: 'link',
          file_url: '',
          expiry_date: ''
        });
        setSelectedFile(null);
        fetchData(); // Refresh data
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error uploading:', error);
      alert('Error al subir el material');
    } finally {
      setUploading(false);
    }
  };

  const downloadFile = async (delivery: Delivery) => {
    if (delivery.file_type === 'link') {
      window.open(delivery.file_url, '_blank');
    } else {
      window.open(`${API_BASE_URL}${delivery.file_url}`, '_blank');
    }

    // Update download count
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/api/photo-deliveries/${delivery.id}/download`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error updating download count:', error);
    }
  };

  const getFileTypeIcon = (fileType: string) => {
    switch (fileType) {
      case 'link':
        return '🔗';
      case 'drive':
        return '💾';
      case 'dropbox':
        return '📦';
      case 'file':
        return '📁';
      default:
        return '📄';
    }
  };

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Material Fotográfico</h1>
          <p className="mt-2 text-sm text-gray-700">
            {userRole === 'admin' 
              ? 'Gestiona y entrega material fotográfico a los clientes'
              : 'Accede a tu material fotográfico entregado'
            }
          </p>
        </div>
        {userRole === 'admin' && (
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              onClick={() => setShowUploadForm(true)}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              📸 Subir Material
            </button>
          </div>
        )}
      </div>

      {/* Statistics for Admin */}
      {userRole === 'admin' && (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">📁</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Entregas
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {deliveries.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">📊</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Descargas Totales
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {deliveries.reduce((sum, d) => sum + (d.download_count || 0), 0)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">✅</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Entregas Activas
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {deliveries.filter(d => d.is_active && !isExpired(d.expiry_date)).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">⏰</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Próximas a Vencer
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {deliveries.filter(d => {
                        if (!d.expiry_date) return false;
                        let daysUntilExpiry = 0;
                        if (d.expiry_date) {
                          daysUntilExpiry = Math.ceil((new Date(d.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        }
                        return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
                      }).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deliveries Grid */}
      <div className="mt-8">
        {deliveries.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">📷</span>
            <h3 className="text-lg font-medium text-gray-900">No hay material disponible</h3>
            <p className="text-gray-500">
              {userRole === 'admin' 
                ? 'Comienza subiendo material fotográfico para tus clientes'
                : 'Cuando tengas material fotográfico disponible, aparecerá aquí'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deliveries.map((delivery) => (
              <div key={delivery.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="text-2xl mr-2">
                          {getFileTypeIcon(delivery.file_type)}
                        </span>
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {delivery.title}
                        </h3>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">
                        {delivery.description}
                      </p>

                      <div className="space-y-2 text-sm text-gray-500">
                        <div className="flex items-center">
                          <span className="font-medium mr-2">Sesión:</span>
                          <span>{delivery.session_title}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <span className="font-medium mr-2">Fecha:</span>
                          <span>{delivery.session_date ? new Date(delivery.session_date).toLocaleDateString('es-ES') : ''}</span>
                        </div>

                        {typeof delivery.download_count === 'number' && delivery.download_count > 0 && (
                          <div className="flex items-center">
                            <span className="font-medium mr-2">Descargas:</span>
                            <span>{delivery.download_count}</span>
                          </div>
                        )}

                        <div className="flex items-center">
                          <span className="font-medium mr-2">Subido:</span>
                          <span>{new Date(delivery.created_at).toLocaleDateString('es-ES')}</span>
                        </div>

                        {delivery.expiry_date && (
                          <div className="flex items-center">
                            <span className="font-medium mr-2">Vence:</span>
                            <span className={isExpired(delivery.expiry_date) ? 'text-red-600' : 'text-gray-500'}>
                              {delivery.expiry_date ? new Date(delivery.expiry_date).toLocaleDateString('es-ES') : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="ml-4">
                      {isExpired(delivery.expiry_date) ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Vencido
                        </span>
                      ) : delivery.is_active ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          Inactivo
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex justify-between items-center">
                    <button
                      onClick={() => downloadFile(delivery)}
                      disabled={!delivery.is_active || isExpired(delivery.expiry_date)}
                      className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md ${
                        delivery.is_active && !isExpired(delivery.expiry_date)
                          ? 'text-white bg-blue-600 hover:bg-blue-700'
                          : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                      }`}
                    >
                      <span className="mr-1">📥</span>
                      {delivery.file_type === 'link' ? 'Ver Material' : 'Descargar'}
                    </button>

                    {delivery.expiry_date && !isExpired(delivery.expiry_date) && (
                      <div className="text-xs text-gray-500">
                        {(() => {
                          if (delivery.expiry_date) {
                            const days = Math.ceil((new Date(delivery.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                            return days;
                          }
                          return '';
                        })()} días restantes
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Form Modal */}
      {showUploadForm && userRole === 'admin' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">Subir Material Fotográfico</h2>
              <button
                onClick={() => setShowUploadForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sesión *
                </label>
                <select
                  value={uploadData.session_id}
                  onChange={(e) => setUploadData({...uploadData, session_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar sesión...</option>
                  {sessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.title} - {session.user_name} ({new Date(session.date).toLocaleDateString('es-ES')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  value={uploadData.title}
                  onChange={(e) => setUploadData({...uploadData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Fotos editadas de la sesión familiar"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={uploadData.description}
                  onChange={(e) => setUploadData({...uploadData, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descripción del material entregado..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Entrega
                </label>
                <select
                  value={uploadData.file_type}
                  onChange={(e) => setUploadData({...uploadData, file_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="link">Enlace (Google Drive, Dropbox, etc.)</option>
                  <option value="file">Subir Archivo</option>
                </select>
              </div>

              {uploadData.file_type === 'link' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL del Material *
                  </label>
                  <input
                    type="url"
                    value={uploadData.file_url}
                    onChange={(e) => setUploadData({...uploadData, file_url: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://drive.google.com/..."
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Archivo *
                  </label>
                  <input
                    type="file"
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    accept=".jpg,.jpeg,.png,.gif,.pdf,.zip,.rar"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Formatos soportados: JPG, PNG, GIF, PDF, ZIP, RAR (máx. 100MB)
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Vencimiento (opcional)
                </label>
                <input
                  type="date"
                  value={uploadData.expiry_date}
                  onChange={(e) => setUploadData({...uploadData, expiry_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Si no se especifica, el material estará disponible indefinidamente
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUploadForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploading ? 'Subiendo...' : 'Subir Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoDelivery;