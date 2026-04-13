import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signIn, signInWithMagicLink } from '../services/auth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardBody } from '../components/ui/Card';
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
       setErrorMsg("Credenciales incorrectas, usuario inexistente o cuenta sin verificar.");
       setLoading(false);
    } else {
       navigate('/');
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      setErrorMsg("Por favor, ingresa tu correo electrónico primero.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const { error } = await signInWithMagicLink(email);
    if (error) {
       setErrorMsg("Error enviando el enlace de acceso: " + error.message);
    } else {
       setSuccessMsg("Enlace de acceso enviado! Revisa tu bandeja de entrada o spam para acceder mágicamente.");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-slate-50 dark:bg-dark-bg transition-colors duration-300 p-4">
      <Card className="w-full max-w-md shadow-lg dark:shadow-none">
        <CardBody className="p-8">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🎓</div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Portal LMS</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Inicia sesión para continuar</p>
          </div>

          {errorMsg && <Alert type="error" className="mb-6">{errorMsg}</Alert>}
          {successMsg && <Alert type="success" className="mb-6">{successMsg}</Alert>}

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <Input 
              label="CORREO ELECTRÓNICO"
              type="email" 
              required 
              disabled={loading}
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="alumno@instituto.edu"
            />
            
            <Input 
              label="CONTRASEÑA (Opcional si usas Enlace Mágico)"
              type="password" 
              disabled={loading}
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="••••••••"
            />

            <div className="flex flex-col gap-3 mt-4">
              <Button type="submit" variant="primary" isLoading={loading} disabled={loading || !password}>
                Acceder con Contraseña
              </Button>

              <Button type="button" variant="outline" onClick={handleMagicLink} isLoading={loading} disabled={loading || !email}>
                Enviar enlace a mi correo
              </Button>
            </div>
          </form>

          <div className="text-center mt-8 text-sm text-slate-500 dark:text-slate-400">
            ¿Eres de nuevo ingreso?{' '}
            <Link to="/registro" className="text-primary-600 dark:text-primary-400 font-bold hover:underline">
              Crear cuenta
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default Login;
