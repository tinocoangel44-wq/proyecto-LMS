import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardEstudiante } from '../services/dashboardService';
import { getCursosInscritos, inscribirCurso } from '../services/inscripcionesService';
import { getCursos } from '../services/cursosService';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';

// ── Helpers ────────────────────────────────────────────────────────────────
const getNotaColor = (nota) =>
  nota >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
  nota >= 60 ? 'text-amber-600 dark:text-amber-400' :
  'text-red-600 dark:text-red-400';

const getProgresoColor = (p) =>
  p >= 80 ? 'bg-emerald-500' : p >= 50 ? 'bg-amber-500' : p >= 1 ? 'bg-primary-500' : 'bg-slate-300';

const getNotaLabel = (nota) =>
  nota >= 90 ? 'Sobresaliente' : nota >= 80 ? 'Notable' :
  nota >= 70 ? 'Bien' : nota >= 60 ? 'Suficiente' : 'Insuficiente';

const formatDate = (d) => d
  ? new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
  : '—';

// ── Skeleton ───────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="animate-pulse bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl p-5 space-y-3">
    <div className="h-4 bg-slate-200 dark:bg-dark-bg rounded w-3/4" />
    <div className="h-3 bg-slate-100 dark:bg-dark-bg rounded w-1/2" />
    <div className="h-2 bg-slate-200 dark:bg-dark-bg rounded-full mt-4" />
  </div>
);

// ── Barra de progreso ──────────────────────────────────────────────────────
const ProgressBar = ({ value, label, colorClass = 'bg-primary-500', showLabel = true }) => (
  <div>
    <div className="flex justify-between items-center mb-1.5">
      {label && <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>}
      {showLabel && (
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-auto">{value}%</span>
      )}
    </div>
    <div className="h-2 bg-slate-100 dark:bg-dark-bg rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${colorClass}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  </div>
);

