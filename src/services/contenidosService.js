import { supabase } from './supabase';

// Extraer estructura completa del curso: Módulos + Materiales ordenados
export const getEstructuraCurso = async (cursoId) => {
  const { data, error } = await supabase
    .from('modulos')
    .select(`
      *,
      materiales (*)
    `)
    .eq('curso_id', cursoId)
    .neq('estado', 'eliminado')
    .order('orden', { ascending: true })
    .order('orden', { foreignTable: 'materiales', ascending: true });

  return { data, error };
};

// Obtener datos del curso (encabezado)
export const getCursoById = async (cursoId) => {
  const { data, error } = await supabase
    .from('cursos')
    .select(`
      *,
      categorias_cursos (nombre),
      curso_docentes (
        perfiles_usuarios!curso_docentes_docente_id_fkey (id, nombre_completo, avatar_url)
      )
    `)
    .eq('id', cursoId)
    .single();
  return { data, error };
};

// Crear módulo
export const createModulo = async (moduloData) => {
  const { data, error } = await supabase
    .from('modulos')
    .insert([{
      curso_id: moduloData.curso_id,
      titulo: moduloData.titulo?.trim(),
      descripcion: moduloData.descripcion || null,
      orden: moduloData.orden,
      estado: 'activo',
    }])
    .select()
    .single();
  return { data, error };
};

// Actualizar módulo
export const updateModulo = async (id, data) => {
  const result = await supabase
    .from('modulos')
    .update({
      titulo: data.titulo?.trim(),
      descripcion: data.descripcion || null,
      orden: data.orden,
    })
    .eq('id', id)
    .select()
    .single();
  return result;
};

// Eliminar módulo (la BD hace cascada en materiales)
export const deleteModulo = async (moduloId) => {
  const { data, error } = await supabase
    .from('modulos')
    .delete()
    .eq('id', moduloId);
  return { data, error };
};

// Crear material dentro de un módulo
export const createMaterial = async (materialData) => {
  const { data, error } = await supabase
    .from('materiales')
    .insert([{
      modulo_id: materialData.modulo_id,
      titulo: materialData.titulo?.trim(),
      descripcion: materialData.descripcion || null,
      tipo_material: materialData.tipo_material,
      url_contenido: materialData.url_contenido || null,
      ruta_archivo: materialData.ruta_archivo || null,
      orden: materialData.orden,
      publicado_por: materialData.publicado_por,
      estado: 'activo',
    }])
    .select()
    .single();
  return { data, error };
};

// Actualizar material
export const updateMaterial = async (id, data) => {
  const result = await supabase
    .from('materiales')
    .update({
      titulo: data.titulo?.trim(),
      descripcion: data.descripcion || null,
      tipo_material: data.tipo_material,
      url_contenido: data.url_contenido || null,
      orden: data.orden,
    })
    .eq('id', id)
    .select()
    .single();
  return result;
};

// Eliminar material
export const deleteMaterial = async (materialId) => {
  const { data, error } = await supabase
    .from('materiales')
    .delete()
    .eq('id', materialId);
  return { data, error };
};
