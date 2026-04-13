import { supabase } from './supabase';

export const fetchDashboardData = async (role, perfilId) => {
  let stats = {
    misCursos: [],
    pendientes: [],
    calificaciones: [],
    mensajesRecientes: [],
    resumenGlobal: null
  };

  try {
    if (role === 'administrador') {
      // Vista Global
      const { data: globalData } = await supabase.from('vw_resumen_dashboard').select('*').single();
      stats.resumenGlobal = globalData;
      
      // Mensajería reciente para moderar
      const { data: msgs } = await supabase.from('mensajes_foro')
         .select('id, contenido, created_at, perfiles_usuarios(nombre_completo)')
         .order('created_at', { ascending: false })
         .limit(5);
      stats.mensajesRecientes = msgs || [];
    }

    if (role === 'docente') {
       // Cursos que administra
       const { data: cursosData } = await supabase.from('vw_cursos_docente').select('*').eq('docente_id', perfilId);
       stats.misCursos = cursosData || [];

       // Últimas Entregas pendientes de calificar (Query cruda por JOIN invertido)
       const { data: pendientes } = await supabase.from('entregas_tareas')
         .select('id, fecha_entrega, tareas!inner(titulo), perfiles_usuarios(nombre_completo)')
         .eq('estado', 'entregada') // asumiendo flujo lógico estricto
         .limit(5);
       stats.pendientes = pendientes || [];
    }

    if (role === 'estudiante') {
       // Cursos Inscritos
       const { data: cursosInsc } = await supabase.from('vw_cursos_estudiante').select('*').eq('estudiante_id', perfilId);
       stats.misCursos = cursosInsc || [];

       // Actividades a punto de vencer
       const { data: actPendientes } = await supabase.from('vw_actividades_pendientes')
         .select('*')
         .eq('estudiante_id', perfilId)
         .order('fecha_limite', { ascending: true })
         .limit(4);
       stats.pendientes = actPendientes || [];

       // Boleta Calificaciones Histórica
       const { data: boleta } = await supabase.from('vw_calificaciones_estudiante')
         .select('*')
         .eq('estudiante_id', perfilId)
         .order('fecha_calificacion', { ascending: false })
         .limit(5);
       stats.calificaciones = boleta || [];
    }

  } catch(error) {
     console.error("Dashboard Fetch Error:", error);
  }

  return stats;
};
