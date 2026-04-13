import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getEstructuraCurso, createModulo, deleteModulo, createMaterial, deleteMaterial } from '../services/contenidosService';
import SeccionTareas from '../components/SeccionTareas';
import SeccionCuestionarios from '../components/SeccionCuestionarios';
import SeccionForo from '../components/SeccionForo';
import { Card, CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';

const CursoDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role, perfil } = useAuth();
  
  const [modulos, setModulos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para Modal de Módulo
  const [showModForm, setShowModForm] = useState(false);
  const [newModulo, setNewModulo] = useState({ titulo: '', descripcion: '', orden: 1 });

  // Estados para Modal de Material
  const [showMatForm, setShowMatForm] = useState(null); // guardará el ID del módulo destino
  const [newMaterial, setNewMaterial] = useState({ titulo: '', descripcion: '', tipo_material: 'texto', url_contenido: '', orden: 1 });

  const esAdministradorODocente = role === 'administrador' || role === 'docente';

  useEffect(() => {
    cargarContenido();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const cargarContenido = async () => {
    setLoading(true);
    const { data } = await getEstructuraCurso(id);
    if (data) setModulos(data);
    setLoading(false);
  };

  // --- Handlers de Módulos ---
  const handleModuloSubmit = async (e) => {
    e.preventDefault();
    await createModulo({
      curso_id: id,
      titulo: newModulo.titulo,
      descripcion: newModulo.descripcion,
      orden: parseInt(newModulo.orden)
    });
    setNewModulo({ titulo: '', descripcion: '', orden: 1 });
    setShowModForm(false);
    cargarContenido();
  };

  const handleBorrarModulo = async (modId) => {
    if(window.confirm('¿Eliminar módulo y todos sus materiales internos?')) {
      await deleteModulo(modId);
      cargarContenido();
    }
  };

  // --- Handlers de Materiales ---
  const handleMaterialSubmit = async (e, moduloId) => {
    e.preventDefault();
    await createMaterial({
      modulo_id: moduloId,
      titulo: newMaterial.titulo,
      descripcion: newMaterial.descripcion,
      tipo_material: newMaterial.tipo_material,
      url_contenido: newMaterial.url_contenido,
      orden: parseInt(newMaterial.orden),
      publicado_por: perfil?.id
    });
    setNewMaterial({ titulo: '', descripcion: '', tipo_material: 'texto', url_contenido: '', orden: 1 });
    setShowMatForm(null);
    cargarContenido();
  };

  const handleBorrarMaterial = async (matId) => {
    if(window.confirm('¿Eliminar este material?')) {
      await deleteMaterial(matId);
      cargarContenido();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 p-8">
        <div className="animate-pulse flex items-center space-x-2 text-slate-500">
          <div className="w-5 h-5 bg-slate-300 rounded-full animate-bounce"></div>
          <div className="w-5 h-5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-5 h-5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <span className="ml-2 font-medium">Cargando estructura del curso...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-20">
      
      {/* Header View */}
      <div>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="mb-4 text-xs">
          ← Volver al Listado
        </Button>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
             <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Estructura del Curso <span className="text-slate-400 font-medium text-xl">#{id.slice(0,8)}</span></h1>
             <p className="text-slate-500 dark:text-slate-400 mt-2">Gestiona el contenido estructurado del temario</p>
          </div>
          {esAdministradorODocente && (
            <Button 
              variant={showModForm ? "secondary" : "primary"}
              onClick={() => setShowModForm(!showModForm)} 
            >
              {showModForm ? 'Ocultar Creador' : '+ Añadir Nuevo Módulo'}
            </Button>
          )}
        </div>
      </div>

      {/* Formulario de Creación de Módulo */}
      {showModForm && esAdministradorODocente && (
        <Card className="border-primary-100 bg-primary-50 dark:bg-primary-900/10 dark:border-primary-900/30">
          <CardBody>
            <h3 className="font-bold text-primary-800 dark:text-primary-300 mb-4">✨ Crear Nuevo Módulo Académico</h3>
            <form onSubmit={handleModuloSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Input required label="TÍTULO DEL MÓDULO" placeholder="Ej. Unidad 1: Fundamentos..." className="flex-1" value={newModulo.titulo} onChange={e => setNewModulo({...newModulo, titulo: e.target.value})} />
                <Input type="number" required label="ORDEN (NÚMERO)" placeholder="1" className="sm:w-32" value={newModulo.orden} onChange={e => setNewModulo({...newModulo, orden: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1.5">
                 <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">DESCRIPCIÓN (Opcional)</label>
                 <textarea 
                   placeholder="Instrucciones generales de este bloque..." 
                   rows="2"
                   className="px-4 py-2 bg-white dark:bg-dark-bg border border-slate-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white transition-colors"
                   value={newModulo.descripcion} 
                   onChange={e => setNewModulo({...newModulo, descripcion: e.target.value})} 
                 />
              </div>
              <div className="flex justify-end mt-2">
                 <Button type="submit" variant="primary">Guardar Módulo</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {/* Renderizado de Árbol (Módulo -> Material) */}
      {modulos.length === 0 ? (
        <div className="bg-white dark:bg-dark-card border border-dashed border-slate-300 dark:border-dark-border rounded-xl p-12 text-center text-slate-500 dark:text-slate-400">
          <div className="text-4xl mb-4 text-slate-300">📂</div>
          <p>El profesorado aún no ha asignado contenido sistemático a este curso.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {modulos.map(modulo => (
            <Card key={modulo.id} className="overflow-hidden shadow-sm">
              
              {/* Cabecera del Módulo */}
              <div className="bg-slate-50 dark:bg-dark-bg px-6 py-5 border-b border-slate-200 dark:border-dark-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                     <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 w-8 h-8 rounded-full flex items-center justify-center text-sm">{modulo.orden}</span> 
                     {modulo.titulo}
                  </h2>
                  {modulo.descripcion && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 pl-10">{modulo.descripcion}</p>}
                </div>
                {esAdministradorODocente && (
                  <div className="flex gap-2 shrink-0 md:ml-4">
                    <Button variant="outline" size="sm" onClick={() => setShowMatForm(showMatForm === modulo.id ? null : modulo.id)}>
                      {showMatForm === modulo.id ? 'Cerrar' : '+ Material'}
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleBorrarModulo(modulo.id)}>
                      Eliminar
                    </Button>
                  </div>
                )}
              </div>

              {/* Formulario Inline para Materiales */}
              {showMatForm === modulo.id && esAdministradorODocente && (
                <div className="bg-indigo-50/50 dark:bg-indigo-900/10 px-6 py-5 border-b border-indigo-100 dark:border-indigo-900/30">
                  <h4 className="font-bold text-indigo-800 dark:text-indigo-300 mb-3 text-sm flex items-center gap-2">
                     <span>📎</span> Asignar Nuevo Recurso
                  </h4>
                  <form onSubmit={(e) => handleMaterialSubmit(e, modulo.id)} className="flex flex-col gap-3">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-5">
                         <Input required placeholder="Nombre del recurso (Ej. Diapositivas Tema 1)" value={newMaterial.titulo} onChange={e=>setNewMaterial({...newMaterial, titulo:e.target.value})} className="w-full" />
                      </div>
                      <div className="sm:col-span-4">
                         <select className="w-full px-4 py-2 h-[42px] bg-white dark:bg-dark-card border border-slate-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white transition-colors" value={newMaterial.tipo_material} onChange={e=>setNewMaterial({...newMaterial, tipo_material:e.target.value})}>
                           <option value="texto">Lectura de Texto</option>
                           <option value="video">Reproducción de Vídeo</option>
                           <option value="enlace">Enlace/Hipervínculo</option>
                           <option value="archivo">Archivo Anexo</option>
                         </select>
                      </div>
                      <div className="sm:col-span-3">
                         <Input required type="number" placeholder="Orden" value={newMaterial.orden} onChange={e=>setNewMaterial({...newMaterial, orden:e.target.value})} className="w-full" />
                      </div>
                    </div>
                    <Input placeholder="Contenido Markdown o URL (http://...)" value={newMaterial.url_contenido} onChange={e=>setNewMaterial({...newMaterial, url_contenido:e.target.value})} className="w-full" />
                    
                    <div className="flex justify-end gap-2 mt-2">
                       <Button type="submit" variant="primary" size="sm">Confirmar y Añadir</Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Lista de Materiales vinculados */}
              <div className="p-6">
                {(!modulo.materiales || modulo.materiales.length === 0) ? (
                  <div className="text-sm italic text-slate-400 text-center py-2">Ningún material inyectado en este módulo.</div>
                ) : (
                  <ul className="divide-y divide-slate-100 dark:divide-dark-border -my-2">
                    {modulo.materiales.map(mat => (
                       <li key={mat.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
                         <div className="flex items-start sm:items-center gap-3">
                            <Badge 
                              variant={
                                 mat.tipo_material === 'video' ? 'danger' : 
                                 mat.tipo_material === 'archivo' ? 'warning' : 'primary'
                              }
                              className="uppercase text-[10px] whitespace-nowrap mt-1 sm:mt-0"
                            >
                              {mat.tipo_material}
                            </Badge>
                            <span className="text-slate-800 dark:text-slate-200">
                               <b className="text-slate-500 mr-2">{mat.orden}.</b>
                               {mat.titulo}
                            </span>
                            {mat.url_contenido && (
                               <a href={mat.url_contenido} target="_blank" rel="noreferrer" className="text-xs text-primary-600 dark:text-primary-400 hover:underline shrink-0">
                                 [Abrir enlace]
                               </a>
                            )}
                         </div>
                         {esAdministradorODocente && (
                           <button 
                             onClick={() => handleBorrarMaterial(mat.id)} 
                             className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity self-end sm:self-auto px-2"
                             title="Eliminar recurso"
                           >
                             ✖
                           </button>
                         )}
                       </li>
                    ))}
                  </ul>
                )}
              </div>

            </Card>
          ))}
        </div>
      )}
      
      <hr className="my-10 border-slate-200 dark:border-dark-border" />

      {/* Módulo de Evaluaciones y Entregas (Manejado por SeccionTareas y validado por RBAC internamente) */}
      <SeccionTareas cursoId={id} />

      {/* Módulo Interactivo de Exámenes (SeccionCuestionarios) */}
      <SeccionCuestionarios cursoId={id} />
      
      {/* Módulo de Foros y Debate */}
      <SeccionForo cursoId={id} />
      
    </div>
  );
};

export default CursoDetalle;
