import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getCategorias, checkCursoExiste } from '../services/cursosService';
import Button from './ui/Button';
import Input from './ui/Input';
import Alert from './ui/Alert';

/* ─── Constantes ─────────────────────────────────────────────────────────────── */
const ESTADOS = [
  { value: 'publicado', label: 'Publicado',  color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500' },
  { value: 'borrador',  label: 'Borrador',   color: 'text-amber-600',   bg: 'bg-amber-50  dark:bg-amber-900/20  border-amber-500'  },
  { value: 'archivado', label: 'Archivado',  color: 'text-slate-500',   bg: 'bg-slate-50  dark:bg-slate-900/20  border-slate-500'  },
];

const MAX_SIZE_MB  = 5;
const MAX_SIZE_B   = MAX_SIZE_MB * 1024 * 1024;

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];


const INITIAL_FORM = {
  titulo:       '',
  descripcion:  '',
  categoria_id: '',
  imagen_url:   '',
  fecha_inicio: '',
  fecha_fin:    '',
  estado:       'publicado',
};

/* ─── Íconos inline ──────────────────────────────────────────────────────────── */
const IcUpload = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);
const IcLink = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);
const IcImage = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
const IcTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const IcCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

/* ─── Sub-componente: Image Picker ───────────────────────────────────────────── */
/**
 * Maneja la selección de imagen por archivo o URL.
 * Lógica de prioridad: archivo > URL > ninguno
 * Emite hacia arriba: { imageFile: File|null, imagen_url: string }
 */
const ImagePicker = ({ initialUrl = '', disabled = false, onChange }) => {
  const [mode,        setMode]        = useState('url');      // 'file' | 'url'
  const [imageFile,   setImageFile]   = useState(null);       // File object
  const [urlInput,    setUrlInput]    = useState(initialUrl); // URL escrita
  const [previewSrc,  setPreviewSrc]  = useState(initialUrl); // src real para <img>
  const [fileError,   setFileError]   = useState('');
  const [dragging,    setDragging]    = useState(false);
  const fileRef = useRef();

  // Sincronizar cuando el padre proporciona initialUrl (modo edición)
  useEffect(() => {
    setUrlInput(initialUrl);
    setPreviewSrc(initialUrl);
  }, [initialUrl]);

  // Emitir cambios hacia el componente padre
  const emit = useCallback((file, url) => {
    onChange?.({ imageFile: file, imagen_url: url });
  }, [onChange]);

  /* —— Procesar archivo seleccionado —— */
  const processFile = (file) => {
    setFileError('');
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileError(`Tipo no permitido. Usa: JPG, PNG, WebP, GIF o SVG.`);
      return;
    }
    if (file.size > MAX_SIZE_B) {
      setFileError(`El archivo supera ${MAX_SIZE_MB} MB. Elige una imagen más pequeña.`);
      return;
    }

    setImageFile(file);
    // Preview local inmediato (sin subir aún — la subida ocurre al guardar el curso)
    const localUrl = URL.createObjectURL(file);
    setPreviewSrc(localUrl);
    emit(file, '');        // archivo tiene prioridad; URL queda vacía
  };

  const handleFileChange = (e) => processFile(e.target.files?.[0]);

  /* —— Drag & Drop —— */
  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    processFile(e.dataTransfer.files?.[0]);
  };

  /* —— URL manual —— */
  const handleUrlChange = (e) => {
    const val = e.target.value;
    setUrlInput(val);
    setPreviewSrc(val);
    setImageFile(null);    // limpiar archivo si el usuario escribe URL
    emit(null, val);
  };

  /* —— Limpiar imagen —— */
  const clearImage = () => {
    setImageFile(null);
    setUrlInput('');
    setPreviewSrc('');
    setFileError('');
    if (fileRef.current) fileRef.current.value = '';
    emit(null, '');
  };

  const hasImage = !!previewSrc;

  return (
    <div className="flex flex-col gap-3">
      {/* Selector de modo */}
      <div className="flex gap-1 bg-slate-100 dark:bg-dark-surface rounded-xl p-1">
        {[
          { key: 'file', label: 'Subir archivo', Icon: IcUpload },
          { key: 'url',  label: 'URL de imagen', Icon: IcLink   },
        ].map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => { setMode(key); setFileError(''); }}
            disabled={disabled}
            className={[
              'flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all duration-200',
              mode === key
                ? 'bg-white dark:bg-dark-card text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300',
            ].join(' ')}
          >
            <Icon /> {label}
          </button>
        ))}
      </div>

      {/* ── Modo ARCHIVO ── */}
      {mode === 'file' && (
        <div>
          <div
            onClick={() => !disabled && fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={[
              'relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 py-6',
              dragging
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10 scale-[1.01]'
                : 'border-slate-300 dark:border-dark-border hover:border-primary-400 hover:bg-slate-50 dark:hover:bg-dark-surface',
              disabled ? 'opacity-50 cursor-not-allowed' : '',
            ].join(' ')}
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
              <IcUpload />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {imageFile ? imageFile.name : 'Haz clic o arrastra una imagen'}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                JPG, PNG, WebP, GIF, SVG · Máx. {MAX_SIZE_MB} MB
              </p>
            </div>
            {imageFile && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full">
                <IcCheck /> Archivo listo para guardar
              </span>
            )}
            <input
              ref={fileRef}
              type="file"
              accept={ALLOWED_TYPES.join(',')}
              onChange={handleFileChange}
              disabled={disabled}
              className="hidden"
            />
          </div>
          {fileError && (
            <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {fileError}
            </p>
          )}
        </div>
      )}

      {/* ── Modo URL ── */}
      {mode === 'url' && (
        <Input
          label="URL de portada"
          id="imagen_url_input"
          type="url"
          value={urlInput}
          onChange={handleUrlChange}
          placeholder="https://images.unsplash.com/..."
          disabled={disabled}
          leftIcon={<IcImage />}
          hint="Pega el enlace directo a una imagen pública (HTTPS)"
        />
      )}

      {/* ── Preview de imagen ── */}
      {hasImage && (
        <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-dark-border">
          <img
            src={previewSrc}
            alt="Preview de portada"
            className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => {
              setPreviewSrc('');
              if (mode === 'url') setFileError('No se pudo cargar la imagen. Verifica la URL.');
            }}
          />
          {/* Overlay con botón de limpiar */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={clearImage}
              disabled={disabled}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg shadow-lg transition-all"
            >
              <IcTrash /> Quitar imagen
            </button>
          </div>
          {/* Badge de origen */}
          <span className={[
            'absolute top-2 left-2 flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full shadow',
            imageFile
              ? 'bg-emerald-600 text-white'
              : 'bg-blue-600 text-white'
          ].join(' ')}>
            {imageFile ? <><IcCheck /> Archivo local</> : <><IcLink /> URL</>}
          </span>
        </div>
      )}

      {/* Indicador de prioridad */}
      {!hasImage && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-dark-border">
          <IcImage />
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Sin imagen · Se mostrará un placeholder en la card del curso
          </p>
        </div>
      )}
    </div>
  );
};

