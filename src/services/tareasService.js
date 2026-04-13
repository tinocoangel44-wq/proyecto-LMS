import { supabase } from './supabase';

// Docente/Admin: Crear una nueva tarea para un curso
export const createTarea = async (tareaData) => {
  const { data, error } = await supabase
    .from('tareas')
    .insert([tareaData])
    .select()
    .single();
  return { data, error };
};

// Global: Obtener listado de tareas asignadas para un curso específico
export const getTareasPorCurso = async (cursoId) => {
  const { data, error } = await supabase
    .from('tareas')
    .select('*')
    .eq('curso_id', cursoId)
    .order('fecha_limite', { ascending: true });
  return { data, error };
};

// Estudiante: Enviar una entrega de actividad
export const enviarEntrega = async (entregaData) => {
  const { data, error } = await supabase
    .from('entregas_tareas')
    .insert([{...entregaData, fecha_entrega: new Date().toISOString()}])
    .select()
    .single();
  return { data, error };
};

// Estudiante: Obtener histórico de las entregas que ya completó en ese curso
export const getMisEntregas = async (estudianteId, cursoId) => {
  // Aquí usamos un JOIN inverso partiendo de entregas -> tareas, donde la tarea pertenezca al curso
  const { data, error } = await supabase
    .from('entregas_tareas')
    .select(`
      *,
      tareas!inner(curso_id, titulo)
    `)
    .eq('estudiante_id', estudianteId)
    .eq('tareas.curso_id', cursoId);
  return { data, error };
};
