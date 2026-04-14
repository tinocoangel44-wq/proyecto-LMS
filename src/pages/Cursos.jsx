import React, { useState, useEffect, useCallback } from 'react';
import { getCursos, getCategorias, createCurso, updateCurso, deleteCurso } from '../services/cursosService';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import CourseList from '../components/CourseList';
import CreateCourse from '../components/CreateCourse';

// Emoji por categoría
const CATEGORIA_EMOJI = {
  'programación':           '💻',
  'bases de datos':         '🗄️',
  'redes':                  '🌐',
  'inteligencia artificial':'🤖',
  'desarrollo web':         '🌍',
  'ciberseguridad':         '🔒',
  'matemáticas':            '📐',
  'electrónica':            '⚡',
  'ofimática':              '📊',
};

const getEmoji = (nombre = '') => CATEGORIA_EMOJI[nombre.toLowerCase()] || '📚';

const Cursos = () => {
  const { user, perfil, role } = useAuth();
  const [cursos, setCursos]           = useState([]);
  const [categorias, setCategorias]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [showForm, setShowForm]       = useState(false);
  const [editingCurso, setEditingCurso] = useState(null);
  const [feedback, setFeedback]       = useState({ type: '', text: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEstado, setFilterEstado]       = useState('todos');
  const [filterCategoria, setFilterCategoria] = useState('todas');
  const [queryError, setQueryError]           = useState(null);

  const canManage = role === 'administrador' || role === 'docente';

  const loadCursos = useCallback(async () => {
    if (!user) return;            // ← esperar sesión activa
    setLoading(true);
    setQueryError(null);
    console.log('[Cursos] Llamando a getCursos...');
    const { data, error } = await getCursos();
    console.log('[Cursos] Respuesta:', { data, error });
    if (error) {
      console.error('[Cursos] Error fetching cursos:', error);
      setQueryError(error.message || 'Error al cargar cursos.');
    } else if (data) {
      setCursos(data);
    }
    setLoading(false);
  }, [user]);   // ← re-ejecutar cuando cambie el usuario

  useEffect(() => {
    loadCursos();
    if (user) getCategorias().then(({ data }) => { if (data) setCategorias(data); });
  }, [loadCursos, user]);

  const showFeedback = (type, text) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback({ type: '', text: '' }), 4000);
  };

  const handleFormSubmit = async (formData) => {
    setSaving(true);
    try {
      if (editingCurso) {
        const { error } = await updateCurso(editingCurso.id, formData);
        if (error) throw error;
        showFeedback('success', '✅ Curso actualizado correctamente.');
      } else {
        const { error } = await createCurso(
          { ...formData, creado_por: user?.id },
          perfil?.id
        );
        if (error) throw error;
        showFeedback('success', '🎉 Curso creado y publicado correctamente.');
      }
      setShowForm(false);
      setEditingCurso(null);
      await loadCursos();
    } catch (err) {
      showFeedback('error', '❌ Error: ' + (err.message || 'No se pudo guardar el curso.'));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (curso) => {
    setEditingCurso(curso);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Confirmas que deseas eliminar este curso? Esta acción no se puede deshacer.')) return;
    const { error } = await deleteCurso(id);
    if (error) {
      showFeedback('error', '❌ No se pudo eliminar el curso.');
    } else {
      showFeedback('success', '🗑️ Curso eliminado correctamente.');
      await loadCursos();
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingCurso(null);
  };

  // Filtrado local
  const cursosFiltrados = cursos.filter(c => {
    const matchQuery = !searchQuery ||
      c.titulo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.descripcion?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.categorias_cursos?.nombre?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchEstado    = filterEstado === 'todos' || c.estado === filterEstado;
    const matchCategoria = filterCategoria === 'todas' || c.categoria_id === filterCategoria;
    return matchQuery && matchEstado && matchCategoria;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* ── Encabezado ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
            {canManage ? 'Gestión de Cursos' : 'Catálogo de Cursos'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {canManage
              ? `${cursos.length} curso${cursos.length !== 1 ? 's' : ''} en el sistema`
              : 'Explora todos los cursos disponibles'}
          </p>
        </div>
        {canManage && !showForm && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => loadCursos()} size="sm">
              🔄 Recargar
            </Button>
            <Button variant="primary" onClick={() => { setEditingCurso(null); setShowForm(true); }}>
              + Nuevo Curso
            </Button>
          </div>
        )}
      </div>

      {/* ── Feedback ──────────────────────────────────────────────── */}
      {feedback.text && <Alert type={feedback.type}>{feedback.text}</Alert>}
      {queryError && (
        <Alert type="error">
          ⚠️ Error al cargar cursos: {queryError} — Actualiza la página o vuelve a iniciar sesión.
        </Alert>
      )}

      {/* ── Formulario de creación/edición ────────────────────────── */}
      {showForm && canManage && (
        <Card>
          <div className="px-5 py-4 border-b border-slate-100 dark:border-dark-border">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                {editingCurso ? '✏️ Editar Curso' : '✨ Nuevo Curso'}
              </h2>
              <button
                onClick={handleCancelForm}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-dark-bg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="p-5 max-w-2xl">
            <CreateCourse onSubmit={handleFormSubmit} initialData={editingCurso} isLoading={saving} />
          </div>
        </Card>
      )}

      {/* ── Barra de filtros ──────────────────────────────────────── */}
      <div className="flex flex-col gap-3">

        {/* Búsqueda */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por título, descripción o categoría..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
          />
        </div>

        {/* Filtros por estado + categoría */}
        <div className="flex flex-wrap gap-2 items-center">

          {/* Filtro por estado (solo para admin/docente) */}
          {canManage && (
            <div className="flex gap-1.5 flex-wrap">
              {['todos', 'publicado', 'borrador', 'archivado'].map(estado => (
                <button
                  key={estado}
                  onClick={() => setFilterEstado(estado)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                    filterEstado === estado
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-400 hover:border-primary-300'
                  }`}
                >
                  {estado}
                </button>
              ))}
            </div>
          )}

          {/* Separador vertical */}
          {canManage && categorias.length > 0 && (
            <div className="h-5 w-px bg-slate-200 dark:bg-dark-border hidden sm:block" />
          )}

          {/* Filtro por categoría */}
          {categorias.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setFilterCategoria('todas')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  filterCategoria === 'todas'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-400 hover:border-indigo-300'
                }`}
              >
                🗂️ Todas
              </button>
              {categorias.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategoria(cat.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    filterCategoria === cat.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-400 hover:border-indigo-300'
                  }`}
                >
                  {getEmoji(cat.nombre)} {cat.nombre}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Contador de resultados */}
        {(searchQuery || filterCategoria !== 'todas' || filterEstado !== 'todos') && (
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              {cursosFiltrados.length} resultado{cursosFiltrados.length !== 1 ? 's' : ''}
              {filterCategoria !== 'todas' && ` en ${categorias.find(c => c.id === filterCategoria)?.nombre}`}
            </span>
            <button
              onClick={() => { setSearchQuery(''); setFilterEstado('todos'); setFilterCategoria('todas'); }}
              className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* ── Catálogo de cursos ────────────────────────────────────── */}
      <CourseList
        cursos={cursosFiltrados}
        loading={loading}
        showActions={canManage}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage={
          searchQuery || filterCategoria !== 'todas'
            ? `No se encontraron cursos${filterCategoria !== 'todas' ? ` en esta categoría` : ''} que coincidan con los filtros.`
            : 'No hay cursos disponibles en este momento.'
        }
      />
    </div>
  );
};

export default Cursos;
