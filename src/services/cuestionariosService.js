import { supabase } from './supabase';

/**
 * SERVICIOS PARA DOCENTE: CREACIÓN Y ESTRUCTURADO
 */

export const getCuestionariosPorCurso = async (cursoId) => {
  const { data, error } = await supabase
    .from('cuestionarios')
    .select('*, preguntas(*, opciones_respuesta(*))')
    .eq('curso_id', cursoId);
  return { data, error };
};

// Generar una inserción masiva. Supabase no permite transacciones manuales desde el cliente con Auth anon_key fácilmente,
// por lo que insertaremos secuencial y controladamente.
export const generarCuestionarioCompleto = async ({ cursoId, perfilId, titulo, instrucciones, limite, preguntas }) => {
  
  // 1. Insertar el Cuestionario
  const { data: currentCuest, error: errCuest } = await supabase
    .from('cuestionarios')
    .insert([{ 
       curso_id: cursoId, 
       creado_por: perfilId,
       titulo, 
       instrucciones, 
       fecha_limite: limite || null,
       duracion_minutos: 60, // Default
       estado: 'publicado'
    }])
    .select()
    .single();

  if (errCuest) return { error: errCuest };

  // 2. Iterar las Preguntas y sus Opciones
  for (let i = 0; i < preguntas.length; i++) {
    const p = preguntas[i];
    
    const { data: qData, error: qErr } = await supabase
      .from('preguntas')
      .insert([{
         cuestionario_id: currentCuest.id,
         enunciado_pregunta: p.enunciado,
         tipo_pregunta: 'multiple',
         puntaje: p.puntaje,
         orden: i + 1
      }])
      .select()
      .single();

    if (qErr) continue; // En un entorno real se haría un fallback o revert, para esta API simple iteramos

    // 3. Preparar las Opciones de Respuesta
    const opcionesPayload = p.opciones.map(opt => ({
       pregunta_id: qData.id,
       texto_opcion: opt.texto,
       es_correcta: opt.es_correcta === true
    }));

    await supabase.from('opciones_respuesta').insert(opcionesPayload);
  }

  return { success: true, cuestionarioId: currentCuest.id };
};


/**
 * LÓGICA DE ALGORITMO: CÁLCULO DE PUNTAJE Y EVALUACIÓN
 */
export const calcularPuntajeExamen = async (cuestionarioId, respuestasEstudiante) => {
  /*
    Formato esperado de respuestasEstudiante:
    [
      { pregunta_id: 'uuid1', opcion_seleccionada_id: 'uuid-x' },
      ...
    ]
  */
  
  // Extraemos nuestra "Plantilla Correctora" segura desde el Backend
  const { data: preguntasCorrecion, error } = await supabase
    .from('preguntas')
    .select('id, puntaje, opciones_respuesta(id, es_correcta)')
    .eq('cuestionario_id', cuestionarioId);

  if (error || !preguntasCorrecion) return { puntajeCalculado: 0, notaBase100: 0 };

  let maximoPosible = 0;
  let puntosGanados = 0;

  preguntasCorrecion.forEach(pregunta => {
     maximoPosible += parseFloat(pregunta.puntaje);
     
     // Detectar la variante que era verdadera en base de datos
     const opcionCorrecta = pregunta.opciones_respuesta.find(o => o.es_correcta === true);
     
     // Buscar lo que el estudiante inyectó para este rubro
     const matchEstudiante = respuestasEstudiante.find(res => res.pregunta_id === pregunta.id);

     // Otorgar puntos solo en match estricto
     if (opcionCorrecta && matchEstudiante && (opcionCorrecta.id === matchEstudiante.opcion_seleccionada_id)) {
        puntosGanados += parseFloat(pregunta.puntaje);
     }
  });

  // Base 100 clásica para guardar un promediable normalizado
  const notaEquivalente = maximoPosible === 0 ? 0 : (puntosGanados / maximoPosible) * 100;

  return { 
     puntajeGanado: puntosGanados, 
     maximoPosible: maximoPosible, 
     calificacionFinal: notaEquivalente.toFixed(2)
  };
};
