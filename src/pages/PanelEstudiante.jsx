import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCursosInscritos, inscribirCurso } from '../services/inscripcionesService';
import { getCursos } from '../services/cursosService';
import DashboardInsights from '../components/DashboardInsights';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';

const PanelEstudiante = () => {
  const { user, perfil } = useAuth();
  const [misCursos, setMisCursos] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // Disparar las consultas cuando el perfil real ya se haya cargado desde el Contexto
  useEffect(() => {
    if (perfil && perfil.id) {
      cargarTablero();
    }
  }, [perfil]);

  const cargarTablero = async () => {
    // 1. Obtener el portafolio personal del alumno
    const { data: inscritosConfig } = await getCursosInscritos(perfil.id);
    const identificadoresInscritos = [];
    
    if (inscritosConfig) {
      setMisCursos(inscritosConfig);
      // Recoletar solo los IDs de los cursos para el filtrado visual posterior
      inscritosConfig.forEach(insc => {
         if (insc.cursos?.id) identificadoresInscritos.push(insc.cursos.id);
      });
    }

    // 2. Obtener el catalogo visual y quitar los cursos que ya se encuentran bajo la tutela
    const { data: todosCursos } = await getCursos();
    if (todosCursos) {
      const disponibles = todosCursos.filter(c => c.estado !== 'eliminado' && !identificadoresInscritos.includes(c.id));
      setCatalogo(disponibles);
    }
  };

  const handleInscribirse = async (cursoId) => {
    setMensaje({ tipo: '', texto: '' });
    
    // El estudianteId real transaccional es el perfil.id (UUID de perfiles_usuarios)
    const { error } = await inscribirCurso(cursoId, perfil.id);
    
    if (error) {
       // El constraint Postgres es el UNIQUE de curso_id e estudiante_id dictando el código 23505
      if (error.code === '23505') {
        setMensaje({ tipo: 'error', texto: 'Ya te encuentras inscrito en este curso previamente.' });
      } else {
        setMensaje({ tipo: 'error', texto: 'Ocurrió un error al intentar la matriculación.' });
        console.error(error);
      }
    } else {
      setMensaje({ tipo: 'success', texto: '¡Inscripción académica exitosa! El curso ahora se mostrará en tu progreso.' });
      cargarTablero(); // Limpiar catálogo y renderizar progreso
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Campus Virtual del Estudiante</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Analizando sesión como: <strong className="text-primary-600 dark:text-primary-400">{perfil?.nombre_completo || user?.email}</strong>
        </p>
      </div>

      {/* DASHBOARD DE MÉTRICAS */}
      <DashboardInsights />

      {/* Manejo de Alertas */}
      {mensaje.texto && (
        <Alert type={mensaje.tipo} className="mb-6">
          {mensaje.texto}
        </Alert>
      )}

      {/* Tablero: Mis Cursos Inscritos */}
      <section>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Mis Entornos de Estudio</h2>
        {misCursos.length === 0 ? (
          <div className="bg-white dark:bg-dark-card border border-dashed border-slate-300 dark:border-dark-border rounded-xl p-8 text-center text-slate-500 dark:text-slate-400">
            Aún no te has inscrito a ningún curso, revisa el catálogo inferior.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {misCursos.map((inscripcion) => {
              const curso = inscripcion.cursos;
              if (!curso) return null; // Resguardo logico
              return (
                <Card key={inscripcion.id} className="hover:shadow-md transition-shadow group">
                  {curso.imagen_url && (
                    <div className="h-40 overflow-hidden border-b border-slate-100 dark:border-dark-border">
                      <img 
                        src={curso.imagen_url} 
                        alt="Portada" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                    </div>
                  )}
                  <CardBody className="p-5 flex flex-col h-full">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 line-clamp-2">{curso.titulo}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 pb-4 border-b border-slate-100 dark:border-dark-border">
                      Inscrito el: {new Date(inscripcion.fecha_inscripcion).toLocaleDateString()}
                    </p>
                    
                    <div className="mt-auto pt-2">
                       {/* El botón podría llevar a un Link de react router al ambiente de tareas */}
                       <Button variant="primary" className="w-full">
                         Abrir Aula Virtual
                       </Button>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Tablero: Oferta Educativa Restante */}
      <section>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Catálogo Institucional</h2>
        {catalogo.length === 0 ? (
          <div className="bg-white dark:bg-dark-card border border-dashed border-slate-300 dark:border-dark-border rounded-xl p-8 text-center text-slate-500 dark:text-slate-400">
            No hay nuevos cursos disponibles para tu perfil.
          </div>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-dark-bg border-b border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-300 text-sm font-semibold">
                    <th className="px-6 py-4">Materia Académica</th>
                    <th className="px-6 py-4">Categoría Referencial</th>
                    <th className="px-6 py-4 text-center">Validar Matrícula</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                  {catalogo.map(curso => (
                    <tr key={curso.id} className="hover:bg-slate-50/50 dark:hover:bg-dark-bg/50 transition-colors">
                      <td className="px-6 py-4">
                         <strong className="text-slate-800 dark:text-white block mb-1">{curso.titulo}</strong>
                         <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{curso.descripcion}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {curso.categorias_cursos?.nombre || 'Clasificación pendiente'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button 
                          variant="secondary"
                          onClick={() => handleInscribirse(curso.id)}
                        >
                          + Inscribirme Gratis
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>
    </div>
  );
};

export default PanelEstudiante;
