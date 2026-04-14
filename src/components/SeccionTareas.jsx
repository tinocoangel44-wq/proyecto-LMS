import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getTareasPorCurso,
  createTarea,
  deleteTarea,
  enviarEntrega,
  getMisEntregas,
  uploadArchivoDocente,
} from '../services/tareasService';
import Button from './ui/Button';
import Input from './ui/Input';
import Alert from './ui/Alert';

// ── Badge de estado ────────────────────────────────────────────────────────
const EstadoBadge = ({ isOverdue, entregada, calificada, nota }) => {
  if (calificada && nota !== undefined) {
    const color = nota >= 70 ? 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30'
      : nota >= 50 ? 'text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30'
      : 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${color}`}>
        🎓 Calificada: {nota}/100
      </span>
    );
  }
  if (entregada) return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30">
      ✓ Entregada
    </span>
  );
  if (isOverdue) return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30">
      ⛔ Vencida
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30">
      ⏳ Pendiente
    </span>
  );
};

// ── Formulario nueva tarea (Docente) ───────────────────────────────────────
const FormularioTarea = ({ onSubmit, onCancel, isLoading }) => {
  const [data, setData] = useState({
    titulo: '',
    instrucciones: '',
    fecha_limite: '',
    ponderacion: 100,
    archivoFile: null,
  });

  const nombreArchivo = data.archivoFile?.name || null;

  return (
    <form
      onSubmit={e => { e.preventDefault(); onSubmit(data); }}
      className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl p-5 space-y-4"
    >
      <h3 className="font-bold text-amber-800 dark:text-amber-400 text-sm flex items-center gap-2">
        📝 Nueva tarea evaluada
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <Input
            required
            label="TÍTULO DE LA TAREA *"
            placeholder="Ej. Ensayo sobre Algoritmos"
            value={data.titulo}
            onChange={e => setData(p => ({ ...p, titulo: e.target.value }))}
          />
        </div>
        <div>
          <Input
            label="PONDERACIÓN (pts)"
            type="number"
            min={0}
            max={100}
            value={data.ponderacion}
            onChange={e => setData(p => ({ ...p, ponderacion: parseInt(e.target.value) }))}
          />
        </div>
      </div>

      <Input
        label="FECHA Y HORA LÍMITE"
        type="datetime-local"
        value={data.fecha_limite}
        onChange={e => setData(p => ({ ...p, fecha_limite: e.target.value }))}
      />

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
          Instrucciones y Rúbrica *
        </label>
        <textarea
          required
          rows={4}
          placeholder="Describe qué deben entregar los estudiantes, criterios de evaluación, formato, etc."
          value={data.instrucciones}
          onChange={e => setData(p => ({ ...p, instrucciones: e.target.value }))}
          className="px-4 py-3 text-sm bg-white dark:bg-dark-bg border border-slate-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white resize-none"
        />
      </div>

      {/* Archivo adjunto del docente */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
          📎 Archivo adjunto (opcional)
        </label>
        <input
          type="file"
          onChange={e => setData(p => ({ ...p, archivoFile: e.target.files[0] || null }))}
          className="w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-dark-bg border border-slate-300 dark:border-dark-border rounded-lg file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200 cursor-pointer"
          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.zip,.rar"
        />
        {nombreArchivo && (
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 flex items-center gap-1">
            ✅ <span className="truncate max-w-xs">{nombreArchivo}</span>
          </p>
        )}
        <p className="text-[10px] text-slate-400">Máx. 50MB — PDF, Word, PowerPoint, Excel, Imágenes, Zip</p>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 rounded-lg transition-colors">
          Cancelar
        </button>
        <Button type="submit" variant="primary" isLoading={isLoading} size="sm">
          Publicar tarea
        </Button>
      </div>
    </form>
  );
};

// ── Formulario de entrega (Estudiante) ────────────────────────────────────
const FormularioEntrega = ({ onSubmit, onCancel, isLoading }) => {
  const [data, setData] = useState({ texto_entrega: '', enlace_entrega: '', archivoFile: null });
  const hasContent = data.texto_entrega.trim() || data.enlace_entrega.trim() || data.archivoFile;

  return (
    <form
      onSubmit={e => { e.preventDefault(); if (hasContent) onSubmit(data); }}
      className="mt-4 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl p-4 space-y-3"
    >
      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
        📤 Mi entrega
      </h4>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Texto / Respuesta</label>
        <textarea
          rows={4}
          placeholder="Escribe tu respuesta, desarrollo o solución aquí..."
          value={data.texto_entrega}
          onChange={e => setData(p => ({ ...p, texto_entrega: e.target.value }))}
          className="px-4 py-3 text-sm bg-white dark:bg-dark-card border border-slate-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white resize-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Enlace externo (opcional)</label>
        <Input
          type="url"
          placeholder="https://drive.google.com/... o https://github.com/..."
          value={data.enlace_entrega}
          onChange={e => setData(p => ({ ...p, enlace_entrega: e.target.value }))}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Archivo Adjunto (opcional)</label>
        <input
          type="file"
          onChange={e => setData(p => ({ ...p, archivoFile: e.target.files[0] }))}
          className="w-full px-3 py-2 text-sm text-slate-700 bg-white dark:bg-dark-card border border-slate-300 dark:border-dark-border rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip,.rar"
        />
        <p className="text-[10px] text-slate-400 mt-1">Máximo 50MB. (PDF, Imágenes, Word, Zip)</p>
      </div>

      {!hasContent && (
        <p className="text-xs text-amber-600 dark:text-amber-400">Debes escribir texto, adjuntar un enlace o subir un archivo para enviar.</p>
      )}

      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-1.5 text-sm text-slate-500 hover:text-slate-700 rounded-lg transition-colors">
          Cancelar
        </button>
        <Button type="submit" variant="primary" isLoading={isLoading} disabled={!hasContent}>
          ✅ Enviar entrega
        </Button>
      </div>
    </form>
  );
};

// ── Componente principal ───────────────────────────────────────────────────
const SeccionTareas = ({ cursoId }) => {
  const navigate = useNavigate();
  const { role, perfil } = useAuth();
  const esDocente = role === 'administrador' || role === 'docente';

  const [tareas, setTareas] = useState([]);
  const [misEntregas, setMisEntregas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [savingTarea, setSavingTarea] = useState(false);
  const [entregando, setEntregando] = useState(null); // ID tarea activa
  const [savingEntrega, setSavingEntrega] = useState(false);
  const [expandida, setExpandida] = useState(null); // Tarea expandida
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const showFeedback = (type, text) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback({ type: '', text: '' }), 5000);
  };

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    const { data: listTareas } = await getTareasPorCurso(cursoId);
    if (listTareas) setTareas(listTareas);

    if (perfil?.id && !esDocente) {
      const { data: enviadas } = await getMisEntregas(perfil.id, cursoId);
      if (enviadas) setMisEntregas(enviadas);
    }
    setLoading(false);
  }, [cursoId, perfil?.id, esDocente]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const handleCrearTarea = async (formData) => {
    setSavingTarea(true);

    // Si hay archivo adjunto, subirlo primero
    let archivoUrl = null;
    if (formData.archivoFile) {
      const { url, error: uploadErr } = await uploadArchivoDocente(formData.archivoFile, perfil.id);
      if (uploadErr) {
        showFeedback('error', '❌ Error subiendo el archivo: ' + uploadErr.message);
        setSavingTarea(false);
        return;
      }
      archivoUrl = url;
    }

    const { error } = await createTarea({
      curso_id: cursoId,
      creado_por: perfil.id,
      ...formData,
      archivo_url: archivoUrl,
    });
    setSavingTarea(false);
    if (error) {
      showFeedback('error', 'No se pudo crear la tarea: ' + error.message);
    } else {
      showFeedback('success', '✅ Tarea publicada correctamente.');
      setShowForm(false);
      cargarDatos();
    }
  };

  const handleEliminarTarea = async (tareaId) => {
    if (!window.confirm('¿Eliminar esta tarea? Las entregas existentes quedarán guardadas.')) return;
    await deleteTarea(tareaId);
    cargarDatos();
  };

  const handleEnviarEntrega = async (formData, tareaId) => {
    setSavingEntrega(true);
    const { error } = await enviarEntrega({
      tarea_id: tareaId,
      estudiante_id: perfil.id,
      ...formData,
    });
    setSavingEntrega(false);
    if (error) {
      if (error.code === '23505') {
        showFeedback('error', 'Ya enviaste una entrega para esta tarea.');
      } else {
        showFeedback('error', 'Error al enviar: ' + error.message);
      }
    } else {
      showFeedback('success', '🎉 ¡Entrega enviada con éxito!');
      setEntregando(null);
      cargarDatos();
    }
  };

  if (loading) return (
    <div className="pt-6 space-y-3 animate-pulse">
      {[1, 2].map(i => (
        <div key={i} className="h-24 bg-slate-100 dark:bg-dark-bg rounded-xl" />
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <span>📝</span> Tareas y Evaluaciones
          {tareas.length > 0 && (
            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
              ({tareas.length} publicada{tareas.length !== 1 ? 's' : ''})
            </span>
          )}
        </h2>
        {esDocente && !showForm && (
          <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
            + Nueva tarea
          </Button>
        )}
      </div>

      {/* Feedback */}
      {feedback.text && <Alert type={feedback.type}>{feedback.text}</Alert>}

      {/* Formulario docente */}
      {showForm && esDocente && (
        <FormularioTarea
          onSubmit={handleCrearTarea}
          onCancel={() => setShowForm(false)}
          isLoading={savingTarea}
        />
      )}

      {/* Lista de tareas */}
      {tareas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-200 dark:border-dark-border rounded-2xl text-center">
          <div className="text-4xl mb-2 opacity-30">📋</div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {esDocente
              ? 'No hay tareas publicadas. Crea la primera.'
              : 'El docente aún no ha publicado tareas en este curso.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tareas.map(tarea => {
            const entregaExistente = misEntregas.find(e => e.tarea_id === tarea.id);
            const calificacion = entregaExistente?.calificaciones?.[0];
            const isOverdue = tarea.fecha_limite && new Date() > new Date(tarea.fecha_limite);
            const isExpanded = expandida === tarea.id;
            const entregaCount = tarea.entregas_tareas?.length || 0;

            return (
              <div
                key={tarea.id}
                className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl shadow-sm overflow-hidden"
              >
                {/* Cabecera de tarea — clic para expandir */}
                <div
                  className="px-5 py-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-dark-bg/30 transition-colors"
                  onClick={() => setExpandida(isExpanded ? null : tarea.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-800 dark:text-white text-base">{tarea.titulo}</h3>
                        {/* Badge de ponderacion */}
                        {tarea.ponderacion && (
                          <span className="text-xs bg-slate-100 dark:bg-dark-bg text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">
                            {tarea.ponderacion} pts
                          </span>
                        )}
                      </div>

                      {/* Fecha límite */}
                      <p className={`text-xs mt-1 font-medium ${isOverdue ? 'text-red-500 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
                        {tarea.fecha_limite
                          ? `⏰ Límite: ${new Date(tarea.fecha_limite).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}`
                          : '📅 Sin fecha límite'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Estado para estudiante */}
                      {!esDocente && (
                        <EstadoBadge
                          isOverdue={isOverdue}
                          entregada={!!entregaExistente}
                          calificada={entregaExistente?.estado === 'calificada'}
                          nota={calificacion?.calificacion}
                        />
                      )}

                      {/* Conteo de entregas para docente */}
                      {esDocente && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-dark-bg px-2 py-1 rounded-full">
                          {entregaCount} entrega{entregaCount !== 1 ? 's' : ''}
                        </span>
                      )}

                      {/* Chevron */}
                      <span className={`text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contenido expandido */}
                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-dark-border px-5 py-4 space-y-4">

                    {/* Instrucciones */}
                    {tarea.instrucciones && (
                      <div className="bg-slate-50 dark:bg-dark-bg rounded-xl p-4">
                        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 tracking-wider">
                          📋 Instrucciones
                        </h4>
                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {tarea.instrucciones}
                        </p>
                      </div>
                    )}

                    {/* Archivo adjunto del docente */}
                    {tarea.archivo_url && (
                      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl p-4">
                        <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase mb-2 tracking-wider">
                          📎 Material adjunto
                        </h4>
                        <a
                          href={tarea.archivo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded-lg text-sm font-semibold hover:bg-amber-200 dark:hover:bg-amber-900/60 transition-colors"
                        >
                          📄 Descargar / Ver archivo
                        </a>
                      </div>
                    )}

                    {/* ── VISTA DOCENTE ── */}
                    {esDocente && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-dark-border">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => navigate(`/evaluaciones/tarea/${tarea.id}`)}
                        >
                          📊 Revisar y calificar entregas ({entregaCount})
                        </Button>
                        <button
                          onClick={() => handleEliminarTarea(tarea.id)}
                          className="px-3 py-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          Eliminar tarea
                        </button>
                      </div>
                    )}

                    {/* ── VISTA ESTUDIANTE ── */}
                    {!esDocente && (
                      <div className="space-y-3">
                        {/* Calificación recibida */}
                        {calificacion && (
                          <div className={`rounded-xl p-4 border ${
                            calificacion.calificacion >= 70
                              ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900/30'
                              : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/30'
                          }`}>
                            <div className="flex items-start gap-4">
                              <div className={`text-4xl font-black ${calificacion.calificacion >= 70 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                {calificacion.calificacion}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Retroalimentación del docente</p>
                                <p className="text-sm text-slate-700 dark:text-slate-300 italic">
                                  "{calificacion.retroalimentacion || 'Sin comentarios adicionales.'}"
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Entrega existente */}
                        {entregaExistente && !entregando && (
                          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-xl p-4">
                            <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase mb-2">
                              ✓ Tu entrega — {new Date(entregaExistente.fecha_entrega).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                            </p>
                            {entregaExistente.texto_entrega && (
                              <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{entregaExistente.texto_entrega}</p>
                            )}
                            {entregaExistente.enlace_entrega && (
                              <a
                                href={entregaExistente.enlace_entrega}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 block text-xs text-primary-600 dark:text-primary-400 hover:underline"
                              >
                                🔗 {entregaExistente.enlace_entrega}
                              </a>
                            )}
                            {entregaExistente.archivo_url && (
                              <a
                                href={entregaExistente.archivo_url}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded-lg text-xs font-semibold hover:bg-blue-200 transition-colors"
                              >
                                📎 Ver archivo adjunto
                              </a>
                            )}
                          </div>
                        )}

                        {/* Botón / formulario de entrega */}
                        {!entregaExistente && !isOverdue && (
                          <>
                            {entregando === tarea.id ? (
                              <FormularioEntrega
                                onSubmit={(formData) => handleEnviarEntrega(formData, tarea.id)}
                                onCancel={() => setEntregando(null)}
                                isLoading={savingEntrega}
                              />
                            ) : (
                              <Button
                                variant="primary"
                                onClick={() => setEntregando(tarea.id)}
                              >
                                📤 Enviar mi entrega
                              </Button>
                            )}
                          </>
                        )}

                        {!entregaExistente && isOverdue && (
                          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 rounded-xl px-4 py-3 border border-red-200 dark:border-red-900/30">
                            ⛔ El plazo de entrega venció. Ya no es posible enviar.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SeccionTareas;
