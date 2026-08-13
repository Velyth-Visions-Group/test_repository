import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider } from '@/components/Toast';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import Login from '@/views/Login';
import RequestService from '@/views/RequestService';
import MyWeek from '@/views/MyWeek';
import Projects from '@/views/Projects';
import ProjectDetail from '@/views/ProjectDetail';
import Weeklies from '@/views/Weeklies';
import Intake from '@/views/Intake';
import Admin from '@/views/Admin';
import MyProject from '@/views/MyProject';
import DivisionPanel from '@/views/DivisionPanel';
import { hasAnyRole } from '@/lib/helpers';
import type { Role } from '@/types/database';

function DefaultRoute() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-900" />
      </div>
    );
  }

  if (!profile) return <Navigate to="/login" replace />;

  if (hasAnyRole(profile.roles, ['executor'])) return <Navigate to="/semana" replace />;
  if (hasAnyRole(profile.roles, ['lead', 'owner'])) return <Navigate to="/proyectos" replace />;
  if (hasAnyRole(profile.roles, ['cliente'])) return <Navigate to="/mi-proyecto" replace />;

  return (
    <div className="flex h-screen items-center justify-center bg-stone-50">
      <div className="text-center">
        <h2 className="text-lg font-medium text-stone-800">Sin acceso</h2>
        <p className="mt-2 text-sm text-stone-500">
          Su cuenta no tiene un rol asignado en el portal.
        </p>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/solicitar" element={<RequestService />} />

      {/* Protected routes */}
      <Route
        path="/panel"
        element={
          <ProtectedRoute roles={['owner', 'lead', 'executor'] as Role[]}>
            <Layout><DivisionPanel /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/semana"
        element={
          <ProtectedRoute roles={['executor', 'lead', 'owner'] as Role[]}>
            <Layout><MyWeek /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/proyectos"
        element={
          <ProtectedRoute roles={['lead', 'owner'] as Role[]}>
            <Layout><Projects /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/proyectos/:id"
        element={
          <ProtectedRoute roles={['lead', 'owner'] as Role[]}>
            <Layout><ProjectDetail /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/semanales"
        element={
          <ProtectedRoute roles={['owner', 'lead', 'executor'] as Role[]}>
            <Layout><Weeklies /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/intake"
        element={
          <ProtectedRoute roles={['owner', 'lead'] as Role[]}>
            <Layout><Intake /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['owner'] as Role[]}>
            <Layout><Admin /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/mi-proyecto"
        element={
          <ProtectedRoute roles={['cliente'] as Role[]}>
            <Layout><MyProject /></Layout>
          </ProtectedRoute>
        }
      />

      {/* Default */}
      <Route path="/" element={<DefaultRoute />} />
      <Route path="*" element={<DefaultRoute />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
