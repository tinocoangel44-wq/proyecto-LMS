import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getCursoById,
  getEstructuraCurso,
  createModulo,
  deleteModulo,
  createMaterial,
  deleteMaterial,
} from '../services/contenidosService';
import SeccionTareas from '../components/SeccionTareas';
import SeccionCuestionarios from '../components/SeccionCuestionarios';
import SeccionForo from '../components/SeccionForo';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Alert from '../components/ui/Alert';

// ── Constantes de tipos de material ───────────────────────────────────────
const TIPOS_MATERIAL = [
  { value: 'video', label: 'Video', icon: '🎥', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  { value: 'texto', label: 'Lectura', icon: '📄', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'enlace', label: 'Enlace', icon: '🔗', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { value: 'archivo', label: 'Archivo', icon: '📎', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
];

const getTipoInfo = (tipo) =>
  TIPOS_MATERIAL.find(t => t.value === tipo) || TIPOS_MATERIAL[1];

// ── Skeleton loader ────────────────────────────────────────────────────────
const Skeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-40 bg-slate-200 dark:bg-dark-bg rounded-2xl" />
    {[1, 2, 3].map(i => (
      <div key={i} className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border p-6 space-y-3">
        <div className="h-5 bg-slate-200 dark:bg-dark-bg rounded w-1/3" />
        <div className="h-3 bg-slate-200 dark:bg-dark-bg rounded w-2/3" />
        <div className="pl-6 space-y-2 mt-4">
          {[1, 2].map(j => <div key={j} className="h-10 bg-slate-100 dark:bg-dark-bg rounded-lg" />)}
        </div>
      </div>
    ))}
  </div>
);

// ── Formulario de Módulo ───────────────────────────────────────────────────
const ModuloForm = ({ onSubmit, initial = null, onCancel, isLoading }) => {
  const [data, setData] = useState({
    titulo: initial?.titulo || '',
    descripcion: initial?.descripcion || '',
    orden: initial?.orden ?? 1,
  });
  return (
    <form
      onSubmit={e => { e.preventDefault(); onSubmit(data); }}
      className="bg-primary-50 dark:bg-primary-900/10 border border-primary-200 dark:border-primary-900/30 rounded-xl p-5 space-y-4"
    >
      <h3 className="font-bold text-primary-800 dark:text-primary-300 text-sm flex items-center gap-2">
        📦 {initial ? 'Editar módulo' : 'Nuevo módulo académico'}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="sm:col-span-3">
          <Input
            required
            label="TÍTULO *"
            placeholder="Ej. Unidad 1: Fundamentos..."
            value={data.titulo}
            onChange={e => setData(p => ({ ...p, titulo: e.target.value }))}
          />
        </div>
        <div>
          <Input
            required
            type="number"
            label="ORDEN *"
            min={1}
            value={data.orden}
            onChange={e => setData(p => ({ ...p, orden: parseInt(e.target.value) }))}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Descripción</label>
        <textarea
          rows={2}
          placeholder="Instrucciones o presentación del bloque..."
          value={data.descripcion}
          onChange={e => setData(p => ({ ...p, descripcion: e.target.value }))}
          className="px-4 py-2 text-sm bg-white dark:bg-dark-bg border border-slate-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white resize-none"
        />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 rounded-lg transition-colors">
          Cancelar
        </button>
        <Button type="submit" variant="primary" isLoading={isLoading} size="sm">
          {initial ? 'Guardar cambios' : 'Crear módulo'}
        </Button>
      </div>
    </form>
  );
};

// ── Formulario de Material ─────────────────────────────────────────────────
const MaterialForm = ({ onSubmit, onCancel, isLoading, nextOrden = 1 }) => {
  const [data, setData] = useState({
    titulo: '',
    descripcion: '',
    tipo_material: 'texto',
    url_contenido: '',
    orden: nextOrden,
  });

  const tipo = getTipoInfo(data.tipo_material);
  const needsUrl = data.tipo_material !== 'texto';

  return (
    <form
      onSubmit={e => { e.preventDefault(); onSubmit(data); }}
      className="bg-indigo-50/60 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-900/30 rounded-xl p-4 space-y-3 mt-3"
    >
      <h4 className="font-semibold text-indigo-800 dark:text-indigo-300 text-xs flex items-center gap-2">
        📎 Agregar recurso al módulo
      </h4>

      {/* Tipo selector visual */}
      <div className="flex gap-2 flex-wrap">
        {TIPOS_MATERIAL.map(t => (
          <button
            key={t.value}
            type="button"
            onClick={() => setData(p => ({ ...p, tipo_material: t.value }))}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${
              data.tipo_material === t.value
                ? 'border-indigo-500 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                : 'border-slate-200 dark:border-dark-border text-slate-500 hover:border-indigo-300'
            }`}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-9">
          <Input
            required
            placeholder={`Nombre del recurso — ${tipo.label}`}
            value={data.titulo}
            onChange={e => setData(p => ({ ...p, titulo: e.target.value }))}
          />
        </div>
        <div className="sm:col-span-3">
          <Input
            required
            type="number"
            min={1}
            placeholder="Orden"
            value={data.orden}
            onChange={e => setData(p => ({ ...p, orden: parseInt(e.target.value) }))}
          />
        </div>
      </div>

      {needsUrl ? (
        <Input
          required
          placeholder={`URL del ${tipo.label.toLowerCase()} (https://...)`}
          type="url"
          value={data.url_contenido}
          onChange={e => setData(p => ({ ...p, url_contenido: e.target.value }))}
        />
      ) : (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">CONTENIDO MARKDOWN / TEXTO</label>
          <textarea
            rows={4}
            placeholder="Escribe el contenido del material aquí (soporta texto con formato Markdown)..."
            value={data.url_contenido}
            onChange={e => setData(p => ({ ...p, url_contenido: e.target.value }))}
            className="px-4 py-2 text-sm bg-white dark:bg-dark-bg border border-slate-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white resize-none"
          />
        </div>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} className="px-4 py-1.5 text-sm text-slate-500 hover:text-slate-700 rounded-lg transition-colors">
          Cancelar
        </button>
        <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
          Añadir recurso
        </Button>
      </div>
    </form>
  );
};

// ── Fila de Material ───────────────────────────────────────────────────────
const MaterialRow = ({ mat, canManage, onDelete, expandido, onToggle }) => {
  const tipo = getTipoInfo(mat.tipo_material);
  const isTexto = mat.tipo_material === 'texto';

  return (
    <li className="group">
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-bg/50 transition-colors cursor-pointer"
        onClick={isTexto ? onToggle : undefined}
      >
        {/* Icono tipo */}
        <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm ${tipo.color}`}>
          {tipo.icon}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 w-5">{mat.orden}.</span>
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{mat.titulo}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${tipo.color}`}>
              {tipo.label}
            </span>
          </div>
          {mat.descripcion && (
            <p className="text-xs text-slate-400 dark:text-slate-500 ml-7 mt-0.5 truncate">{mat.descripcion}</p>
          )}
        </div>

        {/* Acción principal */}
        <div className="flex-shrink-0 flex items-center gap-2">
          {!isTexto && mat.url_contenido && (
            <a
              href={mat.url_contenido}
              target="_blank"
              rel="noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-xs px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              {mat.tipo_material === 'video' ? '▶ Ver' : '↗ Abrir'}
            </a>
          )}
          {isTexto && (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {expandido ? '▲ Colapsar' : '▼ Leer'}
            </span>
          )}
          {canManage && (
            <button
              onClick={e => { e.stopPropagation(); onDelete(mat.id); }}
              className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
              title="Eliminar material"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Contenido expandible para tipo texto */}
      {isTexto && expandido && mat.url_contenido && (
        <div className="ml-11 mr-4 mb-3 px-4 py-3 bg-slate-50 dark:bg-dark-bg rounded-xl text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap border border-slate-100 dark:border-dark-border leading-relaxed">
          {mat.url_contenido}
        </div>
      )}
    </li>
  );
};

// ── Módulo Acordeón ────────────────────────────────────────────────────────
const ModuloCard = ({ modulo, canManage, perfil, onRefresh }) => {
  const [abierto, setAbierto] = useState(true);
  const [showMatForm, setShowMatForm] = useState(false);
  const [savingMat, setSavingMat] = useState(false);
  const [expandedMat, setExpandedMat] = useState(null);

  const handleAddMaterial = async (formData) => {
    setSavingMat(true);
    await createMaterial({
      modulo_id: modulo.id,
      ...formData,
      publicado_por: perfil?.id,
    });
    setSavingMat(false);
    setShowMatForm(false);
    onRefresh();
  };

  const handleDeleteMat = async (matId) => {
    if (!window.confirm('¿Eliminar este material?')) return;
    await deleteMaterial(matId);
    onRefresh();
  };

  const materiales = modulo.materiales || [];
  const nextOrden = Math.max(0, ...materiales.map(m => m.orden)) + 1;

  return (
    <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl shadow-sm overflow-hidden">
      {/* Cabecera del módulo */}
      <div
        className="flex items-center gap-4 px-6 py-4 cursor-pointer select-none hover:bg-slate-50 dark:hover:bg-dark-bg/30 transition-colors"
        onClick={() => setAbierto(!abierto)}
      >
        {/* Número de orden */}
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 flex items-center justify-center font-bold text-sm">
          {modulo.orden}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-slate-800 dark:text-white text-base truncate">{modulo.titulo}</h2>
          {modulo.descripcion && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{modulo.descripcion}</p>
          )}
          <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
            <span>{materiales.length} recurso{materiales.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Controles admin/docente */}
        {canManage && (
          <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => { setShowMatForm(!showMatForm); setAbierto(true); }}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Recurso
            </button>
            <button
              onClick={async () => {
                if (window.confirm('¿Eliminar módulo y todos sus materiales?')) {
                  await deleteModulo(modulo.id);
                  onRefresh();
                }
              }}
              className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg transition-colors"
              title="Eliminar módulo"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}

        {/* Toggle icon */}
        <span className={`text-slate-400 transition-transform duration-200 flex-shrink-0 ${abierto ? 'rotate-180' : ''}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </div>

      {/* Cuerpo del acordeón */}
      {abierto && (
        <div className="border-t border-slate-100 dark:border-dark-border">
          {/* Formulario de material inline */}
          {showMatForm && canManage && (
            <div className="px-4 pt-3 pb-4 border-b border-indigo-100 dark:border-indigo-900/30">
              <MaterialForm
                onSubmit={handleAddMaterial}
                onCancel={() => setShowMatForm(false)}
                isLoading={savingMat}
                nextOrden={nextOrden}
              />
            </div>
          )}

          {/* Lista de materiales */}
          {materiales.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <div className="text-3xl mb-2 opacity-30">📂</div>
              <p className="text-sm italic text-slate-400">Este módulo no tiene materiales todavía.</p>
              {canManage && (
                <button
                  onClick={() => setShowMatForm(true)}
                  className="mt-3 text-xs text-primary-600 dark:text-primary-400 hover:underline"
                >
                  + Agregar primer recurso
                </button>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-slate-50 dark:divide-dark-border/50 px-2 py-2">
              {materiales.map(mat => (
                <MaterialRow
                  key={mat.id}
                  mat={mat}
                  canManage={canManage}
                  onDelete={handleDeleteMat}
                  expandido={expandedMat === mat.id}
                  onToggle={() => setExpandedMat(expandedMat === mat.id ? null : mat.id)}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

// ── Componente Principal CursoDetalle ──────────────────────────────────────
const CursoDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role, perfil } = useAuth();

  const [curso, setCurso] = useState(null);
  const [modulos, setModulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModForm, setShowModForm] = useState(false);
  const [savingMod, setSavingMod] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('contenido');

  const canManage = role === 'administrador' || role === 'docente';

  const cargar = useCallback(async () => {
    setLoading(true);
    const [cursoRes, modulosRes] = await Promise.all([
      getCursoById(id),
      getEstructuraCurso(id),
    ]);
    if (cursoRes.data) setCurso(cursoRes.data);
    if (modulosRes.data) setModulos(modulosRes.data);
    setLoading(false);
  }, [id]);

  useEffect(() => { cargar(); }, [cargar]);

  const showFeedback = (type, text) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback({ type: '', text: '' }), 4000);
  };

  const handleCreateModulo = async (formData) => {
    setSavingMod(true);
    const { error } = await createModulo({ curso_id: id, ...formData });
    setSavingMod(false);
    if (error) {
      showFeedback('error', 'Error al crear el módulo: ' + error.message);
    } else {
      showFeedback('success', '✅ Módulo creado correctamente.');
      setShowModForm(false);
      cargar();
    }
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto p-6">
      <Skeleton />
    </div>
  );

  const docentes = curso?.curso_docentes?.map(cd => cd.perfiles_usuarios?.nombre_completo).filter(Boolean) || [];
  const tabs = [
    { id: 'contenido', label: 'Contenido', icon: '📚' },
    { id: 'tareas', label: 'Tareas', icon: '📝' },
    { id: 'cuestionarios', label: 'Cuestionarios', icon: '📋' },
    { id: 'foro', label: 'Foro', icon: '💬' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">

      {/* Navegación */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver al catálogo
        </button>
      </div>

      {/* Hero del curso */}
      {curso && (
        <div className="relative rounded-2xl overflow-hidden shadow-lg">
          {/* Imagen de portada */}
          <div className="h-48 bg-gradient-to-br from-primary-600 to-indigo-700 relative">
            {curso.imagen_url && (
              <img
                src={curso.imagen_url}
                alt={curso.titulo}
                className="absolute inset-0 w-full h-full object-cover"
                onError={e => e.target.style.display = 'none'}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </div>

          {/* Información superpuesta */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                {curso.categorias_cursos?.nombre && (
                  <span className="text-xs bg-white/20 backdrop-blur-sm text-white px-2.5 py-1 rounded-full mb-2 inline-block">
                    {curso.categorias_cursos.nombre}
                  </span>
                )}
                <h1 className="text-2xl font-bold text-white leading-tight">{curso.titulo}</h1>
                {docentes.length > 0 && (
                  <p className="text-sm text-white/80 mt-1">👨‍🏫 {docentes.join(', ')}</p>
                )}
              </div>
              <span className={`flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full capitalize ${
                curso.estado === 'publicado'
                  ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                  : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
              }`}>
                {curso.estado}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Feedback global */}
      {feedback.text && <Alert type={feedback.type}>{feedback.text}</Alert>}

      {/* Tabs de navegación */}
      <div className="flex gap-1 bg-slate-100 dark:bg-dark-bg rounded-xl p-1 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white dark:bg-dark-card text-primary-700 dark:text-primary-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB: CONTENIDO ────────────────────────────────── */}
      {activeTab === 'contenido' && (
        <div className="space-y-4">
          {/* Descripción del curso */}
          {curso?.descripcion && (
            <div className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border p-5">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Acerca de este curso</h3>
              <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{curso.descripcion}</p>
            </div>
          )}

          {/* Botón nuevo módulo */}
          {canManage && !showModForm && (
            <div className="flex justify-end">
              <Button variant="primary" onClick={() => setShowModForm(true)}>
                + Agregar módulo
              </Button>
            </div>
          )}

          {/* Formulario nuevo módulo */}
          {showModForm && canManage && (
            <ModuloForm
              onSubmit={handleCreateModulo}
              onCancel={() => setShowModForm(false)}
              isLoading={savingMod}
            />
          )}

          {/* Árbol de módulos y materiales */}
          {modulos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-200 dark:border-dark-border rounded-2xl">
              <div className="text-5xl mb-3 opacity-30">📦</div>
              <h3 className="text-base font-semibold text-slate-500 dark:text-slate-400">Sin contenido todavía</h3>
              <p className="text-sm text-slate-400 mt-1">
                {canManage
                  ? 'Crea el primer módulo para comenzar a estructurar el curso.'
                  : 'El docente aún no ha publicado contenido en este curso.'}
              </p>
              {canManage && (
                <Button variant="primary" className="mt-4" onClick={() => setShowModForm(true)}>
                  + Crear primer módulo
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                {modulos.length} módulo{modulos.length !== 1 ? 's' : ''} — {modulos.reduce((acc, m) => acc + (m.materiales?.length || 0), 0)} recursos totales
              </p>
              {modulos.map(modulo => (
                <ModuloCard
                  key={modulo.id}
                  modulo={modulo}
                  canManage={canManage}
                  perfil={perfil}
                  onRefresh={cargar}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: TAREAS ───────────────────────────────────── */}
      {activeTab === 'tareas' && <SeccionTareas cursoId={id} />}

      {/* ── TAB: CUESTIONARIOS ───────────────────────────── */}
      {activeTab === 'cuestionarios' && <SeccionCuestionarios cursoId={id} />}

      {/* ── TAB: FORO ─────────────────────────────────────── */}
      {activeTab === 'foro' && <SeccionForo cursoId={id} />}
    </div>
  );
};

export default CursoDetalle;
