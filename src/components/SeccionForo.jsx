import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getForosPorCurso, createForo, getMensajesPorForo, publicarMensaje } from '../services/forosService';
import { Card, CardBody } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';

const SeccionForo = ({ cursoId }) => {
  const { role, perfil } = useAuth();
  const esDocente = role === 'administrador' || role === 'docente';

  const [foros, setForos] = useState([]);
  const [foroActivo, setForoActivo] = useState(null); // NULL = Nivel Raíz (Listar Foros). ID = Dentro de un Foro.
  
  // Estado para un Foro específico
  const [mensajesThread, setMensajesThread] = useState([]);
  const [cajaRespuestaBase, setCajaRespuestaBase] = useState(''); // Respuesta al tema en general (No a un hijo)
  const [replyToId, setReplyToId] = useState(null); // Controla qué mensaje específico estamos respondiéndole
  const [cajaRespuestaHijo, setCajaRespuestaHijo] = useState('');

  // Estado creador de Foro (Sólo Docente)
  const [showFormForo, setShowFormForo] = useState(false);
  const [newForo, setNewForo] = useState({ titulo: '', descripcion: '' });

  useEffect(() => {
    cargarForos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursoId]);

  const cargarForos = async () => {
    const { data } = await getForosPorCurso(cursoId);
    if (data) setForos(data);
  };

  const cargarMensajesDelForo = async (fId) => {
    const { data } = await getMensajesPorForo(fId);
    if (data) {
      // Re-estructurar flat-array de Postgres a Árbol (Jerarquía de Hilos) en JavaScript Memoria
      const messageMap = new Map();
      const hilosRaiz = [];

      data.forEach(msg => {
         messageMap.set(msg.id, { ...msg, hijos: [] });
      });

      data.forEach(msg => {
         if (msg.parent_id && messageMap.has(msg.parent_id)) {
             messageMap.get(msg.parent_id).hijos.push(messageMap.get(msg.id));
         } else {
             hilosRaiz.push(messageMap.get(msg.id));
         }
      });

      setMensajesThread(hilosRaiz);
    }
  };

  const handleEntrarForo = (foro) => {
    setForoActivo(foro);
    cargarMensajesDelForo(foro.id);
  };

  const handleSalirForo = () => {
    setForoActivo(null);
    setMensajesThread([]);
  };

  const handleSubmitNuevoForo = async (e) => {
    e.preventDefault();
    await createForo({ cursoId, titulo: newForo.titulo, descripcion: newForo.descripcion });
    setNewForo({ titulo: '', descripcion: '' });
    setShowFormForo(false);
    cargarForos();
  };

  const handlePublicarMensaje = async (e, isChildReply) => {
    e.preventDefault();
    const contenidoMsg = isChildReply ? cajaRespuestaHijo : cajaRespuestaBase;
    const parentIdRef = isChildReply ? replyToId : null;

    if (!contenidoMsg.trim()) return;

    await publicarMensaje({
      foroId: foroActivo.id,
      autorId: perfil.id,
      parentId: parentIdRef,
      contenido: contenidoMsg
    });

    if (isChildReply) {
       setCajaRespuestaHijo('');
       setReplyToId(null);
    } else {
       setCajaRespuestaBase('');
    }
    
    // Refrescar hilo
    cargarMensajesDelForo(foroActivo.id);
  };

  // =============== MOTOR RECURSIVO DE RENDERIZADO DE HILOS ===============
  const RenderHilo = ({ moduloMensaje, nivelIndentacion }) => {
    // Topamos visualmente la anidación en la UI a un máximo (ej. paddingLeft)
    const pxLevel = Math.min(nivelIndentacion * 24, 64);
    const isRoot = nivelIndentacion === 0;

    return (
      <div 
        className={`mt-4 ${!isRoot ? 'border-l-2 border-slate-200 dark:border-slate-700' : ''}`}
        style={{ marginLeft: isRoot ? 0 : `${pxLevel}px`, paddingLeft: isRoot ? 0 : '16px' }}
      >
         {/* BLOQUE DEL MENSAJE */}
         <div className={`p-4 rounded-xl border transition-colors ${
            isRoot 
              ? 'bg-white dark:bg-dark-card border-slate-200 dark:border-dark-border shadow-sm' 
              : 'bg-slate-50 dark:bg-slate-800/50 border-transparent dark:border-transparent'
         }`}>
            <div className="flex justify-between items-center mb-2">
               <div className="flex items-center gap-2">
                 <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300 flex justify-center items-center text-xs font-bold shrink-0">
                    {moduloMensaje.perfiles_usuarios?.nombre_completo ? moduloMensaje.perfiles_usuarios.nombre_completo.charAt(0).toUpperCase() : '?'}
                 </div>
                 <strong className="text-sm text-primary-700 dark:text-primary-400">
                   {moduloMensaje.perfiles_usuarios?.nombre_completo || 'Usuario'}
                 </strong>
               </div>
               <span className="text-xs text-slate-400 font-medium">{new Date(moduloMensaje.created_at).toLocaleString()}</span>
            </div>
            
            <p className="text-sm p-1 text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{moduloMensaje.contenido}</p>
            
            <div className="mt-2 text-right">
              <button 
                onClick={() => setReplyToId(replyToId === moduloMensaje.id ? null : moduloMensaje.id)} 
                className="text-xs text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors border-none bg-transparent cursor-pointer inline-flex items-center gap-1"
              >
                <span>↳</span> {replyToId === moduloMensaje.id ? 'Cancelar cita' : 'Citar o Responder este hilo'}
              </button>
            </div>
         </div>

         {/* CAJA DE RESPUESTA ESPECIFICA (Solo visible si el usuario decide responderA !== null) */}
         {replyToId === moduloMensaje.id && (
            <div className="mt-3 p-4 bg-slate-50 dark:bg-dark-bg border border-dashed border-slate-300 dark:border-slate-600 rounded-lg animate-in fade-in duration-300">
               <form onSubmit={(e) => handlePublicarMensaje(e, true)} className="flex flex-col gap-3">
                  <textarea 
                     required
                     placeholder={`Redactar respuesta pública a ${moduloMensaje.perfiles_usuarios?.nombre_completo || ''}...`}
                     value={cajaRespuestaHijo}
                     onChange={e => setCajaRespuestaHijo(e.target.value)}
                     className="w-full h-20 px-3 py-2 text-sm bg-white dark:bg-dark-card border border-slate-300 dark:border-dark-border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white transition-colors"
                  />
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => { setReplyToId(null); setCajaRespuestaHijo('') }}>Anular</Button>
                    <Button type="submit" variant="primary" size="sm">Publicar Respuesta Menor</Button>
                  </div>
               </form>
            </div>
         )}

         {/* RENDERIZAR RECURSIVAMENTE LOS HIJOS (SUB-HILOS) */}
         {moduloMensaje.hijos && moduloMensaje.hijos.map(hijito => (
            <RenderHilo key={hijito.id} moduloMensaje={hijito} nivelIndentacion={nivelIndentacion + 1} />
         ))}
      </div>
    );
  };


  return (
    <div className="mt-16 pt-8 border-t border-slate-200 dark:border-dark-border">
      
      {/* VISTA 1: MENÚ GENERAL DE FOROS */}
      {!foroActivo && (
        <div className="animate-in fade-in fade-out">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
               <div>
                 <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Debate y Colaboración Asíncrona</h2>
                 <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Seleccione una sala de dudas o de interacción general.</p>
               </div>
               {esDocente && (
                 <Button onClick={() => setShowFormForo(!showFormForo)} variant="secondary">
                   {showFormForo ? 'Ocultar Creador' : '+ Cimentar Nuevo Foro'}
                 </Button>
               )}
            </div>

            {showFormForo && (
               <Card className="mb-6 border-slate-300 dark:border-dark-border bg-slate-50 dark:bg-dark-bg animate-in slide-in-from-top-4">
                  <CardBody>
                     <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-4 text-sm flex items-center gap-2">🌟 Definir Nueva Sala de Debate</h3>
                     <form onSubmit={handleSubmitNuevoForo} className="flex flex-col gap-3">
                        <Input required placeholder="Tema Central u Objeto de Debate" className="w-full" value={newForo.titulo} onChange={e=>setNewForo({...newForo, titulo:e.target.value})} />
                        <textarea placeholder="Descripción detallada de lo que se espera discutir..." className="w-full px-4 py-2 bg-white dark:bg-dark-card border border-slate-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white transition-colors min-h-[80px]" value={newForo.descripcion} onChange={e=>setNewForo({...newForo, descripcion:e.target.value})} />
                        <div className="flex justify-end mt-2">
                           <Button type="submit" variant="primary">Materializar Foro</Button>
                        </div>
                     </form>
                  </CardBody>
               </Card>
            )}

            <div className="flex flex-col gap-4">
               {foros.length === 0 ? (
                  <div className="text-center py-10 bg-white dark:bg-dark-card border border-dashed border-slate-300 dark:border-dark-border rounded-xl">
                    <p className="italic text-slate-400">No se han fundado espacios de debate para la materia.</p>
                  </div>
               ) : null}
               
               {foros.map(f => (
                  <div key={f.id} className="border-l-4 border-l-primary-500 bg-white dark:bg-dark-card border-y border-r border-slate-200 dark:border-dark-border p-5 rounded-r-xl shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group">
                     <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1 group-hover:text-primary-600 transition-colors">{f.titulo}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{f.descripcion}</p>
                     </div>
                     <Button variant="outline" className="shrink-0 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/10 group-hover:border-primary-200 dark:group-hover:border-primary-800" onClick={() => handleEntrarForo(f)}>
                        Ingresar al Debate →
                     </Button>
                  </div>
               ))}
            </div>
        </div>
      )}

      {/* VISTA 2: DENTRO DE UN FORO ESPECÍFICO (EL HIlo) */}
      {foroActivo && (
        <Card className="overflow-hidden border-slate-200 dark:border-dark-border shadow-md animate-in zoom-in-95 duration-300 h-full flex flex-col">
           <div className="bg-slate-800 dark:bg-slate-900 text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
             <div>
               <h3 className="font-bold text-lg flex items-center gap-2">
                  <span className="text-primary-400">🗣</span> {foroActivo.titulo}
               </h3>
               <p className="text-sm text-slate-400 mt-1">{foroActivo.descripcion}</p>
             </div>
             <button onClick={handleSalirForo} className="text-xs text-red-300 hover:text-red-100 uppercase tracking-widest shrink-0 transition-colors underline-offset-4 hover:underline">
               abandonar sala
             </button>
           </div>

           {/* CONTENEDOR DE CONVERSACIÓN */}
           <div className="p-6 bg-slate-50/50 dark:bg-dark-bg flex-1 min-h-[400px]">
              {mensajesThread.length === 0 ? (
                 <div className="text-center text-slate-400 dark:text-slate-500 mt-20 flex flex-col items-center">
                    <span className="text-4xl mb-4 opacity-50">🏜️</span>
                    <p>Este foro se encuentra inhóspito.</p>
                    <p className="font-medium text-slate-500 dark:text-slate-400 mt-1">¡Inyéctale vida y comparte el primer comentario!</p>
                 </div>
              ) : (
                 <div className="space-y-6">
                    {mensajesThread.map(mensajeRaiz => (
                       <RenderHilo key={mensajeRaiz.id} moduloMensaje={mensajeRaiz} nivelIndentacion={0} />
                    ))}
                 </div>
              )}
           </div>

           {/* BARRA DE ESCRITURA INFERIOR PARA TEMAS NUEVOS (NO RESPUESTAS A INDIVIDUOS) */}
           <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card mt-auto">
             <form onSubmit={(e) => handlePublicarMensaje(e, false)} className="flex flex-col sm:flex-row gap-3">
                <input 
                  required
                  placeholder="Introduce tu idea o postura global en la materia..." 
                  className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-dark-bg focus:border-primary-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white transition-all shadow-sm" 
                  value={cajaRespuestaBase}
                  onChange={e => setCajaRespuestaBase(e.target.value)}
                />
                <Button type="submit" variant="primary" className="h-12 px-8 shrink-0 shadow-sm font-bold tracking-wide">
                   Dialogar
                </Button>
             </form>
           </div>
        </Card>
      )}
    </div>
  );
};

export default SeccionForo;
