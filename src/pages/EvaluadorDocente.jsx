import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getEntregasDeTarea, asentarCalificacion } from '../services/calificacionesService';
import { Card, CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const EvaluadorDocente = () => {
  const { id } = useParams(); // ID de la Tarea evaluada
  const navigate = useNavigate();
  const { perfil } = useAuth();
  
  const [entregas, setEntregas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados temporales de formulario para no cruzar información entre alumnos
  const [panelCalificar, setPanelCalificar] = useState(null); // guardara el ID de "entrega_tareas" a calificar
  const [formaNota, setFormaNota] = useState({ puntaje: '', cajaComentarios: '' });

  useEffect(() => {
    cargarTrabajos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const cargarTrabajos = async () => {
    setLoading(true);
    const { data } = await getEntregasDeTarea(id);
    if (data) setEntregas(data);
    setLoading(false);
  };

  const handleSubirCalificacion = async (e, entregaObj) => {
    e.preventDefault();
    
    await asentarCalificacion({
      estudianteId: entregaObj.estudiante_id,
      docenteId: perfil.id,
      tipoOrigen: 'tarea',
      origenId: entregaObj.id,
      calificacion: formaNota.puntaje,
      retroalimentacion: formaNota.cajaComentarios
    });

    setFormaNota({ puntaje: '', cajaComentarios: '' });
    setPanelCalificar(null);
    cargarTrabajos(); // refrescar
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 p-8">
        <div className="animate-pulse flex items-center space-x-2 text-slate-500">
          <div className="w-5 h-5 bg-slate-300 rounded-full animate-bounce"></div>
          <div className="w-5 h-5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-5 h-5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <span className="ml-2 font-medium">Iniciando sistema de rúbricas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      
      <div>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="mb-4 text-xs font-semibold">
          ← Regresar al Temario
        </Button>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
           <div>
             <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Bandeja de Trabajos Evaluables</h1>
             <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">ID Referencia Tarea: <span className="font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{id}</span></p>
           </div>
        </div>
      </div>

      {/* RENDER ALUMNOS Y SUS ENTREGAS */}
      {entregas.length === 0 ? (
        <Card className="border-dashed border-2 bg-slate-50/50 dark:bg-dark-bg">
          <CardBody className="p-12 text-center flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
             <span className="text-4xl mb-4">📥</span>
             <p className="text-lg font-medium">Ningún estudiante ha subido su tarea aún.</p>
          </CardBody>
        </Card>
      ) : (
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-slate-200 dark:border-dark-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800 dark:bg-slate-900 border-b border-slate-700 dark:border-black text-slate-100 uppercase tracking-wider text-xs font-bold font-inter">
                  <th className="px-6 py-4">Alumno Evaluado</th>
                  <th className="px-6 py-4">Sometido En</th>
                  <th className="px-6 py-4">Material Recibido</th>
                  <th className="px-6 py-4">Dictamen Académico</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-dark-border">
                {entregas.map(entrega => {
                   // Las calificaciones son un listado o null. Con nuestra UI sabemos q existira 1 maxima porque el alumno no reenvia tras entregar.
                   const tieneNota = entrega.calificaciones && entrega.calificaciones.length > 0;
                   const dictamenAcademico = tieneNota ? entrega.calificaciones[0] : null;
    
                   return (
                     <tr key={entrega.id} className={`${tieneNota ? 'bg-green-50/40 dark:bg-green-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'} transition-colors`}>
                        <td className="px-6 py-5 align-top">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center shrink-0">
                                {entrega.perfiles_usuarios?.nombre_completo ? entrega.perfiles_usuarios.nombre_completo.charAt(0).toUpperCase() : '?'}
                             </div>
                             <strong className="text-slate-800 dark:text-slate-200">{entrega.perfiles_usuarios?.nombre_completo || 'Usuario Extraviado'}</strong>
                          </div>
                        </td>
                        <td className="px-6 py-5 align-top text-sm text-slate-600 dark:text-slate-400">
                          {new Date(entrega.fecha_entrega).toLocaleString()}
                        </td>
                        <td className="px-6 py-5 align-top">
                           <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap mb-3 italic">{entrega.texto_entrega || 'Sin comentarios en caja de texto.'}</p>
                           {entrega.enlace_entrega && (
                             <a href={entrega.enlace_entrega} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-xs font-semibold rounded-md transition-colors">
                               <span>🔗</span> Ver Archivo Externo
                             </a>
                           )}
                        </td>
                        
                        {/* ACCIONES DE PROFESOR */}
                        <td className="px-6 py-5 align-top min-w-[280px]">
                           {tieneNota ? (
                              <div className="bg-white dark:bg-dark-card p-3 rounded-lg border border-green-200 dark:border-green-900/50 shadow-sm">
                                <div className="text-2xl font-extrabold text-green-600 dark:text-green-500 mb-1 flex items-center gap-2">
                                  <span>{dictamenAcademico.calificacion}</span> <span className="text-sm text-green-800 dark:text-green-400">/ 100 PTS</span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2 rounded line-clamp-3">
                                  "{dictamenAcademico.retroalimentacion || 'Sin comentarios adicionales'}"
                                </p>
                              </div>
                           ) : (
                              <>
                                {panelCalificar === entrega.id ? (
                                   <form onSubmit={(e) => handleSubirCalificacion(e, entrega)} className="flex flex-col gap-3 animate-in slide-in-from-right-4 duration-300 border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-lg">
                                      <h4 className="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase">Panel Evaluador</h4>
                                      <Input 
                                         required 
                                         type="number" step="0.1" min="0" max="100"
                                         placeholder="Calificación (0 - 100)" 
                                         value={formaNota.puntaje} onChange={e=>setFormaNota({...formaNota, puntaje: e.target.value})} 
                                         className="w-full text-center font-bold text-lg"
                                      />
                                      <textarea 
                                         placeholder="Feedback o Retroalimentación obligatoria..." 
                                         value={formaNota.cajaComentarios} onChange={e=>setFormaNota({...formaNota, cajaComentarios: e.target.value})}
                                         className="w-full text-sm p-2 bg-white dark:bg-dark-bg border border-slate-300 dark:border-dark-border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                         rows="3"
                                         required
                                      />
                                      <div className="flex gap-2 mt-1">
                                        <Button type="button" variant="outline" size="sm" onClick={() => setPanelCalificar(null)} className="flex-1">Cancelar</Button>
                                        <Button type="submit" variant="primary" size="sm" className="flex-1">Aplicar Calificación</Button>
                                      </div>
                                   </form>
                                ) : (
                                   <Button variant="warning" onClick={() => setPanelCalificar(entrega.id)} className="w-full shadow-sm font-semibold">
                                     + Auditar y Calificar Alumno
                                   </Button>
                                )}
                              </>
                           )}
                        </td>
                     </tr>
                   )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvaluadorDocente;
