import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchDashboardData } from '../services/dashboardService';
import CitaMotivacional from './CitaMotivacional';
import Badge from './ui/Badge';

// ── Helpers ────────────────────────────────────────────────────────────────
const CardWrap = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-dark-card border border-slate-200/80 dark:border-dark-border rounded-2xl shadow-[var(--shadow-card)] ${className}`}>
    {children}
  </div>
);

const CardHead = ({ children }) => (
  <div className="px-5 py-4 border-b border-slate-100 dark:border-dark-border">{children}</div>
);

const CardBody = ({ children, className = '' }) => (
  <div className={`p-5 ${className}`}>{children}</div>
);

// ── Loading skeleton ────────────────────────────────────────────────────────
const LoadingState = () => (
  <div className="flex justify-center items-center py-20">
    <div className="flex items-center gap-2 text-slate-400">
      <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '120ms' }} />
      <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '240ms' }} />
      <span className="ml-2 text-sm font-medium">Cargando métricas…</span>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
const DashboardInsights = () => {
  const { role, perfil } = useAuth();
  const [indicadores, setIndicadores] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (perfil?.id && role) { cargarData(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perfil, role]);

  const cargarData = async () => {
    setLoading(true);
    const data = await fetchDashboardData(role, perfil.id);
    setIndicadores(data);
    setLoading(false);
  };

  if (loading) return <LoadingState />;
  if (!indicadores) return null;

  return (
    <div className="mt-8 space-y-6">
      <CitaMotivacional />

      {/* ── ESTUDIANTE ─────────────────────────────────────────────────── */}
      {role === 'estudiante' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Calificaciones */}
          <CardWrap>
            <CardHead>
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <span className="text-lg">🎓</span> Últimas Calificaciones
              </h3>
            </CardHead>
            <CardBody>
              {indicadores.calificaciones.length === 0 ? (
                <p className="text-sm text-slate-400 italic text-center py-4">Sin evaluaciones registradas.</p>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-dark-border">
                  {indicadores.calificaciones.map((nota, i) => (
                    <li key={i} className="flex justify-between items-center py-3">
                      <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{nota.titulo_actividad}</span>
                      <Badge variant={nota.calificacion >= 70 ? 'success' : 'danger'}>
                        {nota.calificacion} / 100
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </CardWrap>

          {/* Pendientes */}
          <CardWrap>
            <CardHead>
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <span className="text-lg">⏳</span> Atención a Caducidad
              </h3>
            </CardHead>
            <CardBody>
              {indicadores.pendientes.length === 0 ? (
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium text-center py-4">
                  ✅ ¡Excelente! Estás al corriente.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-dark-border">
                  {indicadores.pendientes.map((act, i) => (
                    <li key={i} className="py-3">
                      <div className="flex justify-between items-start mb-1">
                        <strong className="text-sm text-slate-800 dark:text-slate-200">{act.titulo}</strong>
                        <Badge variant="warning">{act.tipo}</Badge>
                      </div>
                      <p className="text-xs text-slate-400">
                        {act.fecha_limite ? `Vence: ${new Date(act.fecha_limite).toLocaleDateString('es-MX')}` : 'Sin límite'}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </CardWrap>
        </div>
      )}

      {/* ── DOCENTE ────────────────────────────────────────────────────── */}
      {role === 'docente' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <CardWrap className="bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/20 dark:to-dark-card !border-primary-100 dark:!border-primary-900/30">
            <CardBody className="text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-primary-500 mb-3">Resumen de Cátedra</p>
              <div className="text-6xl font-black text-slate-800 dark:text-white leading-none">
                {indicadores.misCursos.length}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mt-2">Cursos Impartidos</div>
            </CardBody>
          </CardWrap>

          <CardWrap>
            <CardHead>
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <span className="text-lg">📋</span> Entregas para Evaluar
              </h3>
            </CardHead>
            <CardBody>
              {indicadores.pendientes.length === 0 ? (
                <p className="text-sm text-slate-400 italic text-center py-4">Bandeja limpia. ✨</p>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-dark-border">
                  {indicadores.pendientes.map((ent, i) => (
                    <li key={i} className="py-3">
                      <strong className="text-sm block text-slate-800 dark:text-slate-200">
                        {ent.perfiles_usuarios?.nombre_completo}
                      </strong>
                      <p className="text-xs text-slate-400 mt-0.5">{ent.tareas?.titulo}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </CardWrap>
        </div>
      )}

      {/* ── ADMINISTRADOR ──────────────────────────────────────────────── */}
      {role === 'administrador' && indicadores.resumenGlobal && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="relative overflow-hidden rounded-2xl bg-slate-800 dark:bg-slate-900 shadow-xl p-6">
              <div className="absolute -top-4 -right-4 text-8xl opacity-10 select-none">👥</div>
              <div className="relative z-10 text-center py-4">
                <div className="text-5xl font-black text-white mb-2">{indicadores.resumenGlobal.usuarios_activos}</div>
                <div className="text-slate-400 font-semibold uppercase tracking-widest text-xs">Usuarios Activos</div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-indigo-600 dark:bg-indigo-800 shadow-xl p-6">
              <div className="absolute -top-4 -right-4 text-8xl opacity-10 select-none">📚</div>
              <div className="relative z-10 text-center py-4">
                <div className="text-5xl font-black text-white mb-2">{indicadores.resumenGlobal.cursos_activos}</div>
                <div className="text-indigo-200 font-semibold uppercase tracking-widest text-xs">Cursos Activos</div>
              </div>
            </div>
          </div>

          <CardWrap>
            <CardHead>
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <span className="text-lg">💬</span> Mensajes Recientes del Foro
              </h3>
            </CardHead>
            <CardBody>
              {indicadores.mensajesRecientes.length === 0 ? (
                <p className="text-sm text-slate-400 italic text-center py-4">Sin actividad reciente.</p>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-dark-border">
                  {indicadores.mensajesRecientes.map((m, i) => (
                    <li key={i} className="py-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 flex items-center justify-center text-xs font-bold">
                          {m.perfiles_usuarios?.nombre_completo?.charAt(0) || '?'}
                        </div>
                        <strong className="text-sm text-slate-700 dark:text-slate-200">{m.perfiles_usuarios?.nombre_completo}</strong>
                        <span className="text-xs text-slate-400 ml-auto">{new Date(m.created_at).toLocaleString('es-MX')}</span>
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-dark-bg px-4 py-3 rounded-xl border border-slate-100 dark:border-dark-border border-l-4 border-l-primary-400 dark:border-l-primary-700">
                        "{m.contenido}"
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </CardWrap>
        </div>
      )}
    </div>
  );
};

export default DashboardInsights;
