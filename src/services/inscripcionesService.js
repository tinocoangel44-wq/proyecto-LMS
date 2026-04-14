import { supabase } from './supabase';

// Registrar la inscripción de un perfil a un curso específico
export const inscribirCurso = async (cursoId, estudianteId) => {
  const { data, error } = await supabase
    .from('inscripciones')
    .insert([{ curso_id: cursoId, estudiante_id: estudianteId }])
    .select()
    .single();
    
  return { data, error };
};

// Obtener todas las inscripciones y el contexto del curso para un estudiante
export const getCursosInscritos = async (estudianteId) => {
  const { data, error } = await supabase
    .from('inscripciones')
    .select(`
      id,
      fecha_inscripcion,
      estado,
      cursos (
        id,
        titulo,
        descripcion,
        imagen_url,
        fecha_inicio,
        fecha_fin,
        estado,
        categorias_cursos (id, nombre)
      )
    `)
    .eq('estudiante_id', estudianteId)
    .eq('estado', 'activo')
    .order('fecha_inscripcion', { ascending: false });
    
  return { data, error };
};

// Obtener cursos publicados disponibles para inscribirse (catálogo)
export const getCatalogoDisponible = async (estudianteId) => {
  // Obtener todos los cursos publicados
  const { data: cursos, error } = await supabase
    .from('cursos')
    .select(`
      id, titulo, descripcion, imagen_url, fecha_inicio, fecha_fin,
      categorias_cursos (id, nombre)
    `)
    .eq('estado', 'publicado')
    .order('created_at', { ascending: false });

  if (error) return { data: null, error };

  // Obtener IDs a los que ya está inscrito
  const { data: inscritas } = await supabase
    .from('inscripciones')
    .select('curso_id')
    .eq('estudiante_id', estudianteId)
    .eq('estado', 'activo');

  const inscritasIds = new Set((inscritas || []).map(i => i.curso_id));

  // Filtrar los que no está inscrito
  const disponibles = (cursos || []).filter(c => !inscritasIds.has(c.id));

  return { data: disponibles, error: null };
};
