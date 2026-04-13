import React from 'react';
import { Link } from 'react-router-dom';

// Skeleton loader para las cards mientras carga
const CourseCardSkeleton = () => (
  <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl overflow-hidden animate-pulse">
    <div className="h-44 bg-slate-200 dark:bg-dark-bg" />
    <div className="p-5 space-y-3">
      <div className="h-4 bg-slate-200 dark:bg-dark-bg rounded w-1/3" />
      <div className="h-5 bg-slate-200 dark:bg-dark-bg rounded w-4/5" />
      <div className="h-3 bg-slate-200 dark:bg-dark-bg rounded w-full" />
      <div className="h-3 bg-slate-200 dark:bg-dark-bg rounded w-2/3" />
      <div className="h-10 bg-slate-200 dark:bg-dark-bg rounded-lg mt-4" />
    </div>
  </div>
);

// Paleta de gradientes para el placeholder según índice
const PLACEHOLDER_GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-600',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-blue-600',
];

// Card individual de curso
const CourseCard = ({ curso, showActions = false, onEdit, onDelete, index = 0 }) => {
  const [imgError, setImgError] = React.useState(false);

  const docentes = curso.curso_docentes
    ?.map(cd => cd.perfiles_usuarios?.nombre_completo)
    .filter(Boolean)
    .join(', ') || 'Sin asignar';

  const estadoColor = {
    publicado: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    borrador:  'bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400',
    archivado: 'bg-slate-100  text-slate-600  dark:bg-slate-800     dark:text-slate-400',
  };

  const gradiente = PLACEHOLDER_GRADIENTS[index % PLACEHOLDER_GRADIENTS.length];
  const isStorage = curso.imagen_url?.includes('supabase') || curso.imagen_url?.includes('cursos-imagenes');

  return (
    <div className="group bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
      {/* Imagen de portada */}
      <div className={`relative h-44 bg-gradient-to-br ${gradiente} overflow-hidden flex-shrink-0`}>
        {curso.imagen_url && !imgError ? (
          <img
            src={curso.imagen_url}
            alt={curso.titulo}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)}
          />
        ) : (
          /* Placeholder elegante con icono y título sintetizado */
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <p className="text-white/70 text-xs font-medium text-center line-clamp-2 max-w-[160px]">
              {imgError ? 'Imagen no disponible' : 'Sin imagen de portada'}
            </p>
          </div>
        )}

        {/* Badge de estado */}
        <div className="absolute top-3 right-3">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize shadow-sm ${estadoColor[curso.estado] || estadoColor.borrador}`}>
            {curso.estado}
          </span>
        </div>

        {/* Badge de categoría */}
        {curso.categorias_cursos?.nombre && (
          <div className="absolute bottom-3 left-3">
            <span className="text-xs bg-black/40 backdrop-blur-sm text-white px-2.5 py-1 rounded-full">
              {curso.categorias_cursos.nombre}
            </span>
          </div>
        )}

        {/* Indicador: imagen guardada en Storage */}
        {isStorage && !imgError && (
          <div className="absolute bottom-3 right-3">
            <span className="flex items-center gap-1 text-[10px] bg-black/40 backdrop-blur-sm text-white px-2 py-0.5 rounded-full">
              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              Storage
            </span>
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-slate-800 dark:text-white text-base leading-snug mb-1 line-clamp-2">
          {curso.titulo}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2 flex-1">
          {curso.descripcion || 'Sin descripción disponible.'}
        </p>

        {/* Docente */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-700 dark:text-primary-400 text-xs font-bold flex-shrink-0">
            {docentes.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{docentes}</span>
        </div>

        {/* Fechas */}
        {(curso.fecha_inicio || curso.fecha_fin) && (
          <div className="text-xs text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {curso.fecha_inicio} {curso.fecha_fin ? `→ ${curso.fecha_fin}` : ''}
          </div>
        )}

        {/* Acciones */}
        <div className="flex gap-2 mt-auto">
          <Link
            to={`/cursos/${curso.id}`}
            className="flex-1 text-center px-4 py-2 text-sm font-semibold bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            Ver curso
          </Link>
          {showActions && (
            <>
              <button
                onClick={() => onEdit(curso)}
                className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                title="Editar"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => onDelete(curso.id)}
                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Eliminar"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente principal CourseList
const CourseList = ({
  cursos = [],
  loading = false,
  showActions = false,
  onEdit,
  onDelete,
  emptyMessage = 'No hay cursos disponibles.',
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => <CourseCardSkeleton key={i} />)}
      </div>
    );
  }

  if (!cursos || cursos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-6xl mb-4">📚</div>
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">Sin cursos</h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {cursos.map((curso, i) => (
        <CourseCard
          key={curso.id}
          curso={curso}
          index={i}
          showActions={showActions}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default CourseList;
