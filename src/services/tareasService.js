import { supabase } from './supabase';

// ── TAREAS ─────────────────────────────────────────────────────────────────

// Obtener tareas de un curso con conteo de entregas
export const getTareasPorCurso = async (cursoId) => {
  const { data, error } = await supabase
    .from('tareas')
    .select(`
      *,
      entregas_tareas (id, estado)
    `)
    .eq('curso_id', cursoId)
    .neq('estado', 'eliminada')
    .order('fecha_limite', { ascending: true, nullsFirst: false });
  return { data, error };
};

// Crear tarea
export const createTarea = async (tareaData) => {
  const { data, error } = await supabase
    .from('tareas')
    .insert([{
      curso_id: tareaData.curso_id,
      creado_por: tareaData.creado_por,
      modulo_id: tareaData.modulo_id || null,
      titulo: tareaData.titulo?.trim(),
      instrucciones: tareaData.instrucciones || null,
      fecha_limite: tareaData.fecha_limite || null,
      ponderacion: tareaData.ponderacion || 100,
      archivo_url: tareaData.archivo_url || null,
      estado: 'publicada',
    }])
    .select()
    .single();
  return { data, error };
};

// Actualizar tarea
export const updateTarea = async (id, data) => {
  const result = await supabase
    .from('tareas')
    .update({
      titulo: data.titulo?.trim(),
      instrucciones: data.instrucciones,
      fecha_limite: data.fecha_limite || null,
      ponderacion: data.ponderacion,
    })
    .eq('id', id)
    .select()
    .single();
  return result;
};

// Eliminar tarea (soft delete)
export const deleteTarea = async (id) => {
  const { data, error } = await supabase
    .from('tareas')
    .update({ estado: 'eliminada' })
    .eq('id', id);
  return { data, error };
};

// ── ENTREGAS ───────────────────────────────────────────────────────────────

// Subir archivo de entrega (estudiante) a Storage
export const uploadTareaFile = async (file, estudianteId) => {
  try {
    const ext = file.name.split('.').pop().toLowerCase();
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;
    const filePath = `entregas/${estudianteId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('tareas')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('tareas')
      .getPublicUrl(filePath);

    return { url: data.publicUrl, error: null };
  } catch (error) {
    console.error('Error subiendo archivo:', error);
    return { url: null, error };
  }
};

// Subir archivo adjunto del docente a Storage
export const uploadArchivoDocente = async (file, docenteId) => {
  try {
    const ext = file.name.split('.').pop().toLowerCase();
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;
    const filePath = `instrucciones/${docenteId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('tareas')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('tareas')
      .getPublicUrl(filePath);

    return { url: data.publicUrl, error: null };
  } catch (error) {
    console.error('Error subiendo archivo del docente:', error);
    return { url: null, error };
  }
};

// Enviar entrega de estudiante
export const enviarEntrega = async (entregaData) => {
  let archivoUrl = null;

  if (entregaData.archivoFile) {
    const { url, error: uploadErr } = await uploadTareaFile(entregaData.archivoFile, entregaData.estudiante_id);
    if (uploadErr) return { data: null, error: new Error('Error subiendo archivo: ' + uploadErr.message) };
    archivoUrl = url;
  }

  const { data, error } = await supabase
    .from('entregas_tareas')
    .insert([{
      tarea_id: entregaData.tarea_id,
      estudiante_id: entregaData.estudiante_id,
      texto_entrega: entregaData.texto_entrega || null,
      enlace_entrega: entregaData.enlace_entrega || null,
      archivo_url: archivoUrl,
      fecha_entrega: new Date().toISOString(),
      estado: 'entregada',
    }])
    .select()
    .single();
  return { data, error };
};

// Obtener entregas del estudiante en un curso
export const getMisEntregas = async (estudianteId, cursoId) => {
  const { data, error } = await supabase
    .from('entregas_tareas')
    .select(`
      *,
      tareas!inner (curso_id, titulo),
      calificaciones (calificacion, retroalimentacion, fecha_calificacion)
    `)
    .eq('estudiante_id', estudianteId)
    .eq('tareas.curso_id', cursoId);
  return { data, error };
};

// ── CALIFICACIONES ─────────────────────────────────────────────────────────

// Obtener todas las entregas de una tarea (para docente)
export const getEntregasDeTarea = async (tareaId) => {
  const { data, error } = await supabase
    .from('entregas_tareas')
    .select(`
      *,
      perfiles_usuarios (id, nombre_completo, avatar_url),
      calificaciones (id, calificacion, retroalimentacion, fecha_calificacion)
    `)
    .eq('tarea_id', tareaId)
    .order('fecha_entrega', { ascending: true });
  return { data, error };
};

// Asentar o actualizar calificación
export const asentarCalificacion = async ({
  estudianteId, docenteId, tipoOrigen, origenId, calificacion, retroalimentacion
}) => {
  const payload = {
    estudiante_id: estudianteId,
    docente_id: docenteId,
    tipo_origen: tipoOrigen,
    calificacion: parseFloat(calificacion),
    retroalimentacion: retroalimentacion || null,
    entrega_id: tipoOrigen === 'tarea' ? origenId : null,
    intento_id: tipoOrigen === 'cuestionario' ? origenId : null,
  };

  const { data, error } = await supabase
    .from('calificaciones')
    .insert([payload])
    .select()
    .single();

  // Marcar entrega como calificada
  if (!error && tipoOrigen === 'tarea') {
    await supabase
      .from('entregas_tareas')
      .update({ estado: 'calificada' })
      .eq('id', origenId);
  }

  return { data, error };
};

// Obtener tarea por ID (para mostrar título en EvaluadorDocente)
export const getTareaById = async (tareaId) => {
  const { data, error } = await supabase
    .from('tareas')
    .select(`*, cursos(titulo)`)
    .eq('id', tareaId)
    .single();
  return { data, error };
};
