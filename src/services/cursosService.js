import { supabase } from './supabase';

// Obtener todas las categorías activas
export const getCategorias = async () => {
  const { data, error } = await supabase
    .from('categorias_cursos')
    .select('*')
    .eq('estado', 'activo')
    .order('nombre');
  return { data, error };
};

// Obtener todos los cursos (con categoría, docentes relacionados y creador)
export const getCursos = async () => {
  const { data, error } = await supabase
    .from('cursos')
    .select(`
      *,
      categorias_cursos (id, nombre),
      curso_docentes (
        perfiles_usuarios (id, nombre_completo)
      )
    `)
    .neq('estado', 'eliminado')
    .order('created_at', { ascending: false });
  return { data, error };
};

// Obtener cursos publicados (catálogo público para estudiantes)
export const getCursosPublicados = async () => {
  const { data, error } = await supabase
    .from('cursos')
    .select(`
      *,
      categorias_cursos (id, nombre),
      curso_docentes (
        perfiles_usuarios (id, nombre_completo)
      )
    `)
    .eq('estado', 'publicado')
    .order('created_at', { ascending: false });
  return { data, error };
};

// Verificar si ya existe un curso con el mismo título (evitar duplicados)
export const checkCursoExiste = async (titulo, excludeId = null) => {
  let query = supabase
    .from('cursos')
    .select('id')
    .ilike('titulo', titulo.trim())
    .neq('estado', 'eliminado');

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data, error } = await query;
  return { existe: data && data.length > 0, error };
};

// Crear un nuevo curso y asignar docente en curso_docentes
export const createCurso = async (cursoData, docentePerfilId = null) => {
  const payload = {
    titulo: cursoData.titulo.trim(),
    descripcion: cursoData.descripcion || null,
    categoria_id: cursoData.categoria_id || null,
    imagen_url: cursoData.imagen_url || null,
    fecha_inicio: cursoData.fecha_inicio || null,
    fecha_fin: cursoData.fecha_fin || null,
    estado: cursoData.estado || 'publicado',
    creado_por: cursoData.creado_por,
  };

  const { data, error } = await supabase
    .from('cursos')
    .insert([payload])
    .select()
    .single();

  if (error) return { data: null, error };

  // Asignar el docente a curso_docentes automáticamente si se provee
  if (docentePerfilId && data?.id) {
    await supabase.from('curso_docentes').insert([{
      curso_id: data.id,
      docente_id: docentePerfilId,
    }]);
  }

  return { data, error: null };
};

// Editar curso existente
export const updateCurso = async (id, cursoData) => {
  const { data, error } = await supabase
    .from('cursos')
    .update({
      titulo: cursoData.titulo?.trim(),
      descripcion: cursoData.descripcion,
      categoria_id: cursoData.categoria_id || null,
      imagen_url: cursoData.imagen_url || null,
      fecha_inicio: cursoData.fecha_inicio || null,
      fecha_fin: cursoData.fecha_fin || null,
      estado: cursoData.estado || 'publicado',
    })
    .eq('id', id)
    .select()
    .single();
  return { data, error };
};

// Baja lógica de un curso
export const deleteCurso = async (id) => {
  const { data, error } = await supabase
    .from('cursos')
    .update({ estado: 'eliminado' })
    .eq('id', id);
  return { data, error };
};
