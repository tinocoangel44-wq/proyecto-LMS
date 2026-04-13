import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from './layout/DashboardLayout';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-dark-bg">
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Cargando sistema de permisos...</h2>
      </div>
    );
  }

  // Si no hay usuario se manda a identificación
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si existen restricciones de rol y el del usuario no coincide, expulsarlo y mandarlo a su respectivo tablero.
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    if (role === 'administrador') return <Navigate to="/dashboard-admin" replace />;
    if (role === 'docente') return <Navigate to="/panel-docente" replace />;
    if (role === 'estudiante') return <Navigate to="/panel-estudiante" replace />;
    
    // Fallback si no tiene rol esperado válido en el sistema
    return <Navigate to="/login" replace />;
  }

  // Aprobado, renderizar componente
  return <DashboardLayout>{children}</DashboardLayout>;
};

export default ProtectedRoute;
