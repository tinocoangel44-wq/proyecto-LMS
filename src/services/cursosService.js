import { supabase } from './supabase';

// ─── Categorías ───────────────────────────────────────────────────────────────

/** Obtiene todas las categorías activas ordenadas por nombre. */
export const getCategorias = async () => {
  const { data, error } = await supabase
    .from('categorias_cursos')
    .select('*')
    .eq('estado', 'activo')
    .order('nombre');
  return { data, error };
};

// ─── Cursos ───────────────────────────────────────────────────────────────────

/** Obtiene todos los cursos no eliminados (con categoría y docentes). */
export const getCursos = async () => {
  const { data, error } = await supabase
    .from('cursos')
    .select(`
      *,
      categorias_cursos (id, nombre),
      curso_docentes (
        perfiles_usuarios!curso_docentes_docente_id_fkey (id, nombre_completo)
      )
    `)
    .neq('estado', 'eliminado')
    .order('created_at', { ascending: false });
  return { data, error };
};

/** Obtiene cursos publicados (catálogo público para estudiantes). */
export const getCursosPublicados = async () => {
  const { data, error } = await supabase
    .from('cursos')
    .select(`
      *,
      categorias_cursos (id, nombre),
      curso_docentes (
        perfiles_usuarios!curso_docentes_docente_id_fkey (id, nombre_completo)
      )
    `)
    .eq('estado', 'publicado')
    .order('created_at', { ascending: false });
  return { data, error };
};

/** Verifica si ya existe un curso con el mismo título. */
export const checkCursoExiste = async (titulo, excludeId = null) => {
  let query = supabase
    .from('cursos')
    .select('id')
    .ilike('titulo', titulo.trim())
    .neq('estado', 'eliminado');

  if (excludeId) query = query.neq('id', excludeId);

  const { data, error } = await query;
  return { existe: data && data.length > 0, error };
};

// ─── Imagen de portada ────────────────────────────────────────────────────────

/**
 * Sube una imagen al bucket "cursos-imagenes" de Supabase Storage.
 * @param {File}   file        Archivo a subir
 * @param {string} [cursoId]   UUID del curso (se usa para nombrar el archivo)
 * @returns {{ url: string|null, error: Error|null }}
 */
export const uploadCursoImagen = async (file, cursoId = null) => {
  try {
    // Generar nombre único: cursoId o timestamp + nombre limpio
    const ext       = file.name.split('.').pop().toLowerCase();
    const baseName  = cursoId ?? `nuevo-${Date.now()}`;
    const filePath  = `portadas/${baseName}.${ext}`;

    // Subir (upsert para permitir reemplazo en edición)
    const { error: uploadError } = await supabase.storage
      .from('cursos-imagenes')
      .upload(filePath, file, { upsert: true, contentType: file.type });

    if (uploadError) throw uploadError;

    // Obtener URL pública
    const { data } = supabase.storage
      .from('cursos-imagenes')
      .getPublicUrl(filePath);

    return { url: data.publicUrl, error: null };
  } catch (error) {
    console.error('Error subiendo imagen de curso:', error.message);
    return { url: null, error };
  }
};

/**
 * Elimina una imagen del bucket cuando se cambia o se borra el curso.
 * @param {string} publicUrl  URL pública de la imagen almacenada
 */
export const deleteCursoImagen = async (publicUrl) => {
  try {
    // Extraer el path relativo desde la URL pública
    const marker  = '/cursos-imagenes/';
    const idx     = publicUrl.indexOf(marker);
    if (idx === -1) return;
    const filePath = publicUrl.slice(idx + marker.length);

    await supabase.storage.from('cursos-imagenes').remove([filePath]);
  } catch (error) {
    console.error('Error eliminando imagen de curso:', error.message);
  }
};

// ─── CRUD Cursos ──────────────────────────────────────────────────────────────

/**
 * Crea un nuevo curso.
 * Si se proporciona un archivo de imagen, lo sube primero y guarda la URL.
 * @param {object} cursoData        Datos del formulario (incluye imageFile si hay archivo)
 * @param {string} [docentePerfilId]
 */
export const createCurso = async (cursoData, docentePerfilId = null) => {
  try {
    let imagenUrl = cursoData.imagen_url || null;

    // Prioridad: archivo > URL
    if (cursoData.imageFile) {
      const { url, error: imgErr } = await uploadCursoImagen(cursoData.imageFile);
      if (imgErr) throw new Error('No se pudo subir la imagen: ' + imgErr.message);
      imagenUrl = url;
    }

    const payload = {
      titulo:      cursoData.titulo.trim(),
      descripcion: cursoData.descripcion || null,
      categoria_id: cursoData.categoria_id || null,
      imagen_url:  imagenUrl,
      fecha_inicio: cursoData.fecha_inicio || null,
      fecha_fin:    cursoData.fecha_fin    || null,
      estado:       cursoData.estado       || 'publicado',
      creado_por:   cursoData.creado_por,
    };

    const { data, error } = await supabase
      .from('cursos')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;

    // Asignar docente automáticamente si se provee
    if (docentePerfilId && data?.id) {
      await supabase.from('curso_docentes').insert([{
        curso_id:   data.id,
        docente_id: docentePerfilId,
      }]);
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error creando curso:', error.message);
    return { data: null, error };
  }
};

/** Edita un curso existente. Si hay nuevo archivo de imagen, lo reemplaza. */
export const updateCurso = async (id, cursoData) => {
  try {
    let imagenUrl = cursoData.imagen_url ?? undefined;

    // Prioridad: archivo nuevo > URL mantenida
    if (cursoData.imageFile) {
      const { url, error: imgErr } = await uploadCursoImagen(cursoData.imageFile, id);
      if (imgErr) throw new Error('No se pudo subir la imagen: ' + imgErr.message);
      imagenUrl = url;
    }

    const updatePayload = {
      titulo:       cursoData.titulo?.trim(),
      descripcion:  cursoData.descripcion,
      categoria_id: cursoData.categoria_id || null,
      fecha_inicio: cursoData.fecha_inicio || null,
      fecha_fin:    cursoData.fecha_fin    || null,
      estado:       cursoData.estado       || 'publicado',
    };
    if (imagenUrl !== undefined) updatePayload.imagen_url = imagenUrl;

    const { data, error } = await supabase
      .from('cursos')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error actualizando curso:', error.message);
    return { data: null, error };
  }
};

/** Baja lógica de un curso (no elimina de la BD). */
export const deleteCurso = async (id) => {
  const { data, error } = await supabase
    .from('cursos')
    .update({ estado: 'eliminado' })
    .eq('id', id);
  return { data, error };
};
