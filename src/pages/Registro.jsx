import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser, getRoles } from '../services/auth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardBody } from '../components/ui/Card';
import Alert from '../components/ui/Alert';

const Registro = () => {
  const [rolesDisponibles, setRolesDisponibles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    cargarRoles();
  }, []);

  const cargarRoles = async () => {
    const { data } = await getRoles();
    if (data) {
       setRolesDisponibles(data);
    }
  };

  const handleRegistro = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validador de selector
    if (!selectedRole) {
       setErrorMsg("Por favor, selecciona tu tipo de perfil institucional (Estudiante o Docente) en las tarjetas superiores.");
       return;
    }

    setLoading(true);

    const { error } = await registerUser(email, password, nombre, selectedRole);
    
    if (error) {
       setErrorMsg(error.message || "Error al registrar la cuenta.");
       setLoading(false);
    } else {
       alert("¡Cuenta creada exitosamente! Revisa tu bandeja de correo (o Spam) para verificar e iniciar sesión.");
       navigate('/login');
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-slate-50 dark:bg-dark-bg transition-colors duration-300 p-4 py-12">
      <Card className="w-full max-w-lg shadow-lg dark:shadow-none">
        <CardBody className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Únete a la Plataforma Educativa</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Configura tu perfil institucional</p>
          </div>

          {errorMsg && <Alert type="error" className="mb-6">{errorMsg}</Alert>}

          <form onSubmit={handleRegistro} className="flex flex-col gap-6">
            
            {/* Selección de Rol Visual */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                ¿QUIÉN ERES?
              </label>
              <div className="grid grid-cols-2 gap-4">
                 {rolesDisponibles.map(rol => (
                    <div 
                      key={rol.id}
                      onClick={() => setSelectedRole(rol.id)}
                      className={`cursor-pointer rounded-xl border-2 p-4 text-center transition-all duration-200 ${
                        selectedRole === rol.id 
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-sm' 
                          : 'border-slate-200 dark:border-dark-border hover:border-primary-300 hover:bg-slate-50 dark:hover:bg-dark-bg'
                      }`}
                    >
                      <div className="text-3xl mb-2">{rol.nombre === 'estudiante' ? '🎒' : '👨‍🏫'}</div>
                      <h4 className={`font-bold capitalize ${selectedRole === rol.id ? 'text-primary-700 dark:text-primary-400' : 'text-slate-700 dark:text-slate-300'}`}>
                        {rol.nombre}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                        {rol.nombre === 'estudiante' ? 'Cursos y Tareas' : 'Administración'}
                      </p>
                    </div>
                 ))}
                 {rolesDisponibles.length === 0 && (
                   <div className="col-span-2 text-center text-sm text-slate-500 p-4 border border-dashed rounded-xl">
                      Cargando perfiles institucionales...
                   </div>
                 )}
              </div>
            </div>

            <hr className="border-slate-200 dark:border-dark-border" />

            <div className="space-y-4">
              <Input 
                label="NOMBRE COMPLETO"
                type="text" 
                required 
                disabled={loading}
                value={nombre} 
                onChange={e => setNombre(e.target.value)} 
                placeholder="Marlon Brando"
              />
              
              <Input 
                label="CORREO ELECTRÓNICO"
                type="email" 
                required 
                disabled={loading}
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="usuario@instituto.edu"
              />
              
              <Input 
                label="CREA UNA CONTRASEÑA"
                type="password" 
                required 
                disabled={loading}
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="Mínimo 6 caracteres"
                minLength="6"
              />
            </div>

            <Button type="submit" variant="primary" className="w-full mt-2" isLoading={loading} disabled={rolesDisponibles.length === 0}>
              Completar Registro Institucional
            </Button>
          </form>

          <div className="text-center mt-8 text-sm text-slate-500 dark:text-slate-400">
             ¿Ya estás matriculado?{' '}
             <Link to="/login" className="text-primary-600 dark:text-primary-400 font-bold hover:underline">
               Inicia Sesión aquí
             </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default Registro;
