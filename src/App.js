import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Registro from './pages/Registro';
import DashboardAdmin from './pages/DashboardAdmin';
import PanelDocente from './pages/PanelDocente';
import PanelEstudiante from './pages/PanelEstudiante';
import Cursos from './pages/Cursos';
import CursoDetalle from './pages/CursoDetalle';
import Perfil from './pages/Perfil';
import EvaluadorDocente from './pages/EvaluadorDocente';

// Despachador inteligente inicial que rutea según el Rol en AuthContext
const HomeRedirectRouter = () => {
  const { user, role, loading } = useAuth();
  
  if (loading) return <div>Cargando portal...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role === 'administrador') return <Navigate to="/dashboard-admin" replace />;
  if (role === 'docente') return <Navigate to="/panel-docente" replace />;
  if (role === 'estudiante') return <Navigate to="/panel-estudiante" replace />;
  
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App">
          <Routes>
            {/* Rutas Públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            
            {/* Raíz (Dispatcher) */}
            <Route path="/" element={<HomeRedirectRouter />} />

            {/* Rutas Privadas Generales (Cualquier persona autenticada) */}
            <Route path="/perfil" element={
              <ProtectedRoute>
                <Perfil />
              </ProtectedRoute>
            } />
            <Route path="/cursos/:id" element={
              <ProtectedRoute>
                <CursoDetalle />
              </ProtectedRoute>
            } />

            {/* Rutas Protegidas y Específicas por Rol */}
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
            
            {/* Módulo Gestor de Cursos (Solo Admin y Docentes) */}
            <Route path="/cursos" element={
              <ProtectedRoute allowedRoles={['administrador', 'docente']}>
                <Cursos />
              </ProtectedRoute>
            } />
            
            {/* Calificador de Alumnos */}
            <Route path="/evaluaciones/tarea/:id" element={
              <ProtectedRoute allowedRoles={['administrador', 'docente']}>
                <EvaluadorDocente />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
