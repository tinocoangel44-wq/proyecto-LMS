import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardAdmin } from '../services/dashboardService';
import { getUsuariosGrl, crearUsuarioAdmin, eliminarUsuarioAdmin } from '../services/adminService';
import { getCursos } from '../services/cursosService';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import ExternalWidgets from '../components/ExternalWidgets';

// ── Helpers ────────────────────────────────────────────────────────────────
const timeAgo = (d) => {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'Ahora';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
};

const rolColors = {
  administrador: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  docente: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  estudiante: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

const Skeleton = ({ h = 'h-20', className = '' }) => (
  <div className={`animate-pulse bg-slate-100 dark:bg-dark-bg rounded-xl ${h} ${className}`} />
);

// ── KPI Card ───────────────────────────────────────────────────────────────
const KpiCard = ({ icon, label, value, sub, accent = 'blue' }) => {
  const accents = {
    blue:   'from-blue-500 to-indigo-600',
    green:  'from-emerald-500 to-teal-600',
    amber:  'from-amber-500 to-orange-500',
    rose:   'from-rose-500 to-pink-600',
    purple: 'from-violet-500 to-purple-600',
  };
  return (
    <div className="relative bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl p-5 overflow-hidden group hover:shadow-md transition-shadow">
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full bg-gradient-to-br ${accents[accent]} opacity-10 group-hover:opacity-15 transition-opacity`} />
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accents[accent]} flex items-center justify-center text-lg mb-3`}>
        {icon}
      </div>
      <div className="text-3xl font-black text-slate-800 dark:text-white">{value ?? '—'}</div>
      <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">{label}</div>
      {sub && <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
const DashboardAdmin = () => {
  const { user } = useAuth();

  const [dash, setDash] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview | usuarios | cursos

  const [showModal, setShowModal] = useState(false);
  const [formUser, setFormUser] = useState({ email: '', password: '', nombreCompleto: '', rol: 'estudiante' });
  const [saving, setSaving] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    const [dashRes, usersRes, cursosRes] = await Promise.all([
      getDashboardAdmin(),
      getUsuariosGrl(),
      getCursos(),
    ]);
    setDash(dashRes);
    if (usersRes.data) setUsuarios(usersRes.data);
    if (cursosRes.data) setCursos(cursosRes.data);
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleCrear = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await crearUsuarioAdmin(formUser);
    setSaving(false);
    if (error) alert('Error: ' + error.message);
    else {
      setShowModal(false);
      setFormUser({ email: '', password: '', nombreCompleto: '', rol: 'estudiante' });
      cargar();
    }
  };

  const handleEliminar = async (userId) => {
    if (!window.confirm('¿Eliminar permanentemente este usuario?')) return;
    await eliminarUsuarioAdmin(userId);
    cargar();
  };

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: '📊' },
    { id: 'usuarios', label: `Usuarios (${usuarios.length})`, icon: '👥' },
    { id: 'cursos',   label: `Cursos (${cursos.length})`, icon: '📚' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-7xl mx-auto">

      {/* Modal crear usuario */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 dark:text-white">Crear nuevo usuario</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1">✕</button>
            </div>
            <form onSubmit={handleCrear} className="space-y-3">
              <Input required label="Nombre completo" value={formUser.nombreCompleto} onChange={e => setFormUser(p => ({ ...p, nombreCompleto: e.target.value }))} />
              <Input required type="email" label="Correo electrónico" value={formUser.email} onChange={e => setFormUser(p => ({ ...p, email: e.target.value }))} />
              <Input required type="password" label="Contraseña (mín. 6 chars)" minLength={6} value={formUser.password} onChange={e => setFormUser(p => ({ ...p, password: e.target.value }))} />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Rol</label>
                <select
                  value={formUser.rol}
                  onChange={e => setFormUser(p => ({ ...p, rol: e.target.value }))}
                  className="px-4 py-2 bg-slate-50 dark:bg-dark-bg border border-slate-300 dark:border-dark-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                >
                  <option value="estudiante">Estudiante</option>
                  <option value="docente">Docente</option>
                  <option value="administrador">Administrador</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 text-sm text-slate-500 border border-slate-200 dark:border-dark-border rounded-xl hover:bg-slate-50 dark:hover:bg-dark-bg transition-colors">Cancelar</button>
                <Button type="submit" variant="primary" isLoading={saving} className="flex-1">Crear usuario</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="relative bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-10 -top-10 w-48 h-48 bg-primary-600 rounded-full opacity-10 blur-3xl" />
          <div className="absolute right-20 -bottom-10 w-36 h-36 bg-indigo-500 rounded-full opacity-10 blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-500/20 text-primary-300 rounded-full text-xs font-bold mb-3 border border-primary-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" /> Sistema · Acceso Total
            </div>
            <h1 className="text-3xl font-black tracking-tight">Centro de Mando</h1>
            <p className="text-slate-400 text-sm mt-1">Bienvenido, <span className="text-white font-semibold">{user?.email}</span></p>
          </div>
          <button
            onClick={() => { setActiveTab('usuarios'); setShowModal(true); }}
            className="flex-shrink-0 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-primary-900/30"
          >
            + Crear usuario
          </button>
        </div>
      </div>

      {/* KPIs + Widget externo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {loading ? (
            <div className="grid grid-cols-2 gap-4">
              {[1,2,3,4].map(i => <Skeleton key={i} h="h-28" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <KpiCard icon="👥" label="Usuarios totales" value={dash?.kpis.totalUsuarios} sub={`${dash?.kpis.docentes} doc · ${dash?.kpis.estudiantes} est`} accent="blue" />
              <KpiCard icon="📚" label="Cursos activos" value={dash?.kpis.cursosActivos} sub={`${dash?.kpis.totalCursos} totales`} accent="purple" />
              <KpiCard icon="🎓" label="Matrículas" value={dash?.kpis.totalInscripciones} sub="inscripciones activas" accent="green" />
              <KpiCard icon="📝" label="Entregas (7d)" value={dash?.kpis.entregasRecientes} sub="últimos 7 días" accent="amber" />
            </div>
          )}
        </div>
        <ExternalWidgets className="h-full min-h-[200px]" />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-dark-border gap-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-5 py-3 text-sm font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === t.id
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Distribución de roles */}
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">Distribución de usuarios</h3>
            {[
              { rol: 'estudiante', count: dash?.kpis.estudiantes, total: dash?.kpis.totalUsuarios, color: 'bg-emerald-500' },
              { rol: 'docente',    count: dash?.kpis.docentes,    total: dash?.kpis.totalUsuarios, color: 'bg-indigo-500' },
              { rol: 'admin',      count: dash?.kpis.admins,      total: dash?.kpis.totalUsuarios, color: 'bg-rose-500'    },
            ].map(r => {
              const pct = r.total > 0 ? Math.round((r.count / r.total) * 100) : 0;
              return (
                <div key={r.rol}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 dark:text-slate-400 capitalize">{r.rol}</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{r.count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-dark-bg rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${r.color} transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Usuarios recientes */}
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Usuarios recientes</h3>
              <button onClick={() => setActiveTab('usuarios')} className="text-xs text-primary-600 dark:text-primary-400 hover:underline">Ver todos →</button>
            </div>
            <div className="space-y-3">
              {(dash?.usuariosRecientes || []).slice(0, 5).map(u => (
                <div key={u.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {(u.nombre_completo || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{u.nombre_completo}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${rolColors[u.roles?.nombre] || ''}`}>
                    {u.roles?.nombre?.[0]?.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Mensajes del foro recientes */}
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl p-5">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm mb-4">💬 Actividad en foros</h3>
            {(dash?.mensajesRecientes || []).length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Sin mensajes recientes</p>
            ) : (
              <div className="space-y-3">
                {(dash?.mensajesRecientes || []).map(m => (
                  <div key={m.id} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-dark-bg text-slate-600 dark:text-slate-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {(m.perfiles_usuarios?.nombre_completo || '?').charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{m.perfiles_usuarios?.nombre_completo}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">"{m.contenido}"</p>
                    </div>
                    <span className="text-[10px] text-slate-400 flex-shrink-0">{timeAgo(m.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Usuarios */}
      {activeTab === 'usuarios' && (
        <div className="animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-800 dark:text-white">Control de usuarios</h2>
            <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>+ Crear usuario</Button>
          </div>
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-dark-bg border-b border-slate-200 dark:border-dark-border text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3 font-semibold">Usuario</th>
                    <th className="px-5 py-3 font-semibold">Rol</th>
                    <th className="px-5 py-3 font-semibold">Estado</th>
                    <th className="px-5 py-3 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                  {loading ? (
                    <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-400">Cargando...</td></tr>
                  ) : usuarios.map(u => (
                    <tr key={u.user_id} className="hover:bg-slate-50 dark:hover:bg-dark-bg/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 flex items-center justify-center text-xs font-bold">
                            {(u.nombre_completo || '?').charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{u.nombre_completo}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold capitalize ${rolColors[u.roles?.nombre] || 'bg-slate-100 text-slate-500'}`}>
                          {u.roles?.nombre}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-1 rounded-full font-bold">Activo</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => handleEliminar(u.user_id)}
                          disabled={user?.id === u.user_id}
                          className="text-xs px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 rounded-lg transition-colors disabled:opacity-30"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Cursos */}
      {activeTab === 'cursos' && (
        <div className="animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-800 dark:text-white">Catálogo de cursos</h2>
            <Link to="/cursos">
              <Button variant="secondary" size="sm">Gestionar cursos ↗</Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              [1,2,3].map(i => <Skeleton key={i} h="h-40" />)
            ) : cursos.map(c => (
              <Link key={c.id} to={`/cursos/${c.id}`}>
                <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl overflow-hidden hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700 transition-all group">
                  <div className="h-2 bg-gradient-to-r from-primary-500 to-indigo-600" />
                  <div className="p-5">
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">{c.categorias_cursos?.nombre || 'General'}</span>
                    <h3 className="font-bold text-slate-800 dark:text-white mt-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">{c.titulo}</h3>
                    <div className="flex items-center justify-between mt-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${c.estado === 'publicado' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {c.estado}
                      </span>
                      <span className="text-xs text-slate-400">Ver →</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardAdmin;
