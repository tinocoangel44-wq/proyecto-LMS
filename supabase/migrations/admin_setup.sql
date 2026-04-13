-- 1. Insertar el rol "administrador"
INSERT INTO public.roles (nombre, descripcion)
VALUES ('administrador', 'control total del sistema')
ON CONFLICT (nombre) DO NOTHING;

-- 2. Crear un usuario administrador en auth.users y perfiles_usuarios
DO $$
DECLARE
    new_admin_id uuid;
    admin_rol_id uuid;
BEGIN
    SELECT id INTO admin_rol_id FROM public.roles WHERE nombre = 'administrador';
    
    -- Checar si el usuario ya existe por email
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@sapienta.com') THEN
        -- Insertar simulado en auth.users
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
            recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, 
            created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 
            'admin@sapienta.com', crypt('Admin123!', gen_salt('bf')), current_timestamp, 
            current_timestamp, current_timestamp, '{"provider":"email","providers":["email"]}', '{}', 
            current_timestamp, current_timestamp, '', '', '', ''
        ) RETURNING id INTO new_admin_id;

        -- Insertar en perfiles_usuarios
        INSERT INTO public.perfiles_usuarios (user_id, nombre_completo, rol_id, estado)
        VALUES (new_admin_id, 'Administrador del Sistema', admin_rol_id, 'activo');
    END IF;
END $$;

-- 3 y 4. Políticas para brindar acceso irrestricto de RLS a los administradores.
-- Dado que supabase evalúa el `OR` usando las diferentes sentencias de POLICY, podemos crear una específica 'Admin Bypass' en cada tabla.
DO $$ 
DECLARE 
    t_name text;
    pol_name text;
BEGIN 
    FOR t_name IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        pol_name := 'Admin Bypass para ' || t_name;
        
        -- Evitamos error si la política ya existe borrándola
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol_name, t_name);
        
        -- Creamos la política de ALL usando la función actual de get_user_role()
        EXECUTE format(
            'CREATE POLICY %I ON public.%I FOR ALL USING (public.get_user_role() = ''administrador'') WITH CHECK (public.get_user_role() = ''administrador'')',
            pol_name, t_name
        );
    END LOOP;
END $$;

-- 5. Función RPC Elevada (SECURITY DEFINER) para CREAR Usuarios
CREATE OR REPLACE FUNCTION public.crear_usuario_admin(
    p_email text,
    p_password text,
    p_nombre_completo text,
    p_rol_nombre text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
    v_rol_id uuid;
BEGIN
    -- 1. Validar que quien invoca sea administrador (RLS adicional de seguridad en el backend)
    IF public.get_user_role() != 'administrador' THEN
        RAISE EXCEPTION 'No tienes permisos para crear usuarios.';
    END IF;

    -- 2. Obtener el ID del Rol
    SELECT id INTO v_rol_id FROM public.roles WHERE nombre = p_rol_nombre;
    IF v_rol_id IS NULL THEN
        RAISE EXCEPTION 'El rol especificado no existe.';
    END IF;

    -- 3. Crear el usuario en esquema Auth
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data
    ) VALUES (
        '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 
        p_email, crypt(p_password, gen_salt('bf')), current_timestamp, '{"provider":"email","providers":["email"]}', '{}'
    ) RETURNING id INTO v_user_id;

    -- 4. Crear el Perfil Usuario correspondiente
    INSERT INTO public.perfiles_usuarios (user_id, nombre_completo, rol_id, estado)
    VALUES (v_user_id, p_nombre_completo, v_rol_id, 'activo');

    RETURN json_build_object('success', true, 'user_id', v_user_id);
END;
$$;

-- 6. Función RPC Elevada (SECURITY DEFINER) para DESACTIVAR/ELIMINAR Usuarios
CREATE OR REPLACE FUNCTION public.eliminar_usuario_admin(
    p_user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Validar que quien invoca sea administrador
    IF public.get_user_role() != 'administrador' THEN
        RAISE EXCEPTION 'No tienes permisos para eliminar usuarios.';
    END IF;

    -- Opcion A: Borrado Cascada desde Auth (Borra totalmente)
    DELETE FROM auth.users WHERE id = p_user_id;
    
    -- Opcion B: Borrado lógico `UPDATE public.perfiles_usuarios SET estado = 'inactivo' WHERE user_id = p_user_id;`
    -- Se ha elegido Opcion A porque RLS y ON DELETE CASCADE (si está puesto) limpiará el resto de la data, o los dejará huerfanos limpios.

    RETURN json_build_object('success', true);
END;
$$;
