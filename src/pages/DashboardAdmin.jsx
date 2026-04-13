import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Card, CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { getUsuariosGrl, crearUsuarioAdmin, eliminarUsuarioAdmin } from '../services/adminService';
import { getCursos } from '../services/cursosService';

const DashboardAdmin = () => {
  const { user } = useAuth();
  
  const [usuarios, setUsuarios] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Tabs
  const [activeTab, setActiveTab] = useState('usuarios'); // 'usuarios' | 'cursos'

  // Modal Crear Usuario
  const [showModalCrear, setShowModalCrear] = useState(false);
  const [formUsuario, setFormUsuario] = useState({
     email: '',
     password: '',
     nombreCompleto: '',
     rol: 'estudiante'
  });

  useEffect(() => {
     cargarData();
  }, []);

  const cargarData = async () => {
      setLoading(true);
      const [resUsers, resCursos] = await Promise.all([
          getUsuariosGrl(),
          getCursos()
      ]);
      if (resUsers.data) setUsuarios(resUsers.data);
      if (resCursos.data) setCursos(resCursos.data);
      setLoading(false);
  };

  const handeCrearUsuario = async (e) => {
      e.preventDefault();
      const { error } = await crearUsuarioAdmin(formUsuario);
      if (error) {
          alert('Error creando al usuario: ' + error.message);
      } else {
          setShowModalCrear(false);
          setFormUsuario({ email: '', password: '', nombreCompleto: '', rol: 'estudiante' });
          cargarData();
      }
  };

  const handleEliminarUsuario = async (userId) => {
      if (!window.confirm('¿Estás seguro de ELIMINAR permanentemente a este usuario y todos sus datos del sistema?')) return;
      
      const { error } = await eliminarUsuarioAdmin(userId);
      if (error) {
          alert('No se pudo eliminar: ' + error.message);
      } else {
          cargarData();
      }
  };

  if (loading) {
     return <div className="p-8 text-center text-slate-500 animate-pulse font-bold">Cargando métricas y cuentas...</div>
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto py-6">
      
      {/* HEADER PRINCIPAL */}
      <div className="bg-slate-900 dark:bg-black rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
           <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-500/20 text-primary-300 rounded-full text-xs font-bold uppercase tracking-wider mb-3 border border-primary-500/30">
              <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse"></span>
              Nivel de Acceso: Dios (Sin Restricciones)
           </div>
           <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Centro de Mando General</h1>
           <p className="text-slate-400 mt-2 text-sm sm:text-base max-w-xl">
             Gestión holística del Sistema LMS. Administra matrículas de roles, purga de usuarios activos y catálogo educativo raíz.
           </p>
        </div>
        {/* Decoración abstracta de fondo */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute right-10 -bottom-20 w-48 h-48 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      </div>

      {/* MÉTRICAS RÁPIDAS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <Card className="border-t-4 border-t-primary-500">
            <CardBody className="p-4 text-center">
               <div className="text-3xl font-black text-slate-800 dark:text-white">{usuarios.length}</div>
               <div className="text-xs uppercase font-bold text-slate-500">Usuarios Totales</div>
            </CardBody>
         </Card>
         <Card className="border-t-4 border-t-indigo-500">
            <CardBody className="p-4 text-center">
               <div className="text-3xl font-black text-slate-800 dark:text-white">
                  {usuarios.filter(u => u.roles?.nombre === 'docente').length}
               </div>
               <div className="text-xs uppercase font-bold text-slate-500">Docentes</div>
            </CardBody>
         </Card>
         <Card className="border-t-4 border-t-emerald-500">
            <CardBody className="p-4 text-center">
               <div className="text-3xl font-black text-slate-800 dark:text-white">
                  {usuarios.filter(u => u.roles?.nombre === 'estudiante').length}
               </div>
               <div className="text-xs uppercase font-bold text-slate-500">Estudiantes</div>
            </CardBody>
         </Card>
         <Card className="border-t-4 border-t-amber-500">
            <CardBody className="p-4 text-center">
               <div className="text-3xl font-black text-slate-800 dark:text-white">{cursos.length}</div>
               <div className="text-xs uppercase font-bold text-slate-500">Cursos Registrados</div>
            </CardBody>
         </Card>
      </div>

      {/* CONTROLES DE PESTAÑAS */}
      <div className="flex border-b border-slate-200 dark:border-dark-border mt-8">
         <button 
           className={`px-6 py-3 font-bold text-sm tracking-wide ${activeTab === 'usuarios' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
           onClick={() => setActiveTab('usuarios')}
         >
            Listado de Usuarios ({usuarios.length})
         </button>
         <button 
           className={`px-6 py-3 font-bold text-sm tracking-wide ${activeTab === 'cursos' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
           onClick={() => setActiveTab('cursos')}
         >
            Directorio de Cursos ({cursos.length})
         </button>
      </div>

      {/* TAB: USUARIOS */}
      {activeTab === 'usuarios' && (
         <div className="animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-bold text-slate-800 dark:text-white">Control de Accesos Autorizados</h2>
               <Button onClick={() => setShowModalCrear(true)} variant="primary">+ Crear Usuario</Button>
            </div>
            
            <Card className="overflow-hidden">
               <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                     <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-dark-border text-xs uppercase tracking-wider text-slate-500">
                           <th className="p-4 font-bold">Identidad</th>
                           <th className="p-4 font-bold">Rol Asignado</th>
                           <th className="p-4 font-bold">Estado</th>
                           <th className="p-4 font-bold text-right">Acciones Peligrosas</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                        {usuarios.map(u => (
                           <tr key={u.user_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                              <td className="p-4">
                                 <div className="font-bold text-slate-800 dark:text-slate-200">{u.nombre_completo}</div>
                                 <div className="text-xs text-slate-400 font-mono mt-0.5">{u.user_id?.split('-')[0]}***</div>
                              </td>
                              <td className="p-4">
                                 <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase ${
                                    u.roles?.nombre === 'administrador' ? 'bg-red-100 text-red-700' :
                                    u.roles?.nombre === 'docente' ? 'bg-indigo-100 text-indigo-700' :
                                    'bg-emerald-100 text-emerald-700'
                                 }`}>
                                    {u.roles?.nombre}
                                 </span>
                              </td>
                              <td className="p-4">
                                 <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Activo</span>
                              </td>
                              <td className="p-4 text-right">
                                 <Button 
                                   variant="danger" 
                                   size="sm"
                                   onClick={() => handleEliminarUsuario(u.user_id)}
                                   disabled={user?.id === u.user_id} // No se auto-elimine
                                 >
                                    Eliminar
                                 </Button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </Card>
         </div>
      )}

      {/* TAB: CURSOS */}
      {activeTab === 'cursos' && (
         <div className="animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-bold text-slate-800 dark:text-white">Panóptico de Cursos</h2>
               <Link to="/cursos">
                  <Button variant="secondary">Abrir Gestor de Cursos Detallado ↗</Button>
               </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {cursos.map(c => (
                  <Card key={c.id} className="hover:shadow-md transition-shadow flex flex-col justify-between">
                     <CardBody>
                        <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-2 uppercase tracking-wide">
                           {c.categorias_cursos?.nombre || 'General'}
                        </div>
                        <h3 className="text-lg font-extrabold text-slate-800 dark:text-white leading-tight mb-2">{c.titulo}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3">{c.descripcion}</p>
                     </CardBody>
                     <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-dark-border text-xs text-slate-500 flex justify-between items-center">
                        <div>
                           Impartido por <strong className="text-slate-700 dark:text-slate-300">{c.perfiles_usuarios?.nombre_completo || 'N/A'}</strong>
                        </div>
                        <Link to={`/cursos/${c.id}`} className="font-bold text-primary-600 hover:text-primary-800 underline">Auditar →</Link>
                     </div>
                  </Card>
               ))}
            </div>
         </div>
      )}

      {/* MODAL CREAR USUARIO */}
      {showModalCrear && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95">
               <CardBody className="p-6">
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="text-lg font-bold text-slate-800 dark:text-white">Registrar Identidad (Omitiendo Correo)</h3>
                     <button onClick={() => setShowModalCrear(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                  </div>
                  
                  <form onSubmit={handeCrearUsuario} className="space-y-4">
                     <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre Real</label>
                        <Input required className="w-full" value={formUsuario.nombreCompleto} onChange={e=>setFormUsuario({...formUsuario, nombreCompleto: e.target.value})} />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Correo Electrónico Ficticio/Real</label>
                        <Input required type="email" className="w-full" value={formUsuario.email} onChange={e=>setFormUsuario({...formUsuario, email: e.target.value})} />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Contraseña Arbitraria</label>
                        <Input required type="password" minLength={6} className="w-full" value={formUsuario.password} onChange={e=>setFormUsuario({...formUsuario, password: e.target.value})} />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nivel de Privilegios</label>
                        <select 
                          className="w-full px-4 py-2 bg-slate-50 dark:bg-dark-bg border border-slate-300 dark:border-dark-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          value={formUsuario.rol}
                          onChange={e=>setFormUsuario({...formUsuario, rol: e.target.value})}
                        >
                           <option value="estudiante">Estudiante Regular</option>
                           <option value="docente">Docente Titular</option>
                           <option value="administrador">Administrador del Sistema</option>
                        </select>
                     </div>
                     
                     <div className="pt-4 flex gap-3">
                        <Button type="button" variant="outline" className="flex-1" onClick={() => setShowModalCrear(false)}>Cancelar</Button>
                        <Button type="submit" variant="primary" className="flex-1">Materializar Identidad</Button>
                     </div>
                  </form>
               </CardBody>
            </Card>
         </div>
      )}

    </div>
  );
};

export default DashboardAdmin;
