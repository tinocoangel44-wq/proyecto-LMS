import { supabase } from './supabase';

// ── Alias de compatibilidad para DashboardInsights ─────────────────────────
export const fetchDashboardData = async (role, perfilId) => {
  const stats = { misCursos: [], pendientes: [], calificaciones: [], mensajesRecientes: [], resumenGlobal: null };
  try {
    if (role === 'administrador') {
      const { data } = await supabase.from('vw_resumen_dashboard').select('*').maybeSingle();
      stats.resumenGlobal = data;
    }
    if (role === 'docente') {
      const { data } = await supabase.from('entregas_tareas')
        .select('id, fecha_entrega, estado, tareas(titulo), perfiles_usuarios(nombre_completo)')
        .eq('estado', 'entregada').limit(5);
      stats.pendientes = data || [];
    }
    if (role === 'estudiante') {
      const { data } = await supabase.from('calificaciones')
        .select('id, calificacion, tipo_origen, fecha_calificacion')
        .eq('estudiante_id', perfilId).order('fecha_calificacion', { ascending: false }).limit(5);
      stats.calificaciones = data || [];
    }
  } catch(e) { console.error(e); }
  return stats;
};

/**

 * Carga todos los datos del dashboard académico del estudiante en una sola función:
 * - Cursos inscritos con módulos y materiales (para progreso)
 * - Calificaciones históricas (tareas + cuestionarios)
 * - Tareas pendientes y entregadas
 * - Intentos de cuestionarios
 */
export const getDashboardEstudiante = async (estudianteId) => {
  // 1. Cursos inscritos con info completa
  const { data: inscripciones } = await supabase
    .from('inscripciones')
    .select(`
      id, fecha_inscripcion, estado,
      cursos (
        id, titulo, descripcion, imagen_url, estado,
        categorias_cursos (nombre),
        modulos (
          id,
          materiales (id)
        ),
        tareas (
          id, titulo, fecha_limite, estado,
          entregas_tareas (id, estado, fecha_entrega)
        ),
        cuestionarios (
          id, titulo,
          intentos_cuestionario (id, puntaje_total, estado)
        )
      )
    `)
    .eq('estudiante_id', estudianteId)
    .eq('estado', 'activo')
    .order('fecha_inscripcion', { ascending: false });

  // 2. Calificaciones históricas del estudiante
  const { data: calificaciones } = await supabase
    .from('calificaciones')
    .select(`
      id, calificacion, retroalimentacion, fecha_calificacion, tipo_origen,
      entregas_tareas (
        id, fecha_entrega,
        tareas (titulo, curso_id, cursos(titulo))
      ),
      intentos_cuestionario (
        id, fecha_fin,
        cuestionarios (titulo, curso_id, cursos(titulo))
      )
    `)
    .eq('estudiante_id', estudianteId)
    .order('fecha_calificacion', { ascending: false })
    .limit(20);




  // Procesar datos
  const cursosData = inscripciones || [];

  // Calcular progreso por curso
  const cursosConProgreso = cursosData.map(insc => {
    const curso = insc.cursos;
    if (!curso) return { ...insc, progreso: 0, stats: {} };

    const tareas = curso.tareas || [];
    const cuestionarios = curso.cuestionarios || [];

    // Tareas entregadas por el estudiante
    const tareasTotal = tareas.filter(t => t.estado !== 'eliminada').length;
    const tareasEntregadas = tareas.reduce((acc, t) => {
      const entrega = (t.entregas_tareas || []).find(e =>
        e.estado === 'entregada' || e.estado === 'calificada'
      );
      return acc + (entrega ? 1 : 0);
    }, 0);

    // Cuestionarios completados
    const quizzesTotal = cuestionarios.length;
    const quizzesCompletados = cuestionarios.reduce((acc, q) => {
      const completado = (q.intentos_cuestionario || []).find(i => i.estado === 'completado');
      return acc + (completado ? 1 : 0);
    }, 0);

    // Progreso general (actividades completadas / total actividades)
    const totalActividades = tareasTotal + quizzesTotal;
    const completadas = tareasEntregadas + quizzesCompletados;
    const progreso = totalActividades === 0 ? 0 : Math.round((completadas / totalActividades) * 100);

    return {
      ...insc,
      progreso,
      stats: {
        tareasTotal,
        tareasEntregadas,
        quizzesTotal,
        quizzesCompletados,
        totalActividades,
        completadas,
      }
    };
  });

  // Procesar calificaciones con nombre de curso
  const calificacionesProcesadas = (calificaciones || []).map(cal => {
    if (cal.tipo_origen === 'tarea' && cal.entregas_tareas) {
      return {
        ...cal,
        nombreActividad: cal.entregas_tareas.tareas?.titulo || 'Tarea',
        nombreCurso: cal.entregas_tareas.tareas?.cursos?.titulo || '',
        fecha: cal.fecha_calificacion,
      };
    }
    if (cal.tipo_origen === 'cuestionario' && cal.intentos_cuestionario) {
      return {
        ...cal,
        nombreActividad: cal.intentos_cuestionario.cuestionarios?.titulo || 'Cuestionario',
        nombreCurso: cal.intentos_cuestionario.cuestionarios?.cursos?.titulo || '',
        fecha: cal.fecha_calificacion,
      };
    }
    return { ...cal, nombreActividad: 'Actividad', nombreCurso: '' };
  });

  // KPIs globales
  const promedioGeneral = calificacionesProcesadas.length > 0
    ? calificacionesProcesadas.reduce((s, c) => s + (c.calificacion || 0), 0) / calificacionesProcesadas.length
    : null;

  const totalEntregas = cursosConProgreso.reduce((s, c) => s + (c.stats?.tareasEntregadas || 0), 0);
  const totalPendientes = cursosConProgreso.reduce(
    (s, c) => s + ((c.stats?.tareasTotal || 0) - (c.stats?.tareasEntregadas || 0)), 0
  );

  return {
    cursos: cursosConProgreso,
    calificaciones: calificacionesProcesadas,
    kpis: {
      totalCursos: cursosConProgreso.length,
      promedioGeneral,
      totalEntregas,
      totalPendientes,
    }
  };
};
