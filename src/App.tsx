import React from 'react';
import { createHashRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthLayout } from './layouts/AuthLayout';
import { AppLayout } from './layouts/AppLayout';
import { LoginForm } from './components/LoginForm';
import { VisitationForm } from './components/VisitationForm';
import { StrategicPointForm } from './components/StrategicPointForm';
import { VisitHistory } from './components/VisitHistory';
import { VisitMap } from './components/VisitMap';
import { CitizenManagement } from './components/CitizenManagement';
import { ProfessionalList } from './components/ProfessionalList';
import { NotificationList } from './components/NotificationList';
import { NotificationForm } from './components/NotificationForm';

// Componente de loading enquanto verifica autenticação
const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sus-blue mx-auto mb-4"></div>
        <p className="text-slate-600">Carregando...</p>
      </div>
    </div>
  );
};

// Wrapper para proteger rotas - redireciona para login se não autenticado
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return <LoadingScreen />;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Wrapper para proteger rotas de Admin
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

// Wrapper para passar user para componentes legados que esperam prop 'user'
const UserPageWrapper: React.FC<{ Component: React.ComponentType<any> }> = ({ Component }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Component user={user} />;
};

// Wrapper para redirecionar usuários autenticados que tentam acessar login
const LoginRouteWrapper: React.FC = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return <LoadingScreen />;
  }
  if (user) {
    return <Navigate to="/" replace />;
  }
  return <AuthLayout />;
};

const router = createHashRouter([
  {
    path: '/login',
    element: <LoginRouteWrapper />,
    children: [
      { index: true, element: <LoginForm /> }
    ]
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/visitas" replace /> },
      { path: 'visitas', element: <UserPageWrapper Component={VisitationForm} /> },
      { path: 'controle-vetorial', element: <UserPageWrapper Component={StrategicPointForm} /> },
      { path: 'historico', element: <UserPageWrapper Component={VisitHistory} /> },
      { path: 'mapa', element: <UserPageWrapper Component={VisitMap} /> },
      { path: 'cidadaos', element: <CitizenManagement /> },
      { path: 'notificacoes', element: <NotificationList /> },
      { path: 'notificacoes/nova', element: <NotificationForm /> },
      {
        path: 'profissionais',
        element: (
          <AdminRoute>
            <ProfessionalList />
          </AdminRoute>
        )
      }
    ]
  }
]);

import { Toaster } from 'sonner';

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" richColors closeButton />
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
