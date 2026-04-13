import { supabase } from './supabase';

// ── Alias de compatibilidad para DashboardInsights (PanelDocente legacy) ──
export const fetchDashboardData = async (role, perfilId) => {
  const stats = { misCursos: [], pendientes: [], calificaciones: [], mensajesRecientes: [], resumenGlobal: null };
  try {
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

// ── DASHBOARD ADMIN ────────────────────────────────────────────────────────
export const getDashboardAdmin = async () => {
  const [usersRes, cursosRes, entregasRes, mensajesRes, inscripcionesRes] = await Promise.all([
    supabase.from('perfiles_usuarios').select('id, nombre_completo, created_at, roles(nombre)').order('created_at', { ascending: false }),
    supabase.from('cursos').select('id, titulo, estado, created_at, categorias_cursos(nombre)').neq('estado', 'eliminado').order('created_at', { ascending: false }),
    supabase.from('entregas_tareas').select('id, estado, fecha_entrega').order('fecha_entrega', { ascending: false }).limit(200),
    supabase.from('mensajes_foro').select('id, contenido, created_at, perfiles_usuarios(nombre_completo)').order('created_at', { ascending: false }).limit(6),
    supabase.from('inscripciones').select('id, estado').eq('estado', 'activo'),
  ]);

  const usuarios = usersRes.data || [];
  const cursos   = cursosRes.data || [];
  const entregas = entregasRes.data || [];
  const mensajes = mensajesRes.data || [];
  const inscripciones = inscripcionesRes.data || [];

  const docentes    = usuarios.filter(u => u.roles?.nombre === 'docente').length;
  const estudiantes = usuarios.filter(u => u.roles?.nombre === 'estudiante').length;
  const admins      = usuarios.filter(u => u.roles?.nombre === 'administrador').length;

  const cursosActivos    = cursos.filter(c => c.estado === 'publicado').length;
  const entregasRecientes = entregas.filter(e => {
    const d = new Date(e.fecha_entrega);
    return Date.now() - d.getTime() < 7 * 24 * 60 * 60 * 1000;
  }).length;

  return {
    kpis: { totalUsuarios: usuarios.length, docentes, estudiantes, admins, totalCursos: cursos.length, cursosActivos, totalInscripciones: inscripciones.length, entregasRecientes },
    usuariosRecientes: usuarios.slice(0, 8),
    cursosRecientes: cursos.slice(0, 6),
    mensajesRecientes: mensajes,
  };
};

// ── DASHBOARD DOCENTE ──────────────────────────────────────────────────────
export const getDashboardDocente = async (docenteId) => {
  // Cursos del docente
  const { data: cursosDocente } = await supabase
    .from('curso_docentes')
    .select(`
      cursos (
        id, titulo, descripcion, imagen_url, estado, created_at,
        categorias_cursos (nombre),
        inscripciones (id, estado),
        tareas (
          id, titulo, fecha_limite, estado,
          entregas_tareas (id, estado, fecha_entrega, estudiante_id,
            perfiles_usuarios (nombre_completo)
          )
        )
      )
    `)
    .eq('docente_id', docenteId);

  const cursos = (cursosDocente || []).map(cd => cd.cursos).filter(Boolean);

  // KPIs
  let totalEstudiantes = 0;
  let totalTareas = 0;
  let totalEntregasPendientes = 0;
  const entregasPendientes = [];

  cursos.forEach(curso => {
    const insc = (curso.inscripciones || []).filter(i => i.estado === 'activo');
    totalEstudiantes += insc.length;
    totalTareas += (curso.tareas || []).length;

    (curso.tareas || []).forEach(tarea => {
      (tarea.entregas_tareas || []).forEach(entrega => {
        if (entrega.estado === 'entregada') {
          totalEntregasPendientes++;
          entregasPendientes.push({
            ...entrega,
            tarea_titulo: tarea.titulo,
            curso_titulo: curso.titulo,
            curso_id: curso.id,
            tarea_id: tarea.id,
          });
        }
      });
    });
  });

  // Mensajes recientes del foro en sus cursos
  const cursoIds = cursos.map(c => c.id);
  let mensajesRecientes = [];
  if (cursoIds.length > 0) {
    const { data: foros } = await supabase
      .from('foros')
      .select('id, titulo, curso_id')
      .in('curso_id', cursoIds);

    const foroIds = (foros || []).map(f => f.id);
    if (foroIds.length > 0) {
      const { data: msgs } = await supabase
        .from('mensajes_foro')
        .select('id, contenido, created_at, perfiles_usuarios(nombre_completo), foro_id')
        .in('foro_id', foroIds)
        .order('created_at', { ascending: false })
        .limit(5);
      mensajesRecientes = (msgs || []).map(m => ({
        ...m,
        foro_titulo: (foros || []).find(f => f.id === m.foro_id)?.titulo,
      }));
    }
  }

  return {
    cursos,
    kpis: { totalCursos: cursos.length, totalEstudiantes, totalTareas, totalEntregasPendientes },
    entregasPendientes: entregasPendientes.slice(0, 10),
    mensajesRecientes,
  };
};

// ── DASHBOARD ESTUDIANTE ─────────────────────────────────────────────────
export const getDashboardEstudiante = async (estudianteId) => {
  const { data: inscripciones } = await supabase
    .from('inscripciones')
    .select(`
      id, fecha_inscripcion, estado,
      cursos (
        id, titulo, descripcion, imagen_url, estado,
        categorias_cursos (nombre),
        modulos (id, materiales (id)),
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

  const { data: calificaciones } = await supabase
    .from('calificaciones')
    .select(`
      id, calificacion, retroalimentacion, fecha_calificacion, tipo_origen,
      entregas_tareas (id, fecha_entrega, tareas (titulo, cursos(titulo))),
      intentos_cuestionario (id, fecha_fin, cuestionarios (titulo, cursos(titulo)))
    `)
    .eq('estudiante_id', estudianteId)
    .order('fecha_calificacion', { ascending: false })
    .limit(20);

  // Mensajes recientes en cursos inscritos
  const cursosIds = (inscripciones || []).map(i => i.cursos?.id).filter(Boolean);
  let mensajesRecientes = [];
  if (cursosIds.length > 0) {
    const { data: foros } = await supabase
      .from('foros').select('id, titulo, curso_id').in('curso_id', cursosIds);
    const foroIds = (foros || []).map(f => f.id);
    if (foroIds.length > 0) {
      const { data: msgs } = await supabase
        .from('mensajes_foro')
        .select('id, contenido, created_at, perfiles_usuarios(nombre_completo), foro_id')
        .in('foro_id', foroIds)
        .neq('autor_id', estudianteId)
        .order('created_at', { ascending: false })
        .limit(4);
      mensajesRecientes = (msgs || []).map(m => ({
        ...m,
        foro_titulo: (foros || []).find(f => f.id === m.foro_id)?.titulo,
      }));
    }
  }

  const cursosData = inscripciones || [];
  const cursosConProgreso = cursosData.map(insc => {
    const curso = insc.cursos;
    if (!curso) return { ...insc, progreso: 0, stats: {} };
    const tareas = curso.tareas || [];
    const cuestionarios = curso.cuestionarios || [];
    const tareasTotal = tareas.filter(t => t.estado !== 'eliminada').length;
    const tareasEntregadas = tareas.reduce((acc, t) => {
      const entrega = (t.entregas_tareas || []).find(e => e.estado === 'entregada' || e.estado === 'calificada');
      return acc + (entrega ? 1 : 0);
    }, 0);
    const quizzesTotal = cuestionarios.length;
    const quizzesCompletados = cuestionarios.reduce((acc, q) => {
      const completado = (q.intentos_cuestionario || []).find(i => i.estado === 'completado');
      return acc + (completado ? 1 : 0);
    }, 0);
    const totalActividades = tareasTotal + quizzesTotal;
    const completadas = tareasEntregadas + quizzesCompletados;
    const progreso = totalActividades === 0 ? 0 : Math.round((completadas / totalActividades) * 100);
    return { ...insc, progreso, stats: { tareasTotal, tareasEntregadas, quizzesTotal, quizzesCompletados, totalActividades, completadas } };
  });

  const calificacionesProcesadas = (calificaciones || []).map(cal => {
    if (cal.tipo_origen === 'tarea' && cal.entregas_tareas)
      return { ...cal, nombreActividad: cal.entregas_tareas.tareas?.titulo || 'Tarea', nombreCurso: cal.entregas_tareas.tareas?.cursos?.titulo || '', fecha: cal.fecha_calificacion };
    if (cal.tipo_origen === 'cuestionario' && cal.intentos_cuestionario)
      return { ...cal, nombreActividad: cal.intentos_cuestionario.cuestionarios?.titulo || 'Cuestionario', nombreCurso: cal.intentos_cuestionario.cuestionarios?.cursos?.titulo || '', fecha: cal.fecha_calificacion };
    return { ...cal, nombreActividad: 'Actividad', nombreCurso: '' };
  });

  const promedioGeneral = calificacionesProcesadas.length > 0
    ? calificacionesProcesadas.reduce((s, c) => s + (c.calificacion || 0), 0) / calificacionesProcesadas.length
    : null;
  const totalEntregas = cursosConProgreso.reduce((s, c) => s + (c.stats?.tareasEntregadas || 0), 0);
  const totalPendientes = cursosConProgreso.reduce((s, c) => s + ((c.stats?.tareasTotal || 0) - (c.stats?.tareasEntregadas || 0)), 0);

  return {
    cursos: cursosConProgreso,
    calificaciones: calificacionesProcesadas,
    mensajesRecientes,
    kpis: { totalCursos: cursosConProgreso.length, promedioGeneral, totalEntregas, totalPendientes },
  };
};
