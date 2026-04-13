import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import DashboardInsights from '../components/DashboardInsights';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';

const PanelDocente = () => {
  const { user, perfil } = useAuth();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Panel de Control del Docente</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Bienvenido Profesor: <strong className="text-primary-600 dark:text-primary-400">{perfil?.nombre_completo || user?.email}</strong>
        </p>
      </div>
      
      <DashboardInsights />

      <section className="mt-8">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Mis Herramientas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
           <Card className="hover:border-primary-300 dark:hover:border-primary-700 transition-colors cursor-pointer group">
             <Link to="/cursos" className="block h-full">
               <CardBody className="flex flex-col items-center justify-center p-8 h-full text-center">
                 <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">📚</div>
                 <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary-600 dark:group-hover:text-primary-400">Gestionar mis cursos</h3>
                 <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Crea, edita y administra tu plan académico</p>
               </CardBody>
             </Link>
           </Card>
        </div>
      </section>
    </div>
  );
};

export default PanelDocente;
