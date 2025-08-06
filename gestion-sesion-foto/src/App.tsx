import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
// import Navbar from "./components/Navbar";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import GalleryPage from "./pages/Gallery";
import PackagesPage from "./pages/Packages";
import ForgotPasswordPage from "./pages/ForgotPassword";
// import ChangePasswordPage from "./pages/ChangePassword";

// New components
// import AdminDashboard from "./components/AdminDashboard";
// import UserManagement from "./components/UserManagement";
// import PaymentManagement from "./components/PaymentManagement";
// import UserProfile from "./components/UserProfile";
// import PhotoDelivery from "./components/PhotoDelivery";
// import Reports from "./components/Reports";

// Protected Route component
interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}
function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      try {
        const userData = JSON.parse(user);
        setIsAuthenticated(true);
        setUserRole(userData.role);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && userRole !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🚫</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">Acceso Denegado</h2>
          <p className="text-gray-500">No tienes permisos para acceder a esta página.</p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return children;
}

// Enhanced Navbar for role-based navigation
interface User {
  name: string;
  role: string;
  [key: string]: any;
}
function EnhancedNavbar() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-blue-600">📸 LunaStudios</h1>
            </div>
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              {user?.role === 'admin' ? (
                <>
                  <a href="/admin" className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium">
                    Panel Admin
                  </a>
                  <a href="/admin/users" className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium">
                    Usuarios
                  </a>
                  <a href="/admin/payments" className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium">
                    Pagos
                  </a>
                  <a href="/photo-delivery" className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium">
                    Material
                  </a>
                  <a href="/reports" className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium">
                    Reportes
                  </a>
                </>
              ) : (
                <>
                  <a href="/dashboard" className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium">
                    Sesiones
                  </a>
                  <a href="/gallery" className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium">
                    Galería
                  </a>
                  <a href="/packages" className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium">
                    Paquetes
                  </a>
                  <a href="/photo-delivery" className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium">
                    Mi Material
                  </a>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="relative group">
                  <button className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {user.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="ml-2 text-gray-700">{user.name}</span>
                  </button>
                  
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-1">
                      <a href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Mi Perfil
                      </a>
                      <a href="/change-password" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Cambiar Contraseña
                      </a>
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex space-x-4">
                <a href="/login" className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium">
                  Iniciar Sesión
                </a>
                <a href="/register" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                  Registrarse
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>

  );
}

function App() {
  useEffect(() => {
    // Session timeout management
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const resetTimeout = () => {
      if (timeoutId) clearTimeout(timeoutId);
      const token = localStorage.getItem('token');
      if (token) {
        // Refresh session every 25 minutes (before 30-minute timeout)
        timeoutId = setTimeout(async () => {
          try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}/api/refresh-session`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            if (!response.ok) {
              // Session expired, redirect to login
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/login';
            }
          } catch (error) {
            console.error('Session refresh error:', error);
          }
        }, 25 * 60 * 1000); // 25 minutes
      }
    };
    // Reset timeout on user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const resetTimeoutHandler = () => resetTimeout();
    events.forEach(event => {
      document.addEventListener(event, resetTimeoutHandler, true);
    });
    resetTimeout(); // Initial setup
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => {
        document.removeEventListener(event, resetTimeoutHandler, true);
      });
    };
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <EnhancedNavbar />
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <EnhancedNavbar />
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/gallery" element={
            <ProtectedRoute>
              <EnhancedNavbar />
              <GalleryPage />
            </ProtectedRoute>
          } />
          
          <Route path="/packages" element={
            <ProtectedRoute>
              <EnhancedNavbar />
              <PackagesPage />
            </ProtectedRoute>
          } />
          
          {/* Removed routes for missing components: UserProfile, PhotoDelivery, AdminDashboard, UserManagement, PaymentManagement, Reports */}

          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;