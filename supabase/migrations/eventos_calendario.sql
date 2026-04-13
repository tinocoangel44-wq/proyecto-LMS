-- ==============================================================================
-- 1. CREACIÓN DE LA TABLA: eventos_calendario
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.eventos_calendario (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    curso_id UUID NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
    titulo_reunion VARCHAR(255) NOT NULL,
    url_reunion TEXT,
    fecha_hora_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    duracion_minutos INTEGER DEFAULT 60 NOT NULL,
    creado_por UUID NOT NULL REFERENCES public.perfiles_usuarios(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Comentarios
COMMENT ON TABLE public.eventos_calendario IS 'Gestión de clases en vivo y eventos académicos vinculados a un curso.';

-- ==============================================================================
-- 2. ÍNDICES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_evento_curso ON public.eventos_calendario(curso_id);
CREATE INDEX IF NOT EXISTS idx_evento_fecha ON public.eventos_calendario(fecha_hora_inicio);

-- ==============================================================================
-- 3. HABILITACIÓN DE PREMISAS DE SEGURIDAD (RLS)
-- ==============================================================================
ALTER TABLE public.eventos_calendario ENABLE ROW LEVEL SECURITY;

-- Funciones Auxiliares utilizadas: 
-- public.is_docente_del_curso(curso_id) (Ya existente)
-- public.is_estudiante_inscrito(curso_id) (Ya existente)
-- public.get_user_role() (Ya existente e incluye 'administrador')

-- A) VISUALIZACIÓN (SELECT)
-- Un estudiante inscrito puede visualizarlo, un docente del curso puede visualizarlo
DROP POLICY IF EXISTS "Ver eventos del calendario permitidos" ON public.eventos_calendario;
CREATE POLICY "Ver eventos del calendario permitidos" 
ON public.eventos_calendario FOR SELECT 
USING (
    public.is_estudiante_inscrito(curso_id) 
    OR 
    public.is_docente_del_curso(curso_id)
    OR 
    public.get_user_role() = 'administrador'
);

-- B) INSERCIÓN (INSERT)
-- Solo un docente perteneciente al curso (o un admin) puede agendar eventos.
DROP POLICY IF EXISTS "Docentes pueden registrar eventos" ON public.eventos_calendario;
CREATE POLICY "Docentes pueden registrar eventos" 
ON public.eventos_calendario FOR INSERT 
WITH CHECK (
    public.is_docente_del_curso(curso_id)
    OR
    public.get_user_role() = 'administrador'
);

-- C) ACTUALIZACIÓN (UPDATE)
-- Solo el docente titular o creador puede alterar el enlace o fecha.
DROP POLICY IF EXISTS "Docentes pueden actualizar sus eventos" ON public.eventos_calendario;
CREATE POLICY "Docentes pueden actualizar sus eventos" 
ON public.eventos_calendario FOR UPDATE 
USING (
    public.is_docente_del_curso(curso_id)
    OR
    public.get_user_role() = 'administrador'
);

-- D) BORRADO (DELETE)
-- Solo docentes pueden cancelar/eliminar eventos.
DROP POLICY IF EXISTS "Docentes pueden cancelar eventos" ON public.eventos_calendario;
CREATE POLICY "Docentes pueden cancelar eventos" 
ON public.eventos_calendario FOR DELETE 
USING (
    public.is_docente_del_curso(curso_id)
    OR
    public.get_user_role() = 'administrador'
);

-- ==============================================================================
-- 4. TRIGGER ON UPDATE PARA UPDATED_AT
-- ==============================================================================
DROP TRIGGER IF EXISTS trigger_actualiza_updated_at_eventos ON public.eventos_calendario;
CREATE TRIGGER trigger_actualiza_updated_at_eventos
BEFORE UPDATE ON public.eventos_calendario
FOR EACH ROW
EXECUTE FUNCTION public.actualizar_marca_updated_at();
