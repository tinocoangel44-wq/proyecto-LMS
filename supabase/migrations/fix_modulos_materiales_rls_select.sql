-- ══════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Fix políticas SELECT de modulos y materiales
-- Fecha: 2026-04-14
-- Problema: El docente no veía el contenido del curso creado por admin.
--   Las políticas "Read modulos" y "Read materiales" solo permitían
--   acceso via is_docente_del_curso(), que requiere registro en
--   curso_docentes. Si el curso fue creado por admin y el docente
--   no está en esa tabla, la consulta devuelve vacío.
-- Solución: Agregar get_user_role() = 'docente' como condición
--   alternativa para garantizar visibilidad a cualquier docente.
-- ══════════════════════════════════════════════════════════════════

-- ── MODULOS ────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Read modulos" ON public.modulos;

CREATE POLICY "Read modulos"
  ON public.modulos FOR SELECT
  USING (
    get_user_role() = 'administrador'
    OR get_user_role() = 'docente'
    OR is_docente_del_curso(curso_id)
    OR is_estudiante_inscrito(curso_id)
  );

-- ── MATERIALES ─────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Read materiales" ON public.materiales;

CREATE POLICY "Read materiales"
  ON public.materiales FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.modulos m
      WHERE m.id = materiales.modulo_id
      AND (
        get_user_role() = 'administrador'
        OR get_user_role() = 'docente'
        OR is_docente_del_curso(m.curso_id)
        OR is_estudiante_inscrito(m.curso_id)
      )
    )
  );
