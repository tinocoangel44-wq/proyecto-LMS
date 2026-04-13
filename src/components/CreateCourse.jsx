import React, { useState, useEffect } from 'react';
import { getCategorias, checkCursoExiste } from '../services/cursosService';
import Button from './ui/Button';
import Input from './ui/Input';
import Alert from './ui/Alert';

const ESTADOS = [
  { value: 'publicado', label: 'Publicado', color: 'text-emerald-600' },
  { value: 'borrador', label: 'Borrador', color: 'text-amber-600' },
  { value: 'archivado', label: 'Archivado', color: 'text-slate-500' },
];

const INITIAL_FORM = {
  titulo: '',
  descripcion: '',
  categoria_id: '',
  imagen_url: '',
  fecha_inicio: '',
  fecha_fin: '',
  estado: 'publicado',
};

const CreateCourse = ({ onSubmit, initialData = null, isLoading = false }) => {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [categorias, setCategorias] = useState([]);
  const [error, setError] = useState(null);
  const [validating, setValidating] = useState(false);
  const isEditing = !!initialData?.id;

  // Cargar categorías
  useEffect(() => {
    const loadCats = async () => {
      const { data } = await getCategorias();
      if (data) setCategorias(data);
    };
    loadCats();
  }, []);

  // Rellenar formulario cuando se edita
  useEffect(() => {
    if (initialData) {
      setFormData({
        titulo: initialData.titulo || '',
        descripcion: initialData.descripcion || '',
        categoria_id: initialData.categoria_id || '',
        imagen_url: initialData.imagen_url || '',
        fecha_inicio: initialData.fecha_inicio || '',
        fecha_fin: initialData.fecha_fin || '',
        estado: initialData.estado || 'publicado',
      });
    } else {
      setFormData(INITIAL_FORM);
    }
    setError(null);
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'titulo') setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validaciones básicas
    if (!formData.titulo.trim()) {
      setError('El título del curso es obligatorio.');
      return;
    }
    if (formData.titulo.trim().length < 5) {
      setError('El título debe tener al menos 5 caracteres.');
      return;
    }
    if (formData.fecha_inicio && formData.fecha_fin && formData.fecha_inicio > formData.fecha_fin) {
      setError('La fecha de inicio no puede ser posterior a la fecha de fin.');
      return;
    }

    // Verificar duplicado por título
    setValidating(true);
    try {
      const { existe } = await checkCursoExiste(formData.titulo, initialData?.id);
      if (existe) {
        setError(`Ya existe un curso con el título "${formData.titulo}". Elige un título diferente.`);
        setValidating(false);
        return;
      }
    } catch {
      // Continuar aunque falle la verificación
    }
    setValidating(false);

    onSubmit(formData);
  };

  const isSubmitting = isLoading || validating;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <Alert type="error">{error}</Alert>
      )}

      {/* Título obligatorio */}
      <Input
        label="TÍTULO DEL CURSO *"
        name="titulo"
        value={formData.titulo}
        onChange={handleChange}
        placeholder="Ej. Introducción a la Programación"
        required
        disabled={isSubmitting}
      />

      {/* Descripción */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
          Descripción
        </label>
        <textarea
          name="descripcion"
          value={formData.descripcion}
          onChange={handleChange}
          placeholder="Describe brevemente los objetivos y contenido del curso..."
          rows={4}
          disabled={isSubmitting}
          className="px-4 py-3 bg-white dark:bg-dark-bg border border-slate-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white text-sm resize-none transition-colors disabled:opacity-50"
        />
      </div>

      {/* Categoría */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
          Categoría *
        </label>
        <select
          name="categoria_id"
          value={formData.categoria_id}
          onChange={handleChange}
          required
          disabled={isSubmitting}
          className="px-4 py-3 bg-white dark:bg-dark-bg border border-slate-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white text-sm transition-colors disabled:opacity-50"
        >
          <option value="">— Selecciona una categoría —</option>
          {categorias.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
          ))}
        </select>
      </div>

      {/* URL Imagen */}
      <Input
        label="URL DE IMAGEN DE PORTADA"
        name="imagen_url"
        value={formData.imagen_url}
        onChange={handleChange}
        placeholder="https://images.unsplash.com/..."
        disabled={isSubmitting}
        type="url"
      />

      {/* Preview imagen */}
      {formData.imagen_url && (
        <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-dark-border h-32">
          <img
            src={formData.imagen_url}
            alt="preview"
            className="w-full h-full object-cover"
            onError={(e) => { e.target.parentElement.style.display = 'none'; }}
          />
        </div>
      )}

      {/* Fechas */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="FECHA INICIO"
          name="fecha_inicio"
          type="date"
          value={formData.fecha_inicio}
          onChange={handleChange}
          disabled={isSubmitting}
        />
        <Input
          label="FECHA FIN"
          name="fecha_fin"
          type="date"
          value={formData.fecha_fin}
          onChange={handleChange}
          disabled={isSubmitting}
        />
      </div>

      {/* Estado */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
          Estado del curso
        </label>
        <div className="flex gap-2">
          {ESTADOS.map(estado => (
            <button
              key={estado.value}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, estado: estado.value }))}
              disabled={isSubmitting}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all ${
                formData.estado === estado.value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                  : 'border-slate-200 dark:border-dark-border text-slate-500 hover:border-slate-300'
              }`}
            >
              {estado.label}
            </button>
          ))}
        </div>
      </div>

      {/* Botón submit */}
      <Button
        type="submit"
        variant="primary"
        isLoading={isSubmitting}
        disabled={isSubmitting}
        className="mt-2"
      >
        {isEditing ? '✏️ Guardar Cambios' : '✨ Crear Curso'}
      </Button>
    </form>
  );
};

export default CreateCourse;
