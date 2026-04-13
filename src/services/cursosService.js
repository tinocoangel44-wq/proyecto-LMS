import { supabase } from './supabase';

// Lógica para obtener todas las categorías
export const getCategorias = async () => {
  const { data, error } = await supabase
    .from('categorias_cursos')
    .select('*')
    .eq('estado', 'activo');
  return { data, error };
};

// Obtener todos los cursos, sin los eliminados
export const getCursos = async () => {
  const { data, error } = await supabase
    .from('cursos')
    .select(`
      *,
      categorias_cursos (nombre),
      perfiles_usuarios (nombre_completo)
    `)
    .neq('estado', 'eliminado'); 
  return { data, error };
};

// Crear un nuevo curso
export const createCurso = async (cursoData) => {
  const { data, error } = await supabase
    .from('cursos')
    .insert([cursoData])
    .select()
    .single();
  return { data, error };
};

// Editar curso existente
export const updateCurso = async (id, cursoData) => {
  const { data, error } = await supabase
    .from('cursos')
    .update(cursoData)
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
