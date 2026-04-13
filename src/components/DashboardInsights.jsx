import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchDashboardData } from '../services/dashboardService';
import CitaMotivacional from './CitaMotivacional';
import { Card, CardBody, CardHeader } from './ui/Card';
import Badge from './ui/Badge';

const DashboardInsights = () => {
  const { role, perfil } = useAuth();
  const [indicadores, setIndicadores] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (perfil?.id && role) {
       cargarData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perfil, role]);

  const cargarData = async () => {
    setLoading(true);
    const data = await fetchDashboardData(role, perfil.id);
    setIndicadores(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 p-8">
        <div className="animate-pulse flex items-center space-x-2 text-slate-500">
          <div className="w-5 h-5 bg-slate-300 rounded-full animate-bounce"></div>
          <div className="w-5 h-5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-5 h-5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <span className="ml-2 font-medium">Analizando Métricas...</span>
        </div>
      </div>
    );
  }
  
  if (!indicadores) return null;

  return (
    <div className="mt-8 space-y-6">
      
      <CitaMotivacional />
      
      {/* ===================== VISTA ESTUDIANTE ===================== */}
      {role === 'estudiante' && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Boleta */}
            <Card>
               <CardHeader>
                  <h3 className="font-bold text-lg text-green-700 dark:text-green-400">Últimas Calificaciones</h3>
               </CardHeader>
               <CardBody>
                 {indicadores.calificaciones.length === 0 ? (
                   <p className="text-slate-500 dark:text-slate-400 text-sm italic py-4 text-center">Sin evaluaciones registradas.</p>
                 ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-dark-border -my-2 flex flex-col gap-2">
                      {indicadores.calificaciones.map((nota, i) => (
                         <li key={i} className="flex justify-between items-center py-3">
                           <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{nota.titulo_actividad}</span>
                           <Badge variant="success" className="text-sm px-3 py-1">{nota.calificacion} / 100</Badge>
                         </li>
                      ))}
                    </ul>
                 )}
               </CardBody>
            </Card>

            {/* Pendientes */}
            <Card>
               <CardHeader>
                  <h3 className="font-bold text-lg text-red-600 dark:text-red-400">Atención a Caducidad</h3>
               </CardHeader>
               <CardBody>
                 {indicadores.pendientes.length === 0 ? (
                   <p className="text-slate-500 dark:text-slate-400 text-sm italic py-4 text-center">¡Excelente! Estás al corriente.</p>
                 ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-dark-border -my-2 flex flex-col gap-2">
                      {indicadores.pendientes.map((act, i) => (
                         <li key={i} className="py-3">
                           <div className="flex justify-between items-start mb-1">
                             <strong className="text-sm text-slate-800 dark:text-slate-200">{act.titulo}</strong>
                             <Badge variant="danger" className="uppercase text-[10px] tracking-wider">{act.tipo}</Badge>
                           </div>
                           <div className="text-xs text-slate-500 dark:text-slate-400">
                              {act.fecha_limite ? `Vence: ${new Date(act.fecha_limite).toLocaleDateString()}` : 'Sin límite'}
                           </div>
                         </li>
                      ))}
                    </ul>
                 )}
               </CardBody>
            </Card>
         </div>
      )}

      {/* ===================== VISTA DOCENTE ===================== */}
      {role === 'docente' && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/20 dark:to-dark-card border-primary-100 dark:border-primary-900/50">
               <CardBody>
                 <h3 className="text-primary-700 dark:text-primary-400 font-bold mb-4">Resumen de Cátedra</h3>
                 <div className="text-5xl font-extrabold text-slate-800 dark:text-white flex items-baseline gap-2">
                   {indicadores.misCursos.length} 
                   <span className="text-lg font-medium text-slate-500 dark:text-slate-400">Cursos Impartidos</span>
                 </div>
               </CardBody>
            </Card>

            <Card>
               <CardHeader>
                 <h3 className="font-bold text-yellow-600 dark:text-yellow-500">Entregas para Evaluar</h3>
               </CardHeader>
               <CardBody>
                 {indicadores.pendientes.length === 0 ? (
                   <p className="text-slate-500 dark:text-slate-400 text-sm italic py-4 text-center">Bandeja limpia.</p>
                 ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-dark-border -my-2 flex flex-col gap-2">
                      {indicadores.pendientes.map((ent, i) => (
                         <li key={i} className="py-3">
                           <strong className="text-sm block text-slate-800 dark:text-slate-200">{ent.perfiles_usuarios?.nombre_completo}</strong>
                           <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{ent.tareas?.titulo}</div>
                         </li>
                      ))}
                    </ul>
                 )}
               </CardBody>
            </Card>
         </div>
      )}

      {/* ===================== VISTA ADMINISTRADOR ===================== */}
      {role === 'administrador' && indicadores.resumenGlobal && (
         <div className="space-y-6">
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             <Card className="bg-slate-800 border-none dark:bg-slate-900 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 blur-sm text-8xl">👥</div>
                <CardBody className="text-center relative z-10 py-10">
                  <div className="text-5xl font-extrabold text-white mb-2">{indicadores.resumenGlobal.usuarios_activos}</div>
                  <div className="text-slate-300 font-medium tracking-wide uppercase text-sm">Usuarios Activos</div>
                </CardBody>
             </Card>
             
             <Card className="bg-indigo-600 border-none dark:bg-indigo-900 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 blur-sm text-8xl">📚</div>
                <CardBody className="text-center relative z-10 py-10">
                  <div className="text-5xl font-extrabold text-white mb-2">{indicadores.resumenGlobal.cursos_activos}</div>
                  <div className="text-indigo-200 font-medium tracking-wide uppercase text-sm">Cursos Construidos</div>
                </CardBody>
             </Card>
           </div>

           <Card>
              <CardHeader>
                <h3 className="font-bold text-slate-800 dark:text-white">Monitor de Mensajería Forense</h3>
              </CardHeader>
              <CardBody>
                 {indicadores.mensajesRecientes.length === 0 ? (
                   <p className="text-slate-500 dark:text-slate-400 text-sm italic py-4 text-center">Sin flujos de comunicación detectados.</p>
                 ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-dark-border -my-2 flex flex-col gap-2">
                      {indicadores.mensajesRecientes.map((m, i) => (
                         <li key={i} className="py-4">
                           <div className="flex items-center gap-2 mb-2">
                             <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                               {m.perfiles_usuarios?.nombre_completo?.charAt(0) || '?'}
                             </div>
                             <strong className="text-sm text-slate-700 dark:text-slate-200">{m.perfiles_usuarios?.nombre_completo}</strong>
                             <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">{new Date(m.created_at).toLocaleString()}</span>
                           </div>
                           <div className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-dark-bg p-3 rounded-lg border border-slate-100 dark:border-dark-border border-l-4 border-l-slate-300 dark:border-l-slate-600">
                             "{m.contenido}"
                           </div>
                         </li>
                      ))}
                    </ul>
                 )}
              </CardBody>
           </Card>
         </div>
      )}

    </div>
  );
};

export default DashboardInsights;
