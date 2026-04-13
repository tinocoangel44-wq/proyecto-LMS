import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signIn, signInWithMagicLink } from '../services/auth';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    const { error } = await signIn(email, password);
    if (error) {
      setErrorMsg('Credenciales incorrectas, usuario inexistente o cuenta sin verificar.');
      setLoading(false);
    } else {
      navigate('/');
    }
  };

  const handleMagicLink = async () => {
    if (!email) { setErrorMsg('Ingresa tu correo electrónico primero.'); return; }
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    const { error } = await signInWithMagicLink(email);
    if (error) {
      setErrorMsg('Error enviando el enlace: ' + error.message);
    } else {
      setSuccessMsg('¡Enlace enviado! Revisa tu bandeja de entrada o spam.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      {/* Orbes decorativos */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary-500 rounded-full opacity-5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500 rounded-full opacity-5 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md animate-scale-in">
        {/* Card principal */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-glass-dark">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4 shadow-glow">
              <svg className="w-9 h-9 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
                <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-black text-white">Sapienta LMS</h1>
            <p className="text-sm text-white/50 mt-1">Inicia sesión para continuar</p>
          </div>

          {errorMsg && <Alert type="error" className="mb-5 bg-red-900/20 border-red-800/50 text-red-300">{errorMsg}</Alert>}
          {successMsg && <Alert type="success" className="mb-5 bg-emerald-900/20 border-emerald-800/50 text-emerald-300">{successMsg}</Alert>}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-1.5">Correo electrónico</label>
              <input
                type="email"
                required
                disabled={loading}
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="usuario@sapienta.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-1.5">Contraseña</label>
              <input
                type="password"
                disabled={loading}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="pt-2 space-y-3">
              <Button
                type="submit"
                variant="primary"
                isLoading={loading}
                disabled={loading || !password}
                className="w-full py-3 text-sm font-bold shadow-lg shadow-primary-900/40"
              >
                Iniciar sesión
              </Button>

              <button
                type="button"
                onClick={handleMagicLink}
                disabled={loading || !email}
                className="w-full py-3 text-sm font-semibold text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all disabled:opacity-40"
              >
                ✉️ Enviar enlace mágico
              </button>
            </div>
          </form>

          <p className="text-center mt-7 text-sm text-white/40">
            ¿Eres nuevo?{' '}
            <Link to="/registro" className="text-primary-400 hover:text-primary-300 font-semibold hover:underline transition-colors">
              Crear cuenta
            </Link>
          </p>
        </div>

        <p className="text-center mt-6 text-xs text-white/20">© 2026 Sapienta LMS · Todos los derechos reservados</p>
      </div>
    </div>
  );
};

export default Login;
