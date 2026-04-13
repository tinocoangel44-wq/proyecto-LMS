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
        fecha_fin
      )
    `)
    .eq('estudiante_id', estudianteId)
    .eq('estado', 'activo')
    .order('fecha_inscripcion', { ascending: false });
    
  return { data, error };
};
