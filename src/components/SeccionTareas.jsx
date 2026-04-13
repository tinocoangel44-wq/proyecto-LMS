import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTareasPorCurso, createTarea, enviarEntrega, getMisEntregas } from '../services/tareasService';
import { Card, CardBody, CardHeader } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Alert from './ui/Alert';
import Badge from './ui/Badge';

const SeccionTareas = ({ cursoId }) => {
  const navigate = useNavigate();
  const { role, perfil } = useAuth();
  const esDocente = role === 'administrador' || role === 'docente';

  const [tareas, setTareas] = useState([]);
  const [misEntregas, setMisEntregas] = useState([]);
  
  // Estado general de alertas
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // Estado creador de tarea (form Docente)
  const [nuevaTarea, setNuevaTarea] = useState({ titulo: '', instrucciones: '', fecha_limite: '' });

  // Estado enviador de entrega (form Estudiante)
  const [activoEntrega, setActivoEntrega] = useState(null); // ID de la tarea seleccionada a entregar
  const [newEntrega, setNewEntrega] = useState({ texto_entrega: '', enlace_entrega: '' });

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursoId, perfil]);

  const cargarDatos = async () => {
    const { data: listTareas } = await getTareasPorCurso(cursoId);
    if (listTareas) setTareas(listTareas);

    // Si es estudiante traemos sus registros para saber que botones apagar
    if (perfil?.id && !esDocente) {
      const { data: enviadas } = await getMisEntregas(perfil.id, cursoId);
      if (enviadas) setMisEntregas(enviadas);
    }
  };

  // HANDLER DOCENTE
  const handleCrearTarea = async (e) => {
    e.preventDefault();
    setMensaje({ tipo: '', texto: '' });
    const { error } = await createTarea({
      curso_id: cursoId,
      creado_por: perfil.id,
      titulo: nuevaTarea.titulo,
      instrucciones: nuevaTarea.instrucciones,
      fecha_limite: nuevaTarea.fecha_limite || null,
      estado: 'publicada'
    });

    if (error) {
      setMensaje({ tipo: 'error', texto: 'Falló la creación de actividad.' });
    } else {
      setMensaje({ tipo: 'success', texto: 'Tarea generada exitosamente.' });
      setNuevaTarea({ titulo: '', instrucciones: '', fecha_limite: '' });
      cargarDatos();
    }
  };

  // HANDLER ESTUDIANTE
  const handleSubmitEntrega = async (e, tareaId) => {
    e.preventDefault();
    setMensaje({ tipo: '', texto: '' });
    const payload = {
      tarea_id: tareaId,
      estudiante_id: perfil.id,
      texto_entrega: newEntrega.texto_entrega || null,
      enlace_entrega: newEntrega.enlace_entrega || null,
      estado: 'entregada'
    };

    const { error } = await enviarEntrega(payload);
    
    if (error) {
      if (error.code === '23505') {
        setMensaje({ tipo: 'error', texto: 'Error de duplicidad: Ya has realizado una entrega para esta actividad.' });
      } else {
         setMensaje({ tipo: 'error', texto: 'Ocurrió un error entregando el trabajo.' });
      }
    } else {
      setMensaje({ tipo: 'success', texto: '¡Trabajo enviado al servidor correctamente!' });
      setActivoEntrega(null);
      setNewEntrega({ texto_entrega: '', enlace_entrega: '' });
      cargarDatos();
    }
  };

  return (
    <div className="mt-16 pt-8 border-t border-slate-200 dark:border-dark-border">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Evaluaciones y Tareas</h2>
      
      {mensaje.texto && (
         <Alert type={mensaje.tipo} className="mb-6">
            {mensaje.texto}
         </Alert>
      )}

      {/* ZONA DE ADMINISTRACIÓN (DOCENTE) */}
      {esDocente && (
        <Card className="mb-8 border-yellow-200 bg-yellow-50/50 dark:bg-yellow-900/10 dark:border-yellow-900/30">
          <CardBody>
            <h3 className="font-bold text-yellow-800 dark:text-yellow-500 mb-4 flex items-center gap-2">
               <span>📝</span> Añadir Nueva Actividad Evaluada
            </h3>
            <form onSubmit={handleCrearTarea} className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                 <Input required label="TÍTULO DE LA TAREA" placeholder="Ej. Ensayo Unidad 1" className="flex-1" value={nuevaTarea.titulo} onChange={e=>setNuevaTarea({...nuevaTarea, titulo: e.target.value})} />
                 <Input type="datetime-local" label="FECHA LÍMITE" className="sm:w-64" value={nuevaTarea.fecha_limite} onChange={e=>setNuevaTarea({...nuevaTarea, fecha_limite: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1.5">
                 <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">INSTRUCCIONES Y RÚBRICA</label>
                 <textarea required placeholder="Instrucciones detalladas del entregable, formato esperado, etc..." value={nuevaTarea.instrucciones} onChange={e=>setNuevaTarea({...nuevaTarea, instrucciones: e.target.value})} className="px-4 py-2 bg-white dark:bg-dark-bg border border-slate-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white transition-colors h-24" />
              </div>
              <div className="flex justify-end mt-2">
                 <Button type="submit" variant="warning">Publicar Actividad</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {/* LISTADO GLOBAL DE TAREAS */}
      {tareas.length === 0 ? (
        <div className="bg-white dark:bg-dark-card border border-dashed border-slate-300 dark:border-dark-border rounded-xl p-8 text-center text-slate-500 dark:text-slate-400">
          Aún no hay tareas publicadas para este curso.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {tareas.map(tarea => {
             // Comprobaciones front-end para el Alumno
             const yaEntregadoDb = misEntregas.find(e => e.tarea_id === tarea.id);
             const isOverdue = tarea.fecha_limite && new Date() > new Date(tarea.fecha_limite);

             return (
               <Card key={tarea.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <CardBody className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">{tarea.titulo}</h3>
                        <p className="text-slate-600 dark:text-slate-300 mt-2 whitespace-pre-wrap text-sm">{tarea.instrucciones}</p>
                      </div>
                      <Badge variant={isOverdue ? 'danger' : 'success'} className="shrink-0">
                        {tarea.fecha_limite ? `Límite: ${new Date(tarea.fecha_limite).toLocaleString()}` : "Sin fecha límite"}
                      </Badge>
                    </div>
                    
                    {/* SI ES ESTUDIANTE RENDERIZAR BOTONES O FORMULARIO DE ENVIO */}
                    {!esDocente && (
                      <div className="mt-5 pt-5 border-t border-slate-100 dark:border-dark-border">
                         {yaEntregadoDb ? (
                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-900/10 p-3 rounded-lg border border-green-100 dark:border-green-900/30">
                              <span>✓</span> Trabajo Entregado exitosamente el {new Date(yaEntregadoDb.fecha_entrega).toLocaleString()}
                            </div>
                         ) : isOverdue ? (
                            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold bg-red-50 dark:bg-red-900/10 p-3 rounded-lg border border-red-100 dark:border-red-900/30">
                              <span>⚠️</span> Tiempo agotado. La entrega ha cerrado.
                            </div>
                         ) : (
                            <>
                              <Button 
                                 variant={activoEntrega === tarea.id ? "secondary" : "primary"}
                                 onClick={() => { setActivoEntrega(activoEntrega === tarea.id ? null : tarea.id); setMensaje({tipo:'', texto:''}); }}>
                                 {activoEntrega === tarea.id ? 'Cancelar Preparación' : 'Preparar Entrega'}
                              </Button>
                              
                              {/* FORMULARIO DESPLEGABLE EN PANTALLA */}
                              {activoEntrega === tarea.id && (
                                 <form onSubmit={(e) => handleSubmitEntrega(e, tarea.id)} className="mt-4 p-5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-lg animate-in slide-in-from-top-4 duration-300">
                                    <h4 className="font-bold text-slate-800 dark:text-white mb-3 text-sm">Anexa tu Solución:</h4>
                                    <div className="flex flex-col gap-3">
                                      <textarea 
                                        placeholder="Mensaje o cuerpo de texto resolutivo..." 
                                        value={newEntrega.texto_entrega} 
                                        onChange={e=>setNewEntrega({...newEntrega, texto_entrega: e.target.value})}
                                        className="px-4 py-3 bg-white dark:bg-dark-card border border-slate-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white transition-colors min-h-[100px]"
                                      />
                                      <Input 
                                        type="url" 
                                        placeholder="Enlace externo a tu trabajo (Google Drive, Github, Dropbox...)"
                                        value={newEntrega.enlace_entrega} 
                                        onChange={e=>setNewEntrega({...newEntrega, enlace_entrega: e.target.value})}
                                        className="w-full"
                                      />
                                      <div className="flex gap-3 justify-end mt-2">
                                        <Button type="button" variant="outline" onClick={() => setActivoEntrega(null)}>Cancelar</Button>
                                        <Button type="submit" variant="success">Concluir y Enviar Documento</Button>
                                      </div>
                                    </div>
                                 </form>
                              )}
                            </>
                         )}
                      </div>
                    )}
  
                    {/* SI ES DOCENTE, APROVECHAR PARA MOSTRAR LA LLAMADA A LA ACCIÓN A CALIFICACIONES */}
                    {esDocente && (
                      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-dark-border flex justify-end">
                         <Button variant="outline" size="sm" onClick={() => navigate(`/evaluaciones/tarea/${tarea.id}`)}>
                            Auditar y Calificar Entregas 
                         </Button>
                      </div>
                    )}
                  </CardBody>
               </Card>
             );
          })}
        </div>
      )}
    </div>
  );
};

export default SeccionTareas;
