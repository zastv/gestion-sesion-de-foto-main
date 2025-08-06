import React, { useState, useEffect } from 'react';

// TypeScript interfaces for dashboard data
interface DashboardData {
  sessions: { total: number; this_month: number };
  payments: { total: number; total_amount: string; this_month_amount: string };
  users: { total: number; this_month: number };
  recentActivity: Array<RecentActivity>;
}
interface RecentActivity {
  action: string;
  created_at: string;
}
interface Stats {
  monthlySessions: Array<{ month: string; session_count: number; completed_count: number }>;
  monthlyIncome: Array<{ month: string; total_income: number }>;
  packageStats: Array<{ name: string; session_count: number }>;
  topClients: Array<{ name: string; email: string; session_count: number; total_spent: string }>;
}
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import API_BASE_URL from '../apiBaseUrl';

const AdminDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
    fetchStats();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendReminders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/admin/send-reminders`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        alert(data.message);
      }
    } catch (error) {
      console.error('Error sending reminders:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando panel administrativo...</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Panel Administrativo</h1>
              <p className="mt-1 text-sm text-gray-500">
                Gestiona tu estudio fotográfico desde aquí
              </p>
            </div>
            <button
              onClick={sendReminders}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Enviar Recordatorios
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Resumen', icon: '📊' },
              { id: 'sessions', name: 'Sesiones', icon: '📸' },
              { id: 'clients', name: 'Clientes', icon: '👥' },
              { id: 'finances', name: 'Finanzas', icon: '💰' },
              { id: 'reports', name: 'Reportes', icon: '📈' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
              >
                <span>{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && dashboardData && (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100">
                    <span className="text-2xl">📸</span>
                  </div>
                  <div className="ml-5">
                    <p className="text-sm font-medium text-gray-500">Total Sesiones</p>
                    <p className="text-2xl font-semibold text-gray-900">{dashboardData.sessions.total}</p>
                    <p className="text-sm text-green-600">+{dashboardData.sessions.this_month} este mes</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100">
                    <span className="text-2xl">💰</span>
                  </div>
                  <div className="ml-5">
                    <p className="text-sm font-medium text-gray-500">Ingresos Totales</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      ${parseFloat(dashboardData.payments.total_amount || '0').toFixed(2)}
                    </p>
                    <p className="text-sm text-green-600">
                      +${parseFloat(dashboardData.payments.this_month_amount || '0').toFixed(2)} este mes
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-yellow-100">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div className="ml-5">
                    <p className="text-sm font-medium text-gray-500">Total Clientes</p>
                    <p className="text-2xl font-semibold text-gray-900">{dashboardData.users.total}</p>
                    <p className="text-sm text-green-600">+{dashboardData.users.this_month} este mes</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100">
                    <span className="text-2xl">📋</span>
                  </div>
                  <div className="ml-5">
                    <p className="text-sm font-medium text-gray-500">Pagos Completados</p>
                    <p className="text-2xl font-semibold text-gray-900">{dashboardData.payments.total}</p>
                    <p className="text-sm text-gray-500">Total procesados</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            {stats && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Monthly Sessions Chart */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Sesiones por Mes</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.monthlySessions}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { month: 'short' })}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                      />
                      <Bar dataKey="session_count" fill="#2563eb" />
                      <Bar dataKey="completed_count" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Monthly Income Chart */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Ingresos por Mes</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={stats.monthlyIncome}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { month: 'short' })}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                        formatter={(value: string | number) => [`$${parseFloat(String(value)).toFixed(2)}`, 'Ingresos']}
                      />
                      <Line type="monotone" dataKey="total_income" stroke="#10b981" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Package Stats */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Popularidad de Paquetes</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={stats.packageStats}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: { name: string; percent?: number }) => `${name} ${percent !== undefined ? (percent * 100).toFixed(0) : '0'}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="session_count"
                      >
                        {stats.packageStats.map((_, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Top Clients */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Mejores Clientes</h3>
                  <div className="space-y-4">
                    {stats.topClients.slice(0, 5).map((client: Stats["topClients"][number], index: number) => (
                      <div key={client.email} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                            {index + 1}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{client.name}</p>
                            <p className="text-sm text-gray-500">{client.session_count} sesiones</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            ${parseFloat(client.total_spent || '0').toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">total gastado</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Actividad Reciente</h3>
              </div>
              <div className="px-6 py-4">
                <div className="space-y-4">
                  {dashboardData.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-xs text-gray-600">
                            {activity.action === 'session_created' && '📸'}
                            {activity.action === 'payment_created' && '💰'}
                            {activity.action === 'user_registered' && '👤'}
                            {!['session_created', 'payment_created', 'user_registered'].includes(activity.action) && '⚡'}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.action === 'session_created' && 'Nueva sesión creada'}
                          {activity.action === 'payment_created' && 'Pago registrado'}
                          {activity.action === 'user_registered' && 'Nuevo usuario registrado'}
                          {!['session_created', 'payment_created', 'user_registered'].includes(activity.action) && 
                           activity.action.replace(/_/g, ' ')}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(activity.created_at).toLocaleString('es-ES')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Acciones Rápidas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="mr-2">➕</span>
              Nueva Sesión
            </button>
            <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="mr-2">👥</span>
              Gestionar Clientes
            </button>
            <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="mr-2">📊</span>
              Ver Reportes
            </button>
            <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="mr-2">⚙️</span>
              Configuración
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;