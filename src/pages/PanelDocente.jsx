import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardDocente } from '../services/dashboardService';
import ExternalWidgets from '../components/ExternalWidgets';

// ── Helpers ────────────────────────────────────────────────────────────────
const timeAgo = (d) => {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'Ahora';
  if (mins < 60) return `Hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `Hace ${hrs}h`;
  return `Hace ${Math.floor(hrs / 24)}d`;
};

const formatDate = (d) => d
  ? new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
  : 'Sin fecha';

const Skeleton = ({ h = 'h-20', className = '' }) => (
  <div className={`animate-pulse bg-slate-100 dark:bg-dark-bg rounded-xl ${h} ${className}`} />
);

// ── KPI Card ───────────────────────────────────────────────────────────────
const KpiCard = ({ icon, label, value, sub, gradient }) => (
  <div className={`relative rounded-2xl p-5 overflow-hidden text-white ${gradient}`}>
    <div className="absolute -right-4 -bottom-4 text-7xl opacity-20 select-none">{icon}</div>
    <div className="text-4xl font-black relative z-10">{value ?? '—'}</div>
    <div className="font-semibold mt-1 relative z-10">{label}</div>
    {sub && <div className="text-xs opacity-75 mt-0.5 relative z-10">{sub}</div>}
  </div>
);

// ── Card de curso ──────────────────────────────────────────────────────────
const CursoCard = ({ curso }) => {
  const alumnos   = (curso.inscripciones  || []).filter(i => i.estado === 'activo').length;
  const tareas    = (curso.tareas || []).length;
  const pendientes = (curso.tareas || []).reduce((acc, t) =>
    acc + (t.entregas_tareas || []).filter(e => e.estado === 'entregada').length, 0);

  return (
    <Link to={`/cursos/${curso.id}`}>
      <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl overflow-hidden hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700 transition-all group">
        {/* Portada */}
        <div className="relative h-32 bg-gradient-to-br from-primary-600 to-indigo-700 overflow-hidden">
          {curso.imagen_url && (
            <img src={curso.imagen_url} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <span className={`absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full font-bold ${
            curso.estado === 'publicado' ? 'bg-emerald-500/90 text-white' : 'bg-amber-500/90 text-white'
          }`}>
            {curso.estado}
          </span>
        </div>

        <div className="p-4">
          {curso.categorias_cursos?.nombre && (
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">{curso.categorias_cursos.nombre}</span>
          )}
          <h3 className="font-bold text-slate-800 dark:text-white mt-0.5 line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {curso.titulo}
          </h3>
          <div className="flex gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400">
            <span>👤 {alumnos} alumnos</span>
            <span>📝 {tareas} tareas</span>
            {pendientes > 0 && (
              <span className="text-amber-600 dark:text-amber-400 font-semibold">⏳ {pendientes} por calificar</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
const PanelDocente = () => {
  const { user, perfil } = useAuth();
  const [dash, setDash] = useState(null);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    if (!perfil?.id) return;
    setLoading(true);
    const data = await getDashboardDocente(perfil.id);
    setDash(data);
    setLoading(false);
  }, [perfil?.id]);

  useEffect(() => { cargar(); }, [cargar]);

  const nombre = perfil?.nombre_completo?.split(' ')[0] || user?.email?.split('@')[0] || 'Docente';

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Panel docente 👨‍🏫</p>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white mt-0.5">{nombre}</h1>
        </div>
        <Link to="/cursos">
          <button className="px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-primary-900/20">
            + Crear curso
          </button>
        </Link>
      </div>

      {/* KPIs + Widget lateral */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {loading ? (
            <div className="grid grid-cols-2 gap-4">
              {[1,2,3,4].map(i => <Skeleton key={i} h="h-28" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <KpiCard icon="📚" label="Mis cursos" value={dash?.kpis.totalCursos} gradient="bg-gradient-to-br from-primary-600 to-indigo-700" />
              <KpiCard icon="🎓" label="Alumnos totales" value={dash?.kpis.totalEstudiantes} gradient="bg-gradient-to-br from-emerald-600 to-teal-700" />
              <KpiCard icon="📋" label="Tareas creadas" value={dash?.kpis.totalTareas} gradient="bg-gradient-to-br from-violet-600 to-purple-700" />
              <KpiCard icon="⏳" label="Por calificar" value={dash?.kpis.totalEntregasPendientes} sub="entregas recibidas" gradient={`bg-gradient-to-br ${dash?.kpis.totalEntregasPendientes > 0 ? 'from-amber-500 to-orange-600' : 'from-slate-600 to-slate-700'}`} />
            </div>
          )}
        </div>
        <ExternalWidgets className="min-h-[200px]" />
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mis cursos (2/3) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-800 dark:text-white text-lg">Mis cursos</h2>
            <Link to="/cursos" className="text-xs text-primary-600 dark:text-primary-400 hover:underline">Ver todos →</Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1,2,3,4].map(i => <Skeleton key={i} h="h-48" />)}
            </div>
          ) : (dash?.cursos || []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 border-2 border-dashed border-slate-200 dark:border-dark-border rounded-2xl text-center">
              <div className="text-5xl mb-3 opacity-30">📚</div>
              <h3 className="font-semibold text-slate-500 dark:text-slate-400">Sin cursos asignados</h3>
              <p className="text-sm text-slate-400 mt-1 mb-4">Crea tu primer curso para empezar.</p>
              <Link to="/cursos">
                <button className="px-4 py-2 bg-primary-600 text-white text-sm font-bold rounded-xl">Crear curso</button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(dash?.cursos || []).map(c => <CursoCard key={c.id} curso={c} />)}
            </div>
          )}

          {/* Entregas pendientes de calificar */}
          {!loading && (dash?.entregasPendientes || []).length > 0 && (
            <div className="bg-white dark:bg-dark-card border border-amber-200 dark:border-amber-900/30 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 bg-amber-50 dark:bg-amber-900/10 border-b border-amber-200 dark:border-amber-900/30 flex items-center justify-between">
                <h3 className="font-bold text-amber-800 dark:text-amber-400 text-sm flex items-center gap-2">
                  ⏳ Entregas pendientes de calificar
                </h3>
                <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">
                  {dash.kpis.totalEntregasPendientes}
                </span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-dark-border">
                {(dash?.entregasPendientes || []).slice(0, 6).map(ent => (
                  <Link key={ent.id} to={`/evaluaciones/tarea/${ent.tarea_id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 dark:hover:bg-dark-bg/50 transition-colors group">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {(ent.perfiles_usuarios?.nombre_completo || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400">{ent.perfiles_usuarios?.nombre_completo}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{ent.tarea_titulo} · {ent.curso_titulo}</p>
                    </div>
                    <div className="flex-shrink-0 text-xs text-slate-400">{formatDate(ent.fecha_entrega)}</div>
                    <span className="text-xs text-primary-600 dark:text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity">Calificar →</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Columna derecha */}
        <div className="space-y-4">
          {/* Accesos rápidos */}
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl p-5">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm mb-4">Accesos rápidos</h3>
            <div className="space-y-2">
              {[
                { to: '/cursos', icon: '📚', label: 'Mis cursos', desc: 'Crear y gestionar' },
                { to: '/catalogo', icon: '🗂️', label: 'Catálogo', desc: 'Ver todos los cursos' },
              ].map(item => (
                <Link key={item.to} to={item.to}>
                  <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-bg transition-colors group cursor-pointer">
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{item.label}</p>
                      <p className="text-xs text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Mensajes del foro recientes */}
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl p-5">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm mb-4">💬 Mensajes recientes</h3>
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} h="h-12" />)}</div>
            ) : (dash?.mensajesRecientes || []).length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Sin actividad reciente en foros</p>
            ) : (
              <div className="space-y-3">
                {(dash?.mensajesRecientes || []).map(m => (
                  <div key={m.id} className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {(m.perfiles_usuarios?.nombre_completo || '?').charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{m.perfiles_usuarios?.nombre_completo}</span>
                        <span className="text-[10px] text-slate-400 flex-shrink-0">{timeAgo(m.created_at)}</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">"{m.contenido}"</p>
                      {m.foro_titulo && <p className="text-[10px] text-primary-500 dark:text-primary-400 truncate">en {m.foro_titulo}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Progreso de alumnos por curso */}
          {!loading && (dash?.cursos || []).length > 0 && (
            <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl p-5">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm mb-4">📊 Actividad por curso</h3>
              <div className="space-y-3">
                {(dash?.cursos || []).map(c => {
                  const totalEntregas = (c.tareas || []).reduce((a, t) => a + (t.entregas_tareas || []).length, 0);
                  const alumnos = (c.inscripciones || []).filter(i => i.estado === 'activo').length;
                  return (
                    <div key={c.id}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600 dark:text-slate-400 truncate max-w-[60%]">{c.titulo}</span>
                        <span className="text-slate-500 dark:text-slate-400">{totalEntregas} entregas</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-dark-bg rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full"
                          style={{ width: alumnos > 0 ? `${Math.min(100, (totalEntregas / (alumnos * Math.max(1, (c.tareas||[]).length))) * 100)}%` : '0%' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PanelDocente;
