import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';

const VerificarEmail = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  
  // Si no hay usuario ni a medias, lo regresamos al login
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (user?.email_confirmed_at) {
      // Si ya entró y mágicamente ya está verificado
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const showFeedback = (type, text) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback({ type: '', text: '' }), 6000);
  };

  const handleResend = async () => {
    if (!user?.email) return;
    setLoading(true);
    setFeedback({ type: '', text: '' });
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: window.location.origin + '/dashboard',
        }
      });
      
      if (error) {
        // Many times Supabase limits resends (rate limit)
        if (error.message.includes("rate limit")) {
          showFeedback('error', 'Debes esperar un par de minutos antes de pedir otro correo.');
        } else {
          showFeedback('error', error.message);
        }
      } else {
        showFeedback('success', '📧 ¡Correo de verificación enviado! Revisa tu bandeja de entrada o spam.');
      }
    } catch (err) {
      showFeedback('error', 'Ocurrió un error inesperado al contactar al servidor.');
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    // Forzar el repintado de sesión
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.email_confirmed_at) {
      // Si la ventana no navegó automáticamente por culpa de pestañas, forzamos redirección manual
      window.location.href = '/dashboard';
    } else {
      showFeedback('error', 'Tu cuenta aún no aparece como verificada. Sigue las instrucciones del e-mail.');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans transition-colors duration-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center flex-col items-center">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl mb-4 shadow-inner">
            ✉️
          </div>
          <h2 className="text-center text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Verifica tu correo
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
            Enviamos un enlace de confirmación a <br/>
            <span className="font-bold text-slate-800 dark:text-slate-200">{user?.email}</span>
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-800 py-8 px-4 shadow-xl shadow-slate-200/40 dark:shadow-none sm:rounded-2xl sm:px-10 border border-slate-100 dark:border-slate-700/50">
          
          <div className="space-y-6">
            <div className="text-sm text-slate-600 dark:text-slate-300 text-center leading-relaxed">
              Debes confirmar tu identidad para habilitar tu cuenta en Sapientia y poder gestionar o inscribirte a cursos.
            </div>

            {feedback.text && (
              <Alert type={feedback.type}>{feedback.text}</Alert>
            )}

            <div className="flex flex-col gap-3">
              <Button 
                variant="primary" 
                onClick={handleResend}
                isLoading={loading}
                className="w-full justify-center shadow-lg shadow-primary-500/30"
              >
                Reenviar e-mail de verificación
              </Button>
              <Button 
                variant="secondary" 
                onClick={checkStatus}
                className="w-full justify-center"
              >
                Ya verifiqué, continuar
              </Button>
            </div>
            
            <div className="border-t border-slate-100 dark:border-slate-700 pt-5 text-center mt-2">
               <button 
                  onClick={handleLogout}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                >
                  Cerrar sesión e intentar con otra cuenta
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificarEmail;
