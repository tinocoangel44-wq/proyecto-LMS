-- ══════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Fix políticas RLS de la tabla tareas
-- Fecha: 2026-04-14
-- Problema: "new row violates row-level security policy for table tareas"
--   La política ALL "Manage tareas admin/docente" requería is_docente_del_curso()
--   lo que bloqueaba INSERTs de docentes no asignados explícitamente al curso
--   pero con rol válido de 'docente' o 'administrador'.
-- Solución: Separar políticas por comando (SELECT/INSERT/UPDATE/DELETE) con
--   condiciones claras y consistentes basadas en get_user_role().
-- ══════════════════════════════════════════════════════════════════════════

-- 1. Eliminar todas las políticas existentes en tareas
DROP POLICY IF EXISTS "Admin Bypass para tareas" ON public.tareas;
DROP POLICY IF EXISTS "Docentes borran tareas" ON public.tareas;
DROP POLICY IF EXISTS "Docentes crean tareas" ON public.tareas;
DROP POLICY IF EXISTS "Docentes editan tareas" ON public.tareas;
DROP POLICY IF EXISTS "Manage tareas admin/docente" ON public.tareas;
DROP POLICY IF EXISTS "Read tareas" ON public.tareas;

-- 2. Asegurar que RLS esté habilitado
ALTER TABLE public.tareas ENABLE ROW LEVEL SECURITY;

-- 3. SELECT: Docentes, admins y estudiantes inscritos pueden leer tareas
CREATE POLICY "tareas_select"
  ON public.tareas FOR SELECT
  USING (
    get_user_role() = 'administrador'
    OR is_docente_del_curso(curso_id)
    OR get_user_role() = 'docente'
    OR is_estudiante_inscrito(curso_id)
  );

-- 4. INSERT: Cualquier docente o administrador puede crear tareas
--    (get_user_role verifica el rol desde perfiles_usuarios via auth.uid())
CREATE POLICY "tareas_insert"
  ON public.tareas FOR INSERT
  WITH CHECK (
    get_user_role() = ANY(ARRAY['docente', 'administrador'])
  );

-- 5. UPDATE: Docentes del curso o admins pueden editar tareas
CREATE POLICY "tareas_update"
  ON public.tareas FOR UPDATE
  USING (
    get_user_role() = 'administrador'
    OR is_docente_del_curso(curso_id)
    OR get_user_role() = 'docente'
  )
  WITH CHECK (
    get_user_role() = ANY(ARRAY['docente', 'administrador'])
  );

-- 6. DELETE: Docentes del curso o admins pueden eliminar tareas
CREATE POLICY "tareas_delete"
  ON public.tareas FOR DELETE
  USING (
    get_user_role() = 'administrador'
    OR is_docente_del_curso(curso_id)
    OR get_user_role() = 'docente'
  );
