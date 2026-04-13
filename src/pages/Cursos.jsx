import React, { useState, useEffect } from 'react';
import { getCursos, createCurso, updateCurso, deleteCurso, getCategorias } from '../services/cursosService';
import { useAuth } from '../context/AuthContext';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const Cursos = () => {
  const { user } = useAuth();
  const [cursos, setCursos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [formData, setFormData] = useState({ id: null, titulo: '', descripcion: '', categoria_id: '', imagen_url: '', fecha_inicio: '', fecha_fin: '' });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadCursos();
    loadCategorias();
  }, []);

  const loadCursos = async () => {
    const { data } = await getCursos();
    if (data) setCursos(data);
  };

  const loadCategorias = async () => {
    const { data } = await getCategorias();
    if (data) setCategorias(data);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      titulo: formData.titulo,
      descripcion: formData.descripcion,
      categoria_id: formData.categoria_id || null,
      imagen_url: formData.imagen_url,
      fecha_inicio: formData.fecha_inicio || null,
      fecha_fin: formData.fecha_fin || null,
      estado: 'publicado',
      creado_por: user?.id,
    };

    if (isEditing) {
      await updateCurso(formData.id, payload);
    } else {
      await createCurso(payload);
    }
    
    // Refresco de listado
    loadCursos();
    setFormData({ id: null, titulo: '', descripcion: '', categoria_id: '', imagen_url: '', fecha_inicio: '', fecha_fin: '' });
    setIsEditing(false);
  };

  const handleEdit = (curso) => {
    setFormData({
      id: curso.id,
      titulo: curso.titulo,
      descripcion: curso.descripcion,
      categoria_id: curso.categoria_id,
      imagen_url: curso.imagen_url || '',
      fecha_inicio: curso.fecha_inicio || '',
      fecha_fin: curso.fecha_fin || ''
    });
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    // Baja lógica en la base de datos (estado = 'eliminado')
    if (window.confirm('¿Estás seguro de querer eliminar este curso?')) {
      await deleteCurso(id);
      loadCursos();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Gestión de Cursos</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Módulo Administrativo y Docente</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Editor Formulario */}
        <Card className="lg:col-span-1 lg:sticky lg:top-24">
          <CardHeader>
             <h2 className="text-xl font-bold text-slate-800 dark:text-white">
               {isEditing ? '✏️ Editar Curso' : '✨ Crear Curso'}
             </h2>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input 
                label="TÍTULO"
                name="titulo" 
                value={formData.titulo} 
                onChange={handleInputChange} 
                placeholder="Título de la materia" 
                required 
              />
              
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">DESCRIPCIÓN</label>
                <textarea 
                  name="descripcion" 
                  value={formData.descripcion} 
                  onChange={handleInputChange} 
                  placeholder="Descripción breve (ej. Objetivos, temario principal...)" 
                  rows="3"
                  className="px-4 py-2 bg-white dark:bg-dark-bg border border-slate-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">CATEGORÍA</label>
                <select 
                  name="categoria_id" 
                  value={formData.categoria_id || ''} 
                  onChange={handleInputChange} 
                  required
                  className="px-4 py-2 bg-white dark:bg-dark-bg border border-slate-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white transition-colors"
                >
                  <option value="">-- Selecciona una categoría --</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </select>
              </div>

              <Input 
                label="URL IMAGEN DE PORTADA"
                name="imagen_url" 
                value={formData.imagen_url} 
                onChange={handleInputChange} 
                placeholder="https://..." 
              />
              
              <div className="flex gap-4">
                <Input 
                  label="INICIO"
                  type="date" 
                  name="fecha_inicio" 
                  value={formData.fecha_inicio} 
                  onChange={handleInputChange} 
                  className="w-full"
                />
                <Input 
                  label="FIN"
                  type="date" 
                  name="fecha_fin" 
                  value={formData.fecha_fin} 
                  onChange={handleInputChange} 
                  className="w-full"
                />
              </div>
              
              <div className="flex flex-col gap-3 mt-4">
                <Button type="submit" variant={isEditing ? 'warning' : 'primary'}>
                  {isEditing ? 'Guardar Cambios' : 'Registrar Nuevo Curso'}
                </Button>
                {isEditing && (
                  <Button type="button" variant="outline" onClick={() => { setIsEditing(false); setFormData({ id: null, titulo: '', descripcion: '', categoria_id: '', imagen_url: '', fecha_inicio: '', fecha_fin: '' }); }}>
                     Cancelar Edición
                  </Button>
                )}
              </div>
            </form>
          </CardBody>
        </Card>

        {/* Tabla Lista de Cursos */}
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-dark-bg border-b border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-300 text-sm font-semibold">
                  <th className="px-6 py-4">Materia Académica</th>
                  <th className="px-6 py-4">Categoría</th>
                  <th className="px-6 py-4">Calendario</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                {cursos.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 italic">
                      No hay cursos registrados gestionados por tí.
                    </td>
                  </tr>
                ) : (
                  cursos.map(curso => (
                    <tr key={curso.id} className="hover:bg-slate-50/50 dark:hover:bg-dark-bg/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {curso.imagen_url && (
                            <img src={curso.imagen_url} alt="" className="w-10 h-10 rounded object-cover shadow-sm hidden sm:block" />
                          )}
                          <div>
                            <strong className="text-slate-800 dark:text-white block mb-1">{curso.titulo}</strong>
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{curso.descripcion}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {curso.categorias_cursos?.nombre || 'Sin Categoría'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {curso.fecha_inicio ? `${curso.fecha_inicio} a ${curso.fecha_fin}` : 'Sin definir'}
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex justify-center gap-2">
                            <Button variant="secondary" size="sm" onClick={() => handleEdit(curso)}>
                              Editar
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => handleDelete(curso.id)}>
                              Eliminar
                            </Button>
                         </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

    </div>
  );
};

export default Cursos;
