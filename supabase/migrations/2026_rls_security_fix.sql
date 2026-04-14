-- Eliminacion de politicas debiles (SELECT true overrides everything)
DROP POLICY IF EXISTS "Ver modulos del curso" ON public.modulos;
DROP POLICY IF EXISTS "Ver materiales del modulo" ON public.materiales;
DROP POLICY IF EXISTS "Ver tareas del curso" ON public.tareas;
DROP POLICY IF EXISTS "Ver cuestionarios" ON public.cuestionarios;
DROP POLICY IF EXISTS "Ver preguntas" ON public.preguntas;
DROP POLICY IF EXISTS "Read preguntas" ON public.preguntas;
DROP POLICY IF EXISTS "Ver opciones" ON public.opciones_respuesta;
DROP POLICY IF EXISTS "Read opciones" ON public.opciones_respuesta;
DROP POLICY IF EXISTS "Ver respuestas de intento propio" ON public.respuestas_intento;
DROP POLICY IF EXISTS "Insertar notificaciones (autenticado)" ON public.notificaciones;

-- Creacion de politicas estrictas para Preguntas
CREATE POLICY "Strict read preguntas" ON public.preguntas FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.cuestionarios c
    WHERE c.id = preguntas.cuestionario_id
    AND (
      is_estudiante_inscrito(c.curso_id)
      OR is_docente_del_curso(c.curso_id)
      OR get_user_role() = 'administrador'
    )
  )
);

-- Creacion de politicas estrictas para Opciones Respuesta
CREATE POLICY "Strict read opciones_respuesta" ON public.opciones_respuesta FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.preguntas p
    JOIN public.cuestionarios c ON p.cuestionario_id = c.id
    WHERE p.id = opciones_respuesta.pregunta_id
    AND (
      is_estudiante_inscrito(c.curso_id)
      OR is_docente_del_curso(c.curso_id)
      OR get_user_role() = 'administrador'
    )
  )
);

-- Creacion de politicas estrictas para leer sus Propias respuestas inteto
CREATE POLICY "Student read own respuestas, Docente read all" ON public.respuestas_intento FOR SELECT
USING (
  get_user_role() = ANY (ARRAY['docente'::text, 'administrador'::text])
  OR EXISTS (
    SELECT 1 FROM public.intentos_cuestionario i
    JOIN public.perfiles_usuarios pu ON pu.id = i.estudiante_id
    WHERE i.id = respuestas_intento.intento_id
    AND pu.user_id = auth.uid()
  )
);

-- Para Notificaciones no necesitamos insert publico, admin/docentes:
CREATE POLICY "Admin/Docente insert notificaciones" ON public.notificaciones FOR INSERT
WITH CHECK (get_user_role() = ANY (ARRAY['docente'::text, 'administrador'::text]));
