import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser, getRoles } from '../services/auth';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';

const ROLE_ICONS = { estudiante: '🎒', docente: '👨‍🏫', administrador: '🔑' };
const ROLE_DESC  = { estudiante: 'Cursos y tareas', docente: 'Administración de cátedra', administrador: 'Control total' };

const Registro = () => {
  const [rolesDisponibles, setRolesDisponibles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { cargarRoles(); }, []);

  const cargarRoles = async () => {
    const { data } = await getRoles();
    if (data) setRolesDisponibles(data.filter(r => ['estudiante', 'docente'].includes(r.nombre)));
  };

  const handleRegistro = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!selectedRole) { setErrorMsg('Selecciona tu tipo de perfil institucional.'); return; }
    setLoading(true);
    const { error } = await registerUser(email, password, nombre, selectedRole);
    if (error) {
      setErrorMsg(error.message || 'Error al registrar la cuenta.');
      setLoading(false);
    } else {
      alert('¡Cuenta creada! Revisa tu correo para verificar e iniciar sesión.');
      navigate('/login');
    }
  };

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all";
  const labelClass = "block text-xs font-bold uppercase tracking-wider text-white/50 mb-1.5";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4 py-12">
      <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-violet-500 rounded-full opacity-5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-72 h-72 bg-primary-500 rounded-full opacity-5 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-lg animate-scale-in">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-glass-dark">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-primary mb-3">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
                <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-black text-white">Crear cuenta</h1>
            <p className="text-sm text-white/50 mt-1">Únete a la plataforma educativa</p>
          </div>

          {errorMsg && <Alert type="error" className="mb-5 bg-red-900/20 border-red-800/50 text-red-300">{errorMsg}</Alert>}

          <form onSubmit={handleRegistro} className="space-y-5">
            {/* Selección de rol */}
            <div>
              <label className={labelClass}>¿Quién eres?</label>
              <div className="grid grid-cols-2 gap-3">
                {rolesDisponibles.map(rol => (
                  <button
                    key={rol.id}
                    type="button"
                    onClick={() => setSelectedRole(rol.id)}
                    className={`rounded-xl border-2 p-4 text-center transition-all duration-200 ${
                      selectedRole === rol.id
                        ? 'border-primary-500 bg-primary-500/20 shadow-glow'
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-3xl mb-1.5">{ROLE_ICONS[rol.nombre] || '👤'}</div>
                    <h4 className={`font-bold capitalize text-sm ${selectedRole === rol.id ? 'text-primary-300' : 'text-white/70'}`}>
                      {rol.nombre}
                    </h4>
                    <p className="text-[10px] text-white/40 mt-0.5">{ROLE_DESC[rol.nombre]}</p>
                  </button>
                ))}
                {rolesDisponibles.length === 0 && (
                  <div className="col-span-2 text-center text-xs text-white/30 py-6 border border-dashed border-white/10 rounded-xl">
                    Cargando perfiles…
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-white/10" />

            {/* Campos */}
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Nombre completo</label>
                <input type="text" required disabled={loading} value={nombre}
                  onChange={e => setNombre(e.target.value)} placeholder="Tu nombre completo" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Correo institucional</label>
                <input type="email" required disabled={loading} value={email}
                  onChange={e => setEmail(e.target.value)} placeholder="usuario@sapienta.com" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Contraseña</label>
                <input type="password" required disabled={loading} value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" minLength="6"
                  className={inputClass} />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3 text-sm font-bold shadow-lg shadow-primary-900/40 mt-2"
              isLoading={loading}
              disabled={rolesDisponibles.length === 0}
            >
              Completar registro
            </Button>
          </form>

          <p className="text-center mt-6 text-sm text-white/40">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-semibold hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Registro;
