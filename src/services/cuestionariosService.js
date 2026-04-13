import { supabase } from './supabase';

// ── LECTURA ────────────────────────────────────────────────────────────────

// Obtener cuestionarios de un curso con preguntas y opciones + intentos del usuario
export const getCuestionariosPorCurso = async (cursoId) => {
  const { data, error } = await supabase
    .from('cuestionarios')
    .select(`
      *,
      preguntas (
        id, enunciado, puntaje, orden,
        opciones_respuesta (id, texto_opcion, orden)
      )
    `)
    .eq('curso_id', cursoId)
    .neq('estado', 'eliminado')
    .order('created_at', { ascending: true });

  // Ordenar preguntas y opciones localmente
  if (data) {
    data.forEach(c => {
      c.preguntas?.sort((a, b) => a.orden - b.orden);
      c.preguntas?.forEach(p => p.opciones_respuesta?.sort((a, b) => a.orden - b.orden));
    });
  }

  return { data, error };
};

// Verificar si el estudiante ya completó un cuestionario
export const getMiIntentoCuestionario = async (cuestionarioId, estudianteId) => {
  const { data, error } = await supabase
    .from('intentos_cuestionario')
    .select('*, respuestas_intento(*)')
    .eq('cuestionario_id', cuestionarioId)
    .eq('estudiante_id', estudianteId)
    .eq('estado', 'completado')
    .maybeSingle();
  return { data, error };
};

// ── CREACIÓN (DOCENTE) ─────────────────────────────────────────────────────

export const generarCuestionarioCompleto = async ({
  cursoId, perfilId, titulo, descripcion, tiempoMinutos, preguntas
}) => {
  // 1. Crear cuestionario
  const { data: cuest, error: errCuest } = await supabase
    .from('cuestionarios')
    .insert([{
      curso_id: cursoId,
      creado_por: perfilId,
      titulo: titulo?.trim(),
      descripcion: descripcion || null,
      tiempo_limite_minutos: tiempoMinutos || null,
      estado: 'publicado',
    }])
    .select()
    .single();

  if (errCuest) return { error: errCuest };

  // 2. Crear preguntas con sus opciones
  for (let i = 0; i < preguntas.length; i++) {
    const p = preguntas[i];

    const { data: qData, error: qErr } = await supabase
      .from('preguntas')
      .insert([{
        cuestionario_id: cuest.id,
        enunciado: p.enunciado?.trim(),
        tipo_pregunta: 'opcion_multiple',
        puntaje: parseFloat(p.puntaje) || 10,
        orden: i + 1,
      }])
      .select()
      .single();

    if (qErr) continue;

    const opcionesPayload = p.opciones.map((opt, oIdx) => ({
      pregunta_id: qData.id,
      texto_opcion: opt.texto?.trim(),
      es_correcta: opt.es_correcta === true,
      orden: oIdx + 1,
    }));

    await supabase.from('opciones_respuesta').insert(opcionesPayload);
  }

  return { success: true, cuestionarioId: cuest.id };
};

// ── EXAMEN ESTUDIANTIL: EVALUACIÓN Y PERSISTENCIA ─────────────────────────

export const calcularYGuardarExamen = async ({
  cuestionarioId, estudianteId, respuestasEstudiante
}) => {
  // 1. Obtener plantilla correctora con is_correcta
  const { data: preguntas, error } = await supabase
    .from('preguntas')
    .select('id, puntaje, opciones_respuesta(id, es_correcta)')
    .eq('cuestionario_id', cuestionarioId);

  if (error || !preguntas) return { error: error || 'No se encontraron preguntas.' };

  // 2. Calcular puntaje
  let maximoPosible = 0;
  let puntosGanados = 0;
  const resumenPorPregunta = [];

  preguntas.forEach(pregunta => {
    maximoPosible += parseFloat(pregunta.puntaje);
    const opcionCorrecta = pregunta.opciones_respuesta.find(o => o.es_correcta);
    const respuestaEstudiante = respuestasEstudiante.find(r => r.pregunta_id === pregunta.id);
    const esCorrecta = opcionCorrecta && respuestaEstudiante &&
      opcionCorrecta.id === respuestaEstudiante.opcion_id;

    if (esCorrecta) puntosGanados += parseFloat(pregunta.puntaje);

    resumenPorPregunta.push({
      pregunta_id: pregunta.id,
      opcion_id: respuestaEstudiante?.opcion_id || null,
      es_correcta: esCorrecta,
      puntaje_obtenido: esCorrecta ? parseFloat(pregunta.puntaje) : 0,
    });
  });

  const notaFinal = maximoPosible === 0 ? 0 : (puntosGanados / maximoPosible) * 100;

  // 3. Crear intento en BD
  const { data: intento, error: errIntento } = await supabase
    .from('intentos_cuestionario')
    .insert([{
      cuestionario_id: cuestionarioId,
      estudiante_id: estudianteId,
      fecha_fin: new Date().toISOString(),
      puntaje_total: parseFloat(notaFinal.toFixed(2)),
      estado: 'completado',
    }])
    .select()
    .single();

  if (errIntento) {
    // Si hay duplicate key (ya intentó), retornar el resultado de todas formas
    return {
      puntosGanados,
      maximoPosible,
      notaFinal: parseFloat(notaFinal.toFixed(2)),
      resumenPorPregunta,
      error: errIntento.code === '23505' ? 'ya_completado' : errIntento,
    };
  }

  // 4. Guardar respuestas individuales
  const respuestasPayload = resumenPorPregunta
    .filter(r => r.opcion_id)
    .map(r => ({
      intento_id: intento.id,
      pregunta_id: r.pregunta_id,
      opcion_id: r.opcion_id,
      es_correcta: r.es_correcta,
      puntaje_obtenido: r.puntaje_obtenido,
    }));

  if (respuestasPayload.length > 0) {
    await supabase.from('respuestas_intento').insert(respuestasPayload);
  }

  // 5. Registrar en calificaciones
  await supabase.from('calificaciones').insert([{
    estudiante_id: estudianteId,
    tipo_origen: 'cuestionario',
    intento_id: intento.id,
    calificacion: parseFloat(notaFinal.toFixed(2)),
  }]);

  return {
    puntosGanados,
    maximoPosible,
    notaFinal: parseFloat(notaFinal.toFixed(2)),
    resumenPorPregunta,
    intentoId: intento.id,
  };
};
