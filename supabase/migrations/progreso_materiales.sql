-- ==============================================================================
-- 1. CREACIÓN DE LA TABLA: progreso_materiales
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.progreso_materiales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    estudiante_id UUID NOT NULL REFERENCES public.perfiles_usuarios(user_id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES public.materiales(id) ON DELETE CASCADE,
    completado BOOLEAN DEFAULT false,
    tiempo_invertido_segundos INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Asegura que un estudiante solo tenga un registro de progreso por material
    CONSTRAINT progreso_materiales_unico UNIQUE (estudiante_id, material_id)
);

-- Comentarios explicativos
COMMENT ON TABLE public.progreso_materiales IS 'Registro del seguimiento y tiempo que gasta un estudiante dentro de un material del curso.';

-- ==============================================================================
-- 2. ÍNDICES DE OPTIMIZACIÓN
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_progreso_estudiante ON public.progreso_materiales(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_progreso_material ON public.progreso_materiales(material_id);

-- ==============================================================================
-- 3. FUNCIONES AUXILIARES PARA RLS E INTEGRIDAD
-- ==============================================================================

-- Verificar si alguien es docente de un curso específico
CREATE OR REPLACE FUNCTION public.is_docente_del_curso(p_curso_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.curso_docentes 
        WHERE curso_id = p_curso_id 
        AND docente_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar si alguien es estudiante en un curso específico
CREATE OR REPLACE FUNCTION public.is_estudiante_inscrito(p_curso_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.inscripciones 
        WHERE curso_id = p_curso_id 
        AND estudiante_id = auth.uid()
        AND estado = 'activa'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Localizar a qué curso pertenece un material
CREATE OR REPLACE FUNCTION public.get_curso_de_material(p_material_id UUID)
RETURNS UUID AS $$
DECLARE v_curso_id UUID;
BEGIN
    SELECT m.curso_id INTO v_curso_id
    FROM public.materiales mat
    JOIN public.modulos m ON mat.modulo_id = m.id
    WHERE mat.id = p_material_id;
    RETURN v_curso_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- ==============================================================================
-- 4. POLÍTICAS DE SEGURIDAD A NIVEL DE FILAS (RLS)
-- ==============================================================================
ALTER TABLE public.progreso_materiales ENABLE ROW LEVEL SECURITY;

-- Nota: Si tu script de '01_admin_setup.sql' ya creó el Policy Global para Admin Bypass,
-- el administrador automáticamente tiene acceso (no es necesario reescribirlo aquí, pero por compatibilidad se integra el acceso en el OR si se desea).

-- Lógica pura:

-- A) VISUALIZACIÓN (SELECT)
-- Un estudiante puede ver el suyo. Un docente puede ver el de sus materias.
CREATE POLICY "Visibilidad del Progreso de Materiales" 
ON public.progreso_materiales FOR SELECT 
USING (
    estudiante_id = auth.uid() 
    OR 
    public.is_docente_del_curso(public.get_curso_de_material(material_id))
    OR 
    public.get_user_role() = 'administrador'
);

-- B) INSERCIÓN (INSERT)
-- Un estudiante SOLO puede registrar progreso de un curso si está inscrito en él y su estudiante_id cuadra.
CREATE POLICY "Estudiantes pueden insertar su propio progreso" 
ON public.progreso_materiales FOR INSERT 
WITH CHECK (
    estudiante_id = auth.uid() 
    AND 
    public.is_estudiante_inscrito(public.get_curso_de_material(material_id))
);

-- C) ACTUALIZACIÓN (UPDATE)
-- Un estudiante SOLO puede actualizar si le concierne a él, o si el Docente lo recalifica manual / Admin interviene.
CREATE POLICY "Estudiantes pueden actualizar su propio progreso" 
ON public.progreso_materiales FOR UPDATE 
USING (
    estudiante_id = auth.uid()
    OR
    public.get_user_role() = 'administrador'
);

-- D) BORRADO (DELETE)
-- Un estudiante no puede borrar rastros, pero un administrador sí. (Administrado por Bypass global).
CREATE POLICY "Solo Administradores purgan progreso manualmente" 
ON public.progreso_materiales FOR DELETE 
USING (
    public.get_user_role() = 'administrador'
);

-- ==============================================================================
-- 5. TRIGGER ON UPDATE PARA UPDATED_AT
-- ==============================================================================
CREATE OR REPLACE FUNCTION actualizar_marca_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_actualiza_updated_at_progreso ON public.progreso_materiales;

CREATE TRIGGER trigger_actualiza_updated_at_progreso
BEFORE UPDATE ON public.progreso_materiales
FOR EACH ROW
EXECUTE FUNCTION actualizar_marca_updated_at();
