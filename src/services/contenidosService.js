import { supabase } from './supabase';

// Extraer Módulos anidados con Materiales gracias al ORM de Supabase
export const getEstructuraCurso = async (cursoId) => {
  const { data, error } = await supabase
    .from('modulos')
    .select(`
      *,
      materiales (*)
    `)
    .eq('curso_id', cursoId)
    // El orden global prioriza primero el módulo y como subfiltro el de los materiales a través de FK
    .order('orden', { ascending: true })
    .order('orden', { foreignTable: 'materiales', ascending: true });
    
  return { data, error };
};

// Insertar un nuevo Módulo
export const createModulo = async (moduloData) => {
  const { data, error } = await supabase
    .from('modulos')
    .insert([moduloData])
    .select()
    .single();
  return { data, error };
};

// Insertar un nuevo Material dentro de un módulo
export const createMaterial = async (materialData) => {
  const { data, error } = await supabase
    .from('materiales')
    .insert([materialData])
    .select()
    .single();
  return { data, error };
};

// Borrado de Módulo (La BDD se encarga de aplicar un borrado en Cascada a "materiales")
export const deleteModulo = async (moduloId) => {
  const { data, error } = await supabase
    .from('modulos')
    .delete()
    .eq('id', moduloId);
  return { data, error };
};

// Borrado individual de Material
export const deleteMaterial = async (materialId) => {
  const { data, error } = await supabase
    .from('materiales')
    .delete()
    .eq('id', materialId);
  return { data, error };
};
