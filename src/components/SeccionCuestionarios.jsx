import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCuestionariosPorCurso, generarCuestionarioCompleto, calcularPuntajeExamen } from '../services/cuestionariosService';
import { Card, CardBody } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Alert from './ui/Alert';

const SeccionCuestionarios = ({ cursoId }) => {
  const { role, perfil } = useAuth();
  const esDocente = role === 'administrador' || role === 'docente';

  const [quizzes, setQuizzes] = useState([]);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  
  // ===============================
  // ESTADO: CREADOR MODO ACADÉMICO
  // ===============================
  const [modoCreacion, setModoCreacion] = useState(false);
  const [formQuiz, setFormQuiz] = useState({ titulo: '', instrucciones: '', fecha_limite: '' });
  
  // Gestor Dinámico de Memoria para Preguntas y Opciones Múltiples
  const [preguntasDraft, setPreguntasDraft] = useState([
    { enunciado: '', puntaje: 10, opciones: [ {texto: '', es_correcta: true}, {texto: '', es_correcta: false} ] }
  ]);

  // ===============================
  // ESTADO: EXAMINADOR ALUMNO
  // ===============================
  const [modoExamen, setModoExamen] = useState(null); // ID del cuestionario abriendose
  const [misRespuestas, setMisRespuestas] = useState([]); // Array de cruce {preguntaId, opcionId}
  const [resultadoFinal, setResultadoFinal] = useState(null);

  useEffect(() => {
    cargarQuizzes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursoId]);

  const cargarQuizzes = async () => {
    const { data } = await getCuestionariosPorCurso(cursoId);
    if (data) setQuizzes(data);
  };

  /** ------------- HANDLERS DOCENTE: CREADOR ------------- **/
  const handleAddPregunta = () => {
    setPreguntasDraft([ ...preguntasDraft, { enunciado: '', puntaje: 10, opciones: [ {texto: '', es_correcta: true}, {texto: '', es_correcta: false} ] }]);
  };

  const handleUpdatePregunta = (pIndex, field, value) => {
    const draft = [...preguntasDraft];
    draft[pIndex][field] = value;
    setPreguntasDraft(draft);
  };

  const handleAddOpcion = (pIndex) => {
    const draft = [...preguntasDraft];
    draft[pIndex].opciones.push({ texto: '', es_correcta: false });
    setPreguntasDraft(draft);
  };

  const handleUpdateOpcion = (pIndex, oIndex, texto) => {
    const draft = [...preguntasDraft];
    draft[pIndex].opciones[oIndex].texto = texto;
    setPreguntasDraft(draft);
  };

  const handleSetCorrectAnswer = (pIndex, oIndex) => {
    const draft = [...preguntasDraft];
    draft[pIndex].opciones.forEach((op, i) => op.es_correcta = (i === oIndex));
    setPreguntasDraft(draft);
  };

  const handleGuardarQuiz = async (e) => {
    e.preventDefault();
    setMensaje({ tipo: '', texto: 'Empacando cuestionario, no cierre esta ventana...' });
    
    const { success, error } = await generarCuestionarioCompleto({
      cursoId: cursoId,
      perfilId: perfil.id,
      titulo: formQuiz.titulo,
      instrucciones: formQuiz.instrucciones,
      limite: formQuiz.fecha_limite,
      preguntas: preguntasDraft
    });

    if (error) {
       setMensaje({ tipo: 'error', texto: 'Fallo al interactuar con Base de Datos.' });
    } else if (success) {
       setMensaje({ tipo: 'success', texto: '¡Examen registrado y ensamblado exitosamente!' });
       setModoCreacion(false);
       setFormQuiz({ titulo: '', instrucciones: '', fecha_limite: '' });
       setPreguntasDraft([{ enunciado: '', puntaje: 10, opciones: [{texto: '', es_correcta: true}, {texto: '', es_correcta: false}] }]);
       cargarQuizzes();
    }
  };


  /** ------------- HANDLERS ESTUDIANTE: EXAMINADOR ------------- **/
  const handleSeleccionarOpcion = (preguntaId, opcionId) => {
     const stateCopy = [...misRespuestas];
     const existe = stateCopy.find(r => r.pregunta_id === preguntaId);
     if (existe) {
         existe.opcion_seleccionada_id = opcionId;
     } else {
         stateCopy.push({ pregunta_id: preguntaId, opcion_seleccionada_id: opcionId });
     }
     setMisRespuestas(stateCopy);
  };

  const handleSubmitExamen = async (cuestionarioId) => {
     // Evaluar usando nuestro Motor en Services
     const veredicto = await calcularPuntajeExamen(cuestionarioId, misRespuestas);
     setResultadoFinal(veredicto);
  };

  return (
    <div className="mt-16 pt-8 border-t border-slate-200 dark:border-dark-border">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
         <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Centro de Exámenes y Cuestionarios</h2>
         {esDocente && !modoCreacion && (
           <Button onClick={() => setModoCreacion(true)} variant="secondary">
             + Construir Cuestionario
           </Button>
         )}
      </div>

      {mensaje.texto && (
         <Alert type={mensaje.tipo} className="mb-6">
            {mensaje.texto}
         </Alert>
      )}

      {/* RENDER MODO CREACIÓN (DOCENTE) */}
      {modoCreacion && esDocente && (
        <Card className="mb-8 border-indigo-200 bg-indigo-50/50 dark:bg-indigo-900/10 dark:border-indigo-900/30">
          <CardBody>
             <h3 className="font-bold text-indigo-800 dark:text-indigo-400 mb-4 flex items-center gap-2">
                <span>⚙️</span> Configuración del Cuestionario
             </h3>
             <form onSubmit={handleGuardarQuiz} className="flex flex-col gap-4">
               <Input required label="TÍTULO DEL EXAMEN" placeholder="Ej. Examen Parcial 1" className="w-full" value={formQuiz.titulo} onChange={e=>setFormQuiz({...formQuiz, titulo: e.target.value})} />
               <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">REGLAS O INSTRUCCIONES PREVIAS</label>
                  <textarea placeholder="Ej. Tienen 60 minutos, lea atentamente..." className="px-4 py-2 bg-white dark:bg-dark-bg border border-slate-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white transition-colors min-h-[80px]" value={formQuiz.instrucciones} onChange={e=>setFormQuiz({...formQuiz, instrucciones: e.target.value})} />
               </div>
               
               <hr className="my-6 border-indigo-200 dark:border-indigo-900/30" />
               
               <div>
                  <h4 className="font-bold text-slate-800 dark:text-white">Carga de Reactivos</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Agrega alternativas. Deberás marcar en el círculo cuál es la respuesta legalmente correcta que el sistema validará de forma automática.</p>
               </div>
               
               <div className="space-y-6 mt-4">
                 {preguntasDraft.map((preg, pIndex) => (
                    <div key={pIndex} className="p-5 border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-dark-card rounded-xl">
                       <div className="flex flex-col sm:flex-row gap-4 mb-4">
                          <div className="font-bold text-indigo-600 dark:text-indigo-400 w-8 py-2 shrink-0">#{pIndex + 1}</div>
                          <Input required label="ENUNCIADO ANALÍTICO" placeholder="Escriba la pregunta..." className="flex-1" value={preg.enunciado} onChange={(e) => handleUpdatePregunta(pIndex, 'enunciado', e.target.value)} />
                          <Input required type="number" label="VALOR PTS" placeholder="10" className="sm:w-24" value={preg.puntaje} onChange={(e) => handleUpdatePregunta(pIndex, 'puntaje', e.target.value)} />
                       </div>
  
                       {/* BLOQUE DE VARIANTES / OPCIONES */}
                       <div className="pl-0 sm:pl-12 space-y-3">
                         <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Posibles Respuestas (Incisos)</label>
                         {preg.opciones.map((opt, oIndex) => (
                            <div key={oIndex} className="flex flex-col sm:flex-row gap-3 sm:items-center">
                               <div className="flex items-center gap-2">
                                 <input 
                                   type="radio" 
                                   name={`correcta_${pIndex}`} 
                                   checked={opt.es_correcta} 
                                   onChange={() => handleSetCorrectAnswer(pIndex, oIndex)} 
                                   className="w-5 h-5 text-green-500 focus:ring-green-500 cursor-pointer"
                                 />
                                 <span className="text-sm font-medium text-slate-600 dark:text-slate-300 w-20">Opción {oIndex+1}</span>
                               </div>
                               <div className="flex-1 relative">
                                 <input 
                                   required 
                                   placeholder={`Texto de la opción`} 
                                   className={`w-full px-4 py-2 bg-slate-50 dark:bg-dark-bg border rounded-lg focus:outline-none focus:ring-2 dark:text-white transition-colors ${
                                      opt.es_correcta 
                                        ? 'border-green-500 focus:ring-green-500 bg-green-50/30 dark:bg-green-900/10' 
                                        : 'border-slate-300 dark:border-dark-border focus:ring-primary-500'
                                   }`}
                                   value={opt.texto} 
                                   onChange={(e) => handleUpdateOpcion(pIndex, oIndex, e.target.value)} 
                                 />
                                 {opt.es_correcta && <span className="absolute right-3 top-2.5 text-green-600 dark:text-green-400 text-xs font-bold uppercase tracking-wider">Correcta ✓</span>}
                               </div>
                            </div>
                         ))}
                         <button type="button" onClick={() => handleAddOpcion(pIndex)} className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline hover:text-indigo-800 transition-colors">
                           + Agregar variante inciso
                         </button>
                       </div>
                    </div>
                 ))}
               </div>
  
               <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 pt-6 border-t border-indigo-200 dark:border-indigo-900/30">
                 <Button type="button" variant="secondary" onClick={handleAddPregunta}>+ Añadir Nuevo Reactivo</Button>
                 
                 <div className="flex gap-3 w-full sm:w-auto">
                   <Button type="button" variant="outline" onClick={() => setModoCreacion(false)} className="flex-1 sm:flex-auto">Cancelar</Button>
                   <Button type="submit" variant="primary" className="flex-1 sm:flex-auto">✔ Guardar e Inyectar en Servidor</Button>
                 </div>
               </div>
             </form>
          </CardBody>
        </Card>
      )}

      {/* VISOR ESTÁNDAR GLOBAL DE CUESTIONARIOS DISPONIBLES */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
         {quizzes.map(cuest => {
             const esEsteTarget = modoExamen === cuest.id;
             return (
               <div key={cuest.id} className={`${esEsteTarget ? 'col-span-1 md:col-span-2 xl:col-span-3' : ''}`}>
                 <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                    {/* CABECERA */}
                    <div className="bg-slate-800 dark:bg-slate-900 text-white px-6 py-4">
                       <h3 className="font-bold text-lg">{cuest.titulo}</h3>
                       <p className="text-xs text-slate-300 mt-1 font-medium tracking-wide uppercase">{cuest.preguntas?.length || 0} Reactivos Totales</p>
                    </div>
  
                    {/* VISTA SIMPLIFICADA (CERRADO) */}
                    {!esEsteTarget && (
                       <CardBody className="flex flex-col h-full bg-white dark:bg-dark-card">
                          <p className="text-slate-600 dark:text-slate-300 text-sm flex-1">{cuest.instrucciones}</p>
                          {cuest.fecha_limite && <p className="text-red-500 dark:text-red-400 text-xs font-semibold mt-4 mb-2">⏰ Vence: {new Date(cuest.fecha_limite).toLocaleString()}</p>}
                          
                          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-dark-border">
                            <Button variant="primary" className="w-full" onClick={() => { setModoExamen(cuest.id); setMisRespuestas([]); setResultadoFinal(null) }}>
                              {esDocente ? 'Visualizar / Pre-Test' : 'Tomar Examen Ahora'}
                            </Button>
                          </div>
                       </CardBody>
                    )}
  
                    {/* VISTA EVALUADOR - MOTOR EN VIVO (ABIERTO) */}
                    {esEsteTarget && (
                       <CardBody className="bg-slate-50 dark:bg-dark-bg p-8">
                          {resultadoFinal ? (
                             <div className="text-center p-10 bg-green-50 dark:bg-green-900/10 border-2 border-green-200 dark:border-green-900/50 rounded-2xl max-w-2xl mx-auto animate-in zoom-in duration-500">
                                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Análisis Académico Finalizado</h2>
                                <div className="text-6xl font-extrabold text-green-600 dark:text-green-500 mb-6 drop-shadow-sm">{resultadoFinal.calificacionFinal}/100</div>
                                <p className="text-lg text-slate-600 dark:text-slate-300 mb-6 font-medium">Acertaste <strong className="text-slate-800 dark:text-white">{resultadoFinal.puntajeGanado}</strong> de {resultadoFinal.maximoPosible} puntos base.</p>
                                <Button onClick={() => setModoExamen(null)} variant="outline">Cerrar Modal Visual</Button>
                             </div>
                          ) : (
                             <div className="max-w-4xl mx-auto">
                                <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200 dark:border-dark-border">
                                   <p className="text-slate-500 font-medium italic">Responda cuidadosamente:</p>
                                   <div className="text-sm font-bold text-slate-400">Progreso: {misRespuestas.length} / {cuest.preguntas?.length || 0}</div>
                                </div>
                                
                                {cuest.preguntas?.map((preg, idx) => (
                                   <div key={preg.id} className="mb-8 p-6 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl shadow-sm">
                                      <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-start gap-3">
                                        <span className="shrink-0 bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-400 w-8 h-8 flex items-center justify-center rounded-full text-sm">{idx + 1}</span>
                                        <span className="pt-1">{preg.enunciado_pregunta}</span>
                                      </h4>
                                      
                                      <div className="space-y-3 pl-0 sm:pl-11">
                                        {preg.opciones_respuesta?.map(opc => (
                                           <label key={opc.id} className="flex items-center p-4 bg-slate-50 hover:bg-slate-100 dark:bg-dark-bg dark:hover:bg-slate-800 border border-slate-200 dark:border-dark-border rounded-lg cursor-pointer transition-colors group">
                                              <input 
                                                type="radio" 
                                                name={`live_${preg.id}`} 
                                                value={opc.id}
                                                onChange={() => handleSeleccionarOpcion(preg.id, opc.id)}
                                                className="w-5 h-5 text-primary-600 focus:ring-primary-500 cursor-pointer mr-4"
                                              />
                                              <span className="text-slate-700 dark:text-slate-200 font-medium">{opc.texto_opcion}</span>
                                           </label>
                                        ))}
                                      </div>
                                   </div>
                                ))}
  
                                <div className="flex flex-col sm:flex-row justify-between items-center mt-10 p-6 bg-slate-100 dark:bg-slate-800 rounded-xl gap-4">
                                    <button onClick={() => setModoExamen(null)} className="text-red-500 hover:text-red-700 font-semibold transition-colors">Retirarme Inconcluso</button>
                                    <Button onClick={() => handleSubmitExamen(cuest.id)} variant="success" className="w-full sm:w-auto h-12 px-8 text-lg">
                                      Cerrar Cuadernillo y Calificar
                                    </Button>
                                </div>
                             </div>
                          )}
                       </CardBody>
                    )}
                 </Card>
               </div>
             );
         })}
      </div>

    </div>
  );
};

export default SeccionCuestionarios;
