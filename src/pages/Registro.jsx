/**
 * Registro.jsx — ruta /registro
 * Redirige al usuario a /login#register ya que el Login unificado
 * incluye el tab de registro. Se mantiene este archivo para compatibilidad
 * con la ruta definida en App.js.
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Registro = () => {
  const navigate = useNavigate();

  // Redirigir inmediatamente al login — el tab "Crear cuenta"
  // está integrado directamente en Login.jsx
  useEffect(() => {
    navigate('/login', { replace: true });
  }, [navigate]);

  return null;
};

export default Registro;