// ── KPI Card ───────────────────────────────────────────────────────────────
const KpiCard = ({ icon, label, value, sub, color = 'primary' }) => {
  const colors = {
    primary: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    amber:   'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    red:     'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  };
  return (
    <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-xl ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">{value}</p>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
};

// ── Badge de nota ──────────────────────────────────────────────────────────
const NotaBadge = ({ nota }) => {
  if (nota === null || nota === undefined) return <span className="text-slate-400 text-sm">—</span>;
  return (
    <span className={`font-black text-lg leading-none ${getNotaColor(nota)}`}>
      {nota.toFixed(0)}
    </span>
  );
};

// ── Tarjeta de curso con progreso ─────────────────────────────────────────
const CursoProgressCard = ({ inscripcion }) => {
  const curso = inscripcion.cursos;
  const { progreso = 0, stats = {} } = inscripcion;

  if (!curso) return null;

  return (
    <Link to={`/cursos/${curso.id}`} className="block group">
      <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl overflow-hidden hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-200">
        {/* Imagen portada */}
        <div className="relative h-32 bg-gradient-to-br from-primary-600 to-indigo-700 overflow-hidden">
          {curso.imagen_url && (
            <img
              src={curso.imagen_url}
              alt={curso.titulo}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={e => { e.target.style.display = 'none'; }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          {/* Porcentaje encima de imagen */}
          <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full">
            {progreso}% completado
          </div>
          {curso.categorias_cursos?.nombre && (
            <span className="absolute top-3 left-3 text-xs bg-white/20 backdrop-blur-sm text-white px-2 py-0.5 rounded-full">
              {curso.categorias_cursos.nombre}
            </span>
          )}
        </div>

        <div className="p-4 space-y-3">
          <h3 className="font-bold text-slate-800 dark:text-white text-sm leading-snug line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {curso.titulo}
          </h3>

          {/* Barra de progreso principal */}
          <ProgressBar
            value={progreso}
            colorClass={getProgresoColor(progreso)}
            showLabel={false}
          />

          {/* Stats rápidas */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
            <span>📝 {stats.tareasEntregadas || 0}/{stats.tareasTotal || 0} tareas</span>
            <span>📋 {stats.quizzesCompletados || 0}/{stats.quizzesTotal || 0} quizzes</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

// ── Fila de calificación ───────────────────────────────────────────────────
const CalificacionRow = ({ cal }) => (
  <div className="flex items-center gap-4 py-3">
    <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-base ${
      cal.tipo_origen === 'tarea'
        ? 'bg-amber-100 dark:bg-amber-900/30'
        : 'bg-indigo-100 dark:bg-indigo-900/30'
    }`}>
      {cal.tipo_origen === 'tarea' ? '📝' : '📋'}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{cal.nombreActividad}</p>
      <p className="text-xs text-slate-400 truncate">{cal.nombreCurso} · {formatDate(cal.fecha)}</p>
    </div>
    <div className="text-right flex-shrink-0">
      <NotaBadge nota={cal.calificacion} />
      <p className="text-[10px] text-slate-400 mt-0.5">{getNotaLabel(cal.calificacion)}</p>
    </div>
  </div>
);

// ── Modal: Inscribir a nuevo curso ─────────────────────────────────────────
const ModalInscripcion = ({ catalogo, onClose, onInscribir }) => (
  <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
    <div
      className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
      onClick={e => e.stopPropagation()}
    >
      <div className="px-6 py-4 border-b border-slate-200 dark:border-dark-border flex items-center justify-between">
        <h2 className="font-bold text-slate-800 dark:text-white">Inscribirse a un curso</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">✕</button>
      </div>
      <div className="overflow-y-auto flex-1">
        {catalogo.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-500">Ya estás inscrito en todos los cursos disponibles.</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-dark-border">
            {catalogo.map(curso => (
              <div key={curso.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-dark-bg/50 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex-shrink-0 overflow-hidden">
                  {curso.imagen_url && (
                    <img src={curso.imagen_url} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-white text-sm truncate">{curso.titulo}</p>
                  <p className="text-xs text-slate-400">{curso.categorias_cursos?.nombre}</p>
                </div>
                <Button size="sm" variant="primary" onClick={() => onInscribir(curso.id)}>
                  Inscribirse
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

// ────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ────────────────────────────────────────────────────────────────────────────
const PanelEstudiante = () => {
  const { user, perfil } = useAuth();

  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [catalogo, setCatalogo] = useState([]);
  const [showCatalogo, setShowCatalogo] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const showMsg = (type, text) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback({ type: '', text: '' }), 5000);
  };

  const cargar = useCallback(async () => {
    if (!perfil?.id) return;
    setLoading(true);
    const data = await getDashboardEstudiante(perfil.id);
    setDashData(data);
    setLoading(false);
  }, [perfil?.id]);

  const cargarCatalogo = useCallback(async () => {
    if (!perfil?.id) return;
    const [inscRes, todosRes] = await Promise.all([
      getCursosInscritos(perfil.id),
      getCursos(),
    ]);
    const idsInscritos = (inscRes.data || []).map(i => i.cursos?.id).filter(Boolean);
    const disponibles = (todosRes.data || []).filter(c =>
      c.estado !== 'eliminado' && !idsInscritos.includes(c.id)
    );
    setCatalogo(disponibles);
  }, [perfil?.id]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleInscribirse = async (cursoId) => {
    const { error } = await inscribirCurso(cursoId, perfil.id);
    if (error) {
      showMsg('error', error.code === '23505' ? 'Ya estás inscrito en este curso.' : 'Error al inscribirse.');
    } else {
      showMsg('success', '✅ ¡Inscripción exitosa! El curso ya aparece en tu panel.');
      setShowCatalogo(false);
      cargar();
    }
  };

  const handleOpenCatalogo = async () => {
    await cargarCatalogo();
    setShowCatalogo(true);
  };

  // ── Datos procesados ────────────────────────────────────────────────────
  const { cursos = [], calificaciones = [], kpis = {} } = dashData || {};
  const promedioDisplay = kpis.promedioGeneral !== null && kpis.promedioGeneral !== undefined
    ? kpis.promedioGeneral.toFixed(1)
    : '—';

  // Progreso global = media de progresos por curso
  const progresoGlobal = cursos.length > 0
    ? Math.round(cursos.reduce((s, c) => s + (c.progreso || 0), 0) / cursos.length)
    : 0;

  // Separar calificaciones buenas / malas para la boleta
  const mejoresNotas = [...calificaciones].sort((a, b) => (b.calificacion || 0) - (a.calificacion || 0)).slice(0, 3);

  return (
    <>
      {showCatalogo && (
        <ModalInscripcion
          catalogo={catalogo}
          onClose={() => setShowCatalogo(false)}
          onInscribir={handleInscribirse}
        />
      )}

      <div className="space-y-7 animate-in fade-in duration-300 max-w-7xl mx-auto">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              Bienvenido de vuelta 👋
            </p>
            <h1 className="text-3xl font-black text-slate-800 dark:text-white mt-0.5">
              {perfil?.nombre_completo?.split(' ')[0] || user?.email?.split('@')[0] || 'Estudiante'}
            </h1>
          </div>
          <Button variant="primary" onClick={handleOpenCatalogo}>
            + Inscribirme a un curso
          </Button>
        </div>

        {feedback.text && <Alert type={feedback.type}>{feedback.text}</Alert>}

        {/* ── KPIs ───────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon="📚" label="Cursos activos" value={kpis.totalCursos || 0} color="primary" />
            <KpiCard
              icon="🎓"
              label="Promedio general"
              value={promedioDisplay}
              sub={kpis.promedioGeneral != null ? getNotaLabel(kpis.promedioGeneral) : 'Sin calificar'}
              color={kpis.promedioGeneral >= 70 ? 'emerald' : kpis.promedioGeneral >= 50 ? 'amber' : 'red'}
            />
            <KpiCard icon="✅" label="Tareas entregadas" value={kpis.totalEntregas || 0} color="emerald" />
            <KpiCard
              icon="⏳"
              label="Pendientes"
              value={kpis.totalPendientes || 0}
              color={kpis.totalPendientes > 0 ? 'amber' : 'emerald'}
            />
          </div>
        )}

        {/* ── Progreso global ─────────────────────────────────────────────── */}
        {!loading && cursos.length > 0 && (
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-800 dark:text-white text-base">Progreso académico global</h2>
              <span className={`text-2xl font-black ${getNotaColor(progresoGlobal)}`}>{progresoGlobal}%</span>
            </div>
            <ProgressBar
              value={progresoGlobal}
              colorClass={getProgresoColor(progresoGlobal)}
              showLabel={false}
            />
            <p className="text-xs text-slate-400 mt-2">
              Basado en promedio de completado de {cursos.length} curso{cursos.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* ── Grid principal ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Columna izquierda: Mis cursos (2/3) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-800 dark:text-white text-lg">Mis cursos</h2>
              <Link to="/catalogo" className="text-xs text-primary-600 dark:text-primary-400 hover:underline">
                Ver catálogo →
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : cursos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200 dark:border-dark-border rounded-2xl text-center">
                <div className="text-5xl mb-3 opacity-30">🎓</div>
                <h3 className="text-base font-semibold text-slate-500 dark:text-slate-400">Sin cursos inscritos</h3>
                <p className="text-sm text-slate-400 mt-1 mb-4">Explora el catálogo y matricúlate.</p>
                <Button variant="primary" onClick={handleOpenCatalogo}>
                  Explorar cursos
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {cursos.map(insc => (
                  <CursoProgressCard key={insc.id} inscripcion={insc} />
                ))}
              </div>
            )}

            {/* Barra por curso (detallado) */}
            {!loading && cursos.length > 0 && (
              <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl p-5 space-y-4">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm">Progreso por curso</h3>
                {cursos.map(insc => (
                  <div key={insc.id}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-[60%]">
                        {insc.cursos?.titulo}
                      </span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {insc.progreso}%
                      </span>
                    </div>
                    <ProgressBar
                      value={insc.progreso}
                      colorClass={getProgresoColor(insc.progreso)}
                      showLabel={false}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Columna derecha: Calificaciones (1/3) */}
          <div className="space-y-4">
            <h2 className="font-bold text-slate-800 dark:text-white text-lg">Mis calificaciones</h2>

            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : calificaciones.length === 0 ? (
              <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl p-6 text-center">
                <div className="text-3xl mb-2 opacity-30">📊</div>
                <p className="text-sm text-slate-400">Aún no tienes calificaciones registradas.</p>
              </div>
            ) : (
              <>
                {/* Boleta principal */}
                <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl divide-y divide-slate-100 dark:divide-dark-border">
                  {calificaciones.slice(0, 8).map((cal, i) => (
                    <div key={cal.id || i} className="px-4">
                      <CalificacionRow cal={cal} />
                    </div>
                  ))}
                </div>

                {/* Mejores notas */}
                {mejoresNotas.length > 0 && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30 rounded-2xl p-4">
                    <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-3">
                      🏆 Tus mejores resultados
                    </h4>
                    <div className="space-y-2">
                      {mejoresNotas.map((cal, i) => (
                        <div key={i} className="flex items-center justify-between gap-2">
                          <p className="text-xs text-slate-600 dark:text-slate-300 truncate flex-1">{cal.nombreActividad}</p>
                          <span className={`text-sm font-black ${getNotaColor(cal.calificacion)}`}>
                            {cal.calificacion?.toFixed(0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Distribución de notas */}
                <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Distribución de calificaciones
                  </h4>
                  {[
                    { label: '90-100 (Sobresaliente)', min: 90, color: 'bg-emerald-500' },
                    { label: '70-89 (Notable/Bien)',   min: 70, max: 90, color: 'bg-blue-500' },
                    { label: '50-69 (Suficiente)',     min: 50, max: 70, color: 'bg-amber-500' },
                    { label: '<50 (Insuficiente)',      max: 50, color: 'bg-red-500' },
                  ].map(rango => {
                    const count = calificaciones.filter(c => {
                      const n = c.calificacion || 0;
                      return (rango.min === undefined || n >= rango.min) && (rango.max === undefined || n < rango.max);
                    }).length;
                    const pct = calificaciones.length > 0 ? Math.round((count / calificaciones.length) * 100) : 0;
                    return (
                      <div key={rango.label}>
                        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                          <span>{rango.label}</span>
                          <span>{count} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 dark:bg-dark-bg rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${rango.color}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PanelEstudiante;
