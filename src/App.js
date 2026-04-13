import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// ── Carga diferida (code splitting) para reducir el bundle inicial ─────────
// Cada página se convierte en un chunk separado — se carga solo cuando se necesita
const Login           = lazy(() => import('./pages/Login'));
const Registro        = lazy(() => import('./pages/Registro'));
const DashboardAdmin  = lazy(() => import('./pages/DashboardAdmin'));
const PanelDocente    = lazy(() => import('./pages/PanelDocente'));
const PanelEstudiante = lazy(() => import('./pages/PanelEstudiante'));
const Cursos          = lazy(() => import('./pages/Cursos'));
const CursoDetalle    = lazy(() => import('./pages/CursoDetalle'));
const Perfil          = lazy(() => import('./pages/Perfil'));
const EvaluadorDocente = lazy(() => import('./pages/EvaluadorDocente'));

// ── Spinner de carga elegante mientras se resuelven los chunks ────────────
const PageLoader = () => (
  <div className="min-h-screen bg-slate-50 dark:bg-dark-bg flex flex-col items-center justify-center gap-4">
    <div className="flex gap-2">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="w-3 h-3 bg-primary-500 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
    <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">Cargando...</p>
  </div>
);

// ── Despachador inteligente según rol ────────────────────────────────────
const HomeRedirectRouter = () => {
  const { user, role, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (!user)              return <Navigate to="/login" replace />;
  if (role === 'administrador') return <Navigate to="/dashboard-admin" replace />;
  if (role === 'docente')       return <Navigate to="/panel-docente" replace />;
  if (role === 'estudiante')    return <Navigate to="/panel-estudiante" replace />;

  return <Navigate to="/login" replace />;
};

// ── Layout principal con Suspense ────────────────────────────────────────
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Rutas Públicas */}
            <Route path="/login"    element={<Login />} />
            <Route path="/registro" element={<Registro />} />

            {/* Raíz (dispatcher) */}
            <Route path="/" element={<HomeRedirectRouter />} />

            {/* Rutas privadas generales */}
            <Route path="/perfil" element={
              <ProtectedRoute><Perfil /></ProtectedRoute>
            } />
            <Route path="/cursos/:id" element={
              <ProtectedRoute><CursoDetalle /></ProtectedRoute>
            } />

            {/* Roles específicos */}
            <Route path="/dashboard-admin" element={
              <ProtectedRoute allowedRoles={['administrador']}>
                <DashboardAdmin />
              </ProtectedRoute>
            } />
            <Route path="/panel-docente" element={
              <ProtectedRoute allowedRoles={['docente']}>
                <PanelDocente />
              </ProtectedRoute>
            } />
            <Route path="/panel-estudiante" element={
              <ProtectedRoute allowedRoles={['estudiante']}>
                <PanelEstudiante />
              </ProtectedRoute>
            } />

            {/* Catálogo (todos los roles) */}
            <Route path="/catalogo" element={
              <ProtectedRoute><Cursos /></ProtectedRoute>
            } />
            <Route path="/cursos" element={
              <ProtectedRoute><Cursos /></ProtectedRoute>
            } />

            {/* Calificador */}
            <Route path="/evaluaciones/tarea/:id" element={
              <ProtectedRoute allowedRoles={['administrador', 'docente']}>
                <EvaluadorDocente />
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