/* ─── Componente principal: CreateCourse ─────────────────────────────────────── */
const CreateCourse = ({ onSubmit, initialData = null, isLoading = false }) => {
  const [formData,   setFormData]   = useState(INITIAL_FORM);
  const [imageState, setImageState] = useState({ imageFile: null, imagen_url: '' });
  const [categorias, setCategorias] = useState([]);
  const [error,      setError]      = useState(null);
  const [validating, setValidating] = useState(false);
  const isEditing = !!initialData?.id;

  /* —— Cargar categorías —— */
  useEffect(() => {
    getCategorias().then(({ data }) => { if (data) setCategorias(data); });
  }, []);

  /* —— Prellenar en modo edición —— */
  useEffect(() => {
    if (initialData) {
      setFormData({
        titulo:       initialData.titulo       || '',
        descripcion:  initialData.descripcion  || '',
        categoria_id: initialData.categoria_id || '',
        imagen_url:   initialData.imagen_url   || '',
        fecha_inicio: initialData.fecha_inicio || '',
        fecha_fin:    initialData.fecha_fin    || '',
        estado:       initialData.estado       || 'publicado',
      });
      setImageState({ imageFile: null, imagen_url: initialData.imagen_url || '' });
    } else {
      setFormData(INITIAL_FORM);
      setImageState({ imageFile: null, imagen_url: '' });
    }
    setError(null);
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'titulo') setError(null);
  };

  /* —— Recibir cambios del ImagePicker —— */
  const handleImageChange = useCallback(({ imageFile, imagen_url }) => {
    setImageState({ imageFile, imagen_url });
  }, []);

  /* —— Validación y envío —— */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validaciones de formulario
    if (!formData.titulo.trim()) {
      setError('El título del curso es obligatorio.'); return;
    }
    if (formData.titulo.trim().length < 5) {
      setError('El título debe tener al menos 5 caracteres.'); return;
    }
    if (!formData.categoria_id) {
      setError('Selecciona una categoría para el curso.'); return;
    }
    if (formData.fecha_inicio && formData.fecha_fin && formData.fecha_inicio > formData.fecha_fin) {
      setError('La fecha de inicio no puede ser posterior a la fecha de fin.'); return;
    }

    // Validar imagen: archivo o URL (al menos uno es opcional — la validación es informativa)
    const hasFile = !!imageState.imageFile;
    const hasUrl  = !!imageState.imagen_url?.trim();

    // Verificar duplicado por título
    setValidating(true);
    try {
      const { existe } = await checkCursoExiste(formData.titulo, initialData?.id);
      if (existe) {
        setError(`Ya existe un curso con el título "${formData.titulo}". Elige un título diferente.`);
        setValidating(false);
        return;
      }
    } catch { /* continuar */ }
    setValidating(false);

    // Construir payload que incluye el archivo si existe
    // La función createCurso / updateCurso en cursosService se encarga del upload
    const payload = {
      ...formData,
      // Prioridad: archivo > URL
      imageFile:  imageState.imageFile  || null,
      imagen_url: hasFile ? '' : (hasUrl ? imageState.imagen_url.trim() : null),
    };

    onSubmit(payload);
  };

  const isSubmitting = isLoading || validating;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      {/* Error general */}
      {error && <Alert type="error">{error}</Alert>}

      {/* ── Título ── */}
      <Input
        label="Título del curso"
        name="titulo"
        value={formData.titulo}
        onChange={handleChange}
        placeholder="Ej: Introducción a la Programación Web"
        required
        disabled={isSubmitting}
      />

      {/* ── Descripción ── */}
      <div className="flex flex-col gap-1.5">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
          Descripción
        </label>
        <textarea
          name="descripcion"
          value={formData.descripcion}
          onChange={handleChange}
          placeholder="Describe brevemente los objetivos, contenido y a quién va dirigido el curso…"
          rows={4}
          disabled={isSubmitting}
          className="lms-input resize-none"
        />
      </div>

      {/* ── Categoría ── */}
      <div className="flex flex-col gap-1.5">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
          Categoría <span className="text-red-500 ml-0.5">*</span>
        </label>
        <select
          name="categoria_id"
          value={formData.categoria_id}
          onChange={handleChange}
          required
          disabled={isSubmitting}
          className="lms-input"
        >
          <option value="">— Selecciona una categoría —</option>
          {categorias.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
          ))}
        </select>
      </div>

      {/* ── Imagen de portada ── */}
      <div className="flex flex-col gap-2">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
          Imagen de portada
          <span className="ml-1.5 text-xs font-normal text-slate-400 dark:text-slate-500">(opcional)</span>
        </label>

        {/* Indicador de prioridad cuando hay ambos */}
        {imageState.imageFile && imageState.imagen_url && (
          <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Se usará el <strong className="mx-0.5">archivo subido</strong> (tiene prioridad sobre la URL).
          </div>
        )}

        <ImagePicker
          initialUrl={initialData?.imagen_url || ''}
          disabled={isSubmitting}
          onChange={handleImageChange}
        />
      </div>

      {/* ── Fechas ── */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Fecha de inicio"
          name="fecha_inicio"
          type="date"
          value={formData.fecha_inicio}
          onChange={handleChange}
          disabled={isSubmitting}
        />
        <Input
          label="Fecha de fin"
          name="fecha_fin"
          type="date"
          value={formData.fecha_fin}
          onChange={handleChange}
          disabled={isSubmitting}
        />
      </div>

      {/* ── Estado del curso ── */}
      <div className="flex flex-col gap-2">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
          Estado del curso
        </label>
        <div className="flex gap-2">
          {ESTADOS.map(estado => (
            <button
              key={estado.value}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, estado: estado.value }))}
              disabled={isSubmitting}
              className={[
                'flex-1 py-2 px-3 rounded-xl text-sm font-semibold border-2 transition-all duration-150',
                formData.estado === estado.value
                  ? `${estado.bg} ${estado.color}`
                  : 'border-slate-200 dark:border-dark-border text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-600',
              ].join(' ')}
            >
              {estado.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Botón submit ── */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isSubmitting}
        disabled={isSubmitting}
        className="mt-1 w-full"
        leftIcon={!isSubmitting ? (
          isEditing
            ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
        ) : null}
      >
        {isEditing ? 'Guardar cambios' : 'Crear curso'}
      </Button>
    </form>
  );
};

export default CreateCourse;
