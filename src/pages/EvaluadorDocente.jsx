import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getEntregasDeTarea,
  asentarCalificacion,
  getTareaById,
} from '../services/tareasService';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Alert from '../components/ui/Alert';

// ── Avatar de estudiante ───────────────────────────────────────────────────
const Avatar = ({ nombre, className = '' }) => (
  <div className={`w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center flex-shrink-0 text-sm ${className}`}>
    {(nombre || '?').charAt(0).toUpperCase()}
  </div>
);

// ── Nota visual ────────────────────────────────────────────────────────────
const NotaDisplay = ({ nota, retroalimentacion }) => {
  const color = nota >= 70
    ? 'border-emerald-200 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-900/10'
    : nota >= 50
    ? 'border-amber-200 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/10'
    : 'border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10';
  const textColor = nota >= 70 ? 'text-emerald-700 dark:text-emerald-400'
    : nota >= 50 ? 'text-amber-700 dark:text-amber-400' : 'text-red-700 dark:text-red-400';

  return (
    <div className={`rounded-xl border p-4 ${color}`}>
      <div className="flex items-start gap-4">
        <div className={`text-4xl font-black ${textColor}`}>{nota}</div>
        <div>
          <p className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1">/ 100 pts</p>
          {retroalimentacion && (
            <p className="text-sm text-slate-600 dark:text-slate-300 italic">
              "{retroalimentacion}"
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Card de entrega individual ─────────────────────────────────────────────
const EntregaCard = ({ entrega, perfil, onCalificado }) => {
  const calificacion = entrega.calificaciones?.[0];
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [form, setForm] = useState({ nota: '', feedback: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleCalificar = async (e) => {
    e.preventDefault();
    if (!form.nota || parseFloat(form.nota) < 0 || parseFloat(form.nota) > 100) {
      setError('La nota debe estar entre 0 y 100.');
      return;
    }
    setSaving(true);
    setError(null);
    const { error: err } = await asentarCalificacion({
      estudianteId: entrega.estudiante_id,
      docenteId: perfil.id,
      tipoOrigen: 'tarea',
      origenId: entrega.id,
      calificacion: form.nota,
      retroalimentacion: form.feedback,
    });
    setSaving(false);
    if (err) {
      setError('Error al guardar: ' + err.message);
    } else {
      setPanelAbierto(false);
      setForm({ nota: '', feedback: '' });
      onCalificado();
    }
  };

  return (
    <div className={`rounded-2xl border p-5 space-y-4 transition-colors ${
      calificacion
        ? 'bg-emerald-50/50 dark:bg-emerald-900/5 border-emerald-200 dark:border-emerald-900/30'
        : 'bg-white dark:bg-dark-card border-slate-200 dark:border-dark-border'
    }`}>
      {/* Cabecera del estudiante */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar nombre={entrega.perfiles_usuarios?.nombre_completo} />
          <div>
            <p className="font-bold text-slate-800 dark:text-white text-sm">
              {entrega.perfiles_usuarios?.nombre_completo || 'Estudiante desconocido'}
            </p>
            <p className="text-xs text-slate-400">
              Entregado: {new Date(entrega.fecha_entrega).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>
        </div>
        {/* Badge de estado */}
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${
          entrega.estado === 'calificada'
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
        }`}>
          {entrega.estado === 'calificada' ? '✓ Calificada' : '📥 Recibida'}
        </span>
      </div>

      {/* Contenido de la entrega */}
      {entrega.texto_entrega && (
        <div className="bg-slate-50 dark:bg-dark-bg rounded-xl p-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Respuesta escrita</p>
          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
            {entrega.texto_entrega}
          </p>
        </div>
      )}

      {entrega.enlace_entrega && (
        <a
          href={entrega.enlace_entrega}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl text-xs font-semibold transition-colors"
        >
          🔗 Ver enlace externo
        </a>
      )}

      {entrega.archivo_url && (
        <a
          href={entrega.archivo_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-xl text-xs font-semibold transition-colors mt-2 ml-2"
        >
          📎 Descargar / Ver Archivo Adjunto
        </a>
      )}

      {/* Calificación existente */}
      {calificacion && (
        <NotaDisplay nota={calificacion.calificacion} retroalimentacion={calificacion.retroalimentacion} />
      )}

      {/* Panel de calificación */}
      {!calificacion && (
        <div>
          {panelAbierto ? (
            <form onSubmit={handleCalificar} className="space-y-3 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-900/30 rounded-xl p-4">
              <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                🎓 Calificar entrega
              </h4>
              {error && <Alert type="error">{error}</Alert>}
              <div className="flex gap-3 items-end">
                <div className="w-32">
                  <Input
                    required
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    label="NOTA (0-100)"
                    placeholder="85"
                    value={form.nota}
                    onChange={e => setForm(p => ({ ...p, nota: e.target.value }))}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Retroalimentación
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Comentarios para el estudiante sobre su trabajo..."
                    value={form.feedback}
                    onChange={e => setForm(p => ({ ...p, feedback: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 text-sm bg-white dark:bg-dark-bg border border-slate-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => { setPanelAbierto(false); setError(null); }}
                  className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 rounded-lg"
                >
                  Cancelar
                </button>
                <Button type="submit" variant="primary" size="sm" isLoading={saving}>
                  Guardar calificación
                </Button>
              </div>
            </form>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setPanelAbierto(true)}
            >
              ✏️ Calificar
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

// ── Componente Principal EvaluadorDocente ──────────────────────────────────
const EvaluadorDocente = () => {
  const { id: tareaId } = useParams();
  const navigate = useNavigate();
  const { perfil } = useAuth();

  const [tarea, setTarea] = useState(null);
  const [entregas, setEntregas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');

  const cargar = useCallback(async () => {
    setLoading(true);
    const [tareaRes, entregasRes] = await Promise.all([
      getTareaById(tareaId),
      getEntregasDeTarea(tareaId),
    ]);
    if (tareaRes.data) setTarea(tareaRes.data);
    if (entregasRes.data) setEntregas(entregasRes.data);
    setLoading(false);
  }, [tareaId]);

  useEffect(() => { cargar(); }, [cargar]);

  const calificadas = entregas.filter(e => e.calificaciones?.length > 0).length;
  const pendientes = entregas.length - calificadas;

  if (loading) return (
    <div className="flex justify-center items-center py-24 space-x-2">
      {[0, 1, 2].map(i => (
        <div key={i} className="w-3 h-3 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
      ))}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 animate-in fade-in duration-300">

      {/* Navegación */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Volver al curso
      </button>

      {/* Header */}
      <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase text-slate-400 font-bold tracking-wider mb-1">
              {tarea?.cursos?.titulo || 'Curso'}
            </p>
            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">
              {tarea?.titulo || 'Bandeja de calificaciones'}
            </h1>
            {tarea?.instrucciones && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                {tarea.instrucciones}
              </p>
            )}
          </div>
          {tarea?.fecha_limite && (
            <div className="flex-shrink-0 text-right">
              <p className="text-xs text-slate-400">Fecha límite</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {new Date(tarea.fecha_limite).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>
          )}
        </div>

        {/* Métricas */}
        <div className="mt-5 grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-dark-border">
          {[
            { label: 'Total', value: entregas.length, color: 'text-slate-700 dark:text-slate-300' },
            { label: 'Calificadas', value: calificadas, color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Pendientes', value: pendientes, color: pendientes > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500' },
          ].map(m => (
            <div key={m.label} className="text-center">
              <p className={`text-2xl font-black ${m.color}`}>{m.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      {feedback && (
        <Alert type="success">{feedback}</Alert>
      )}

      {/* Lista de entregas */}
      {entregas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200 dark:border-dark-border rounded-2xl text-center">
          <div className="text-5xl mb-3 opacity-30">📥</div>
          <h3 className="text-base font-semibold text-slate-500 dark:text-slate-400">Sin entregas todavía</h3>
          <p className="text-sm text-slate-400 mt-1">Los estudiantes no han enviado trabajos aún.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            {entregas.length} entrega{entregas.length !== 1 ? 's' : ''} recibida{entregas.length !== 1 ? 's' : ''}
          </p>
          {entregas.map(entrega => (
            <EntregaCard
              key={entrega.id}
              entrega={entrega}
              perfil={perfil}
              onCalificado={() => {
                setFeedback('✅ Calificación guardada correctamente.');
                setTimeout(() => setFeedback(''), 4000);
                cargar();
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default EvaluadorDocente;
