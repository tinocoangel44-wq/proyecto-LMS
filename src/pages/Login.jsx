import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn, registerStudent, signInWithGoogle } from '../services/auth';
import { supabase } from '../services/supabase';

/* ══════════════════════════════════════════════
   Íconos SVG inline — sin dependencias externas
   ══════════════════════════════════════════════ */
const IC = {
  Mail: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Lock: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  User: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-4 7a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  EyeOn: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  EyeOff: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ),
  Spinner: () => (
    <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  ),
  Check: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  Alert: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Google: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  ),
  GraduationCap: () => (
    <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" />
    </svg>
  ),
  Shield: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
};

/* ══════════════════════════════════════════════
   Mensajes de feedback
   ══════════════════════════════════════════════ */
const ErrorMsg = ({ children }) => (
  <div style={{
    display:'flex', alignItems:'flex-start', gap:'0.625rem',
    borderRadius:'0.75rem', padding:'0.75rem 1rem',
    fontSize:'0.875rem', color:'#b91c1c',
    background:'#fef2f2', border:'1px solid #fecaca',
    animation:'authSlideDown 0.2s ease-out both',
  }}>
    <IC.Alert />
    <span>{children}</span>
  </div>
);

const SuccessMsg = ({ children }) => (
  <div style={{
    display:'flex', alignItems:'flex-start', gap:'0.625rem',
    borderRadius:'0.75rem', padding:'0.75rem 1rem',
    fontSize:'0.875rem', color:'#065f46',
    background:'#ecfdf5', border:'1px solid #a7f3d0',
    animation:'authSlideDown 0.2s ease-out both',
  }}>
    <IC.Check />
    <span>{children}</span>
  </div>
);

/* ══════════════════════════════════════════════
   Password Strength Bar
   ══════════════════════════════════════════════ */
const PasswordStrength = ({ password }) => {
  if (!password) return null;
  const checks = [
    password.length >= 6,
    password.length >= 8,
    /[A-Z0-9]/.test(password),
    /[!@#$%^&*]/.test(password),
  ];
  const strength = checks.filter(Boolean).length;
  const colors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e'];
  const labels = ['', 'Muy débil', 'Débil', 'Segura', 'Muy segura'];
  return (
    <div style={{ marginTop:'0.5rem' }}>
      <div style={{ display:'flex', gap:'4px', marginBottom:'4px' }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{
            flex:1, height:'4px', borderRadius:'9999px',
            background: i <= strength ? colors[strength] : '#e2e8f0',
            transition:'background 0.3s',
          }} />
        ))}
      </div>
      <p style={{ fontSize:'0.75rem', color: strength > 0 ? colors[strength] : '#94a3b8' }}>
        {labels[strength]}
      </p>
    </div>
  );
};

/* ══════════════════════════════════════════════
   Forgot Password
   ══════════════════════════════════════════════ */
const ForgotPassword = ({ onBack }) => {
  const [email,   setEmail]   = useState('');
  const [msg,     setMsg]     = useState('');
  const [err,     setErr]     = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setMsg(''); setErr('');
    if (!email.trim()) { setErr('Ingresa tu correo electrónico.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) setErr('No pudimos enviar el correo. Verifica que sea correcto.');
    else       setMsg('¡Enlace enviado! Revisa tu bandeja de entrada o la carpeta de spam.');
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
      <div>
        <h2 style={{ fontSize:'1.125rem', fontWeight:700, color:'#0f172a', margin:0 }}>
          Recuperar contraseña
        </h2>
        <p style={{ fontSize:'0.875rem', color:'#64748b', marginTop:'0.25rem' }}>
          Ingresa tu correo y te enviaremos un enlace para restablecerla.
        </p>
      </div>
      {err && <ErrorMsg>{err}</ErrorMsg>}
      {msg && <SuccessMsg>{msg}</SuccessMsg>}
      <form onSubmit={handle} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
        <div>
          <label htmlFor="forgot-email" className="lf-label">Correo electrónico</label>
          <div className="lf-wrap">
            <span className="lf-icon"><IC.Mail /></span>
            <input id="forgot-email" type="email" required disabled={loading}
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="usuario@sapientia.com" className="lf-input" />
          </div>
        </div>
        <button type="submit" disabled={loading} className="lf-btn-primary">
          {loading
            ? <span style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}><IC.Spinner /> Enviando…</span>
            : 'Enviar enlace de recuperación'}
        </button>
      </form>
      <button onClick={onBack}
        style={{ background:'none', border:'none', cursor:'pointer', fontSize:'0.875rem', color:'#94a3b8', padding:'0.25rem 0' }}
        onMouseEnter={e => e.target.style.color='#475569'}
        onMouseLeave={e => e.target.style.color='#94a3b8'}>
        ← Volver al inicio de sesión
      </button>
    </div>
  );
};

/* ══════════════════════════════════════════════
   COMPONENTE PRINCIPAL — LOGIN
   ══════════════════════════════════════════════ */
const Login = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('login');

  /* —— Login —— */
  const [loginEmail,    setLoginEmail]    = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPwd,       setShowPwd]       = useState(false);
  const [loginError,    setLoginError]    = useState('');
  const [loginLoading,  setLoginLoading]  = useState(false);

  /* —— Google OAuth —— */
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError,   setGoogleError]   = useState('');

  /* —— Registro —— */
  const [regNombre,  setRegNombre]  = useState('');
  const [regEmail,   setRegEmail]   = useState('');
  const [regPwd,     setRegPwd]     = useState('');
  const [regPwdConf, setRegPwdConf] = useState('');
  const [showRegPwd, setShowRegPwd] = useState(false);
  const [regError,   setRegError]   = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  const switchTab = (t) => {
    setTab(t);
    setLoginError(''); setRegError(''); setRegSuccess('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!loginEmail.trim())  { setLoginError('El correo electrónico es obligatorio.'); return; }
    if (!loginPassword)      { setLoginError('La contraseña es obligatoria.'); return; }
    setLoginLoading(true);
    const { error } = await signIn(loginEmail.trim(), loginPassword);
    setLoginLoading(false);
    if (error) {
      setLoginError('Credenciales incorrectas o cuenta sin verificar. Revisa tus datos.');
    } else {
      navigate('/');
    }
  };

  /**
   * Inicia el flujo OAuth con Google.
   * Después del redirect, Supabase llama a onAuthStateChange(SIGNED_IN)
   * y AuthContext creará el perfil automáticamente si es la primera vez.
   */
  const handleGoogle = async () => {
    if (googleLoading) return;
    setGoogleError('');
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setGoogleError('No se pudo conectar con Google. Inténtalo de nuevo.');
        setGoogleLoading(false);
      }
      // Si no hay error, el navegador redirigirá a Google → no resetear loading
    } catch {
      setGoogleError('Error inesperado al conectar con Google.');
      setGoogleLoading(false);
    }
  };

  const handleRegistro = async (e) => {
    e.preventDefault();
    setRegError(''); setRegSuccess('');
    if (!regNombre.trim())       { setRegError('El nombre completo es obligatorio.'); return; }
    if (!regEmail.trim())        { setRegError('El correo institucional es obligatorio.'); return; }
    if (!regEmail.includes('@')) { setRegError('Ingresa un correo electrónico válido.'); return; }
    if (regPwd.length < 6)       { setRegError('La contraseña debe tener al menos 6 caracteres.'); return; }
    if (regPwd !== regPwdConf)   { setRegError('Las contraseñas no coinciden.'); return; }
    setRegLoading(true);
    const { error } = await registerStudent(regEmail.trim(), regPwd, regNombre.trim());
    setRegLoading(false);
    if (error) {
      setRegError(error.message || 'Error al crear la cuenta. Inténtalo de nuevo.');
    } else {
      setRegSuccess('✅ ¡Tu cuenta ha sido creada como Estudiante! Revisa tu correo para verificarla y luego inicia sesión.');
      setRegNombre(''); setRegEmail(''); setRegPwd(''); setRegPwdConf('');
    }
  };

  /* ─────────────────────────────────────────────── */
  return (
    <>
      {/* ══ CSS completamente aislado del árbol de dark mode ══ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        /* Wrapper raíz: ocupa la ventana, aísla dark mode */
        #sp-root {
          position: fixed;
          inset: 0;
          overflow-y: auto;
          color-scheme: light;
          font-family: 'Inter', sans-serif;
        }

        /* Contenedor de centrado */
        #sp-auth {
          background: #f1f5f9;
          background-image:
            radial-gradient(circle at 20% 35%, rgba(37,99,235,0.07) 0%, transparent 50%),
            radial-gradient(circle at 80% 65%, rgba(99,102,241,0.06) 0%, transparent 50%);
          min-height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2.5rem 1rem;
        }

        /* Card */
        #sp-card {
          background: #ffffff;
          border-radius: 1.25rem;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.09);
          width: 100%;
          max-width: 440px;
          animation: spCardIn 0.4s cubic-bezier(0.34,1.4,0.64,1) both;
        }

        @keyframes spCardIn {
          from { opacity:0; transform: translateY(18px) scale(0.97); }
          to   { opacity:1; transform: translateY(0)    scale(1);    }
        }

        @keyframes authSlideDown {
          from { opacity:0; transform: translateY(-6px); }
          to   { opacity:1; transform: translateY(0); }
        }

        /* Tabs */
        #sp-root .sp-tabs {
          display: flex; background: #f1f5f9;
          border-radius: 0.75rem; padding: 4px; gap: 4px;
        }
        #sp-root .sp-tab {
          flex: 1; padding: 0.55rem 0.5rem;
          font-size: 0.8125rem; font-weight: 600;
          border-radius: 0.5rem; border: none;
          background: transparent; color: #64748b;
          cursor: pointer; transition: all 0.2s; outline: none;
          font-family: 'Inter', sans-serif;
        }
        #sp-root .sp-tab.active {
          background: #fff; color: #1e40af;
          box-shadow: 0 1px 4px rgba(0,0,0,0.10);
        }
        #sp-root .sp-tab:not(.active):hover { color: #334155; }

        /* Fade tab */
        #sp-root .sp-pane { animation: spFade 0.2s ease-out both; }
        @keyframes spFade {
          from { opacity:0; transform: translateY(4px); }
          to   { opacity:1; transform: translateY(0); }
        }

        /* Labels */
        #sp-root .lf-label {
          display: block; font-size: 0.75rem; font-weight: 600;
          letter-spacing: 0.04em; text-transform: uppercase;
          color: #475569; margin-bottom: 0.4rem;
        }

        /* Input wrapper */
        #sp-root .lf-wrap  { position: relative; display: flex; align-items: center; }
        #sp-root .lf-icon  {
          position: absolute; left: 0.875rem; color: #94a3b8;
          pointer-events: none; display: flex; align-items: center;
        }

        /* Input */
        #sp-root .lf-input {
          width: 100%; background: #f8fafc; border: 1.5px solid #e2e8f0;
          border-radius: 0.625rem; padding: 0.7rem 1rem 0.7rem 2.5rem;
          font-size: 0.875rem; color: #0f172a; outline: none;
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
          font-family: 'Inter', sans-serif;
        }
        #sp-root .lf-input::placeholder { color: #94a3b8; }
        #sp-root .lf-input:focus {
          border-color: #2563eb; background: #fff;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
        }
        #sp-root .lf-input:disabled { opacity: 0.55; cursor: not-allowed; }
        #sp-root .lf-input-pr { padding-right: 3rem; }

        /* Botón principal */
        #sp-root .lf-btn-primary {
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          width: 100%; padding: 0.75rem 1.25rem;
          background: #2563eb; color: #fff;
          font-size: 0.875rem; font-weight: 600;
          border-radius: 0.625rem; border: none; cursor: pointer;
          box-shadow: 0 2px 8px rgba(37,99,235,0.25);
          transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
          font-family: 'Inter', sans-serif;
        }
        #sp-root .lf-btn-primary:hover:not(:disabled) {
          background: #1d4ed8; transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(37,99,235,0.35);
        }
        #sp-root .lf-btn-primary:active:not(:disabled) { transform: translateY(0); }
        #sp-root .lf-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

        /* Botón secundario */
        #sp-root .lf-btn-secondary {
          display: flex; align-items: center; justify-content: center; gap: 0.6rem;
          width: 100%; padding: 0.7rem 1.25rem;
          background: #fff; color: #334155;
          font-size: 0.875rem; font-weight: 500;
          border-radius: 0.625rem; border: 1.5px solid #e2e8f0; cursor: pointer;
          transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
          font-family: 'Inter', sans-serif;
        }
        #sp-root .lf-btn-secondary:hover:not(:disabled) {
          background: #f8fafc; border-color: #cbd5e1;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        #sp-root .lf-btn-secondary:disabled { opacity: 0.55; cursor: not-allowed; }

        /* OR divider */
        #sp-root .lf-divider {
          display: flex; align-items: center; gap: 0.75rem;
          color: #94a3b8; font-size: 0.75rem; font-weight: 500;
        }
        #sp-root .lf-divider::before,
        #sp-root .lf-divider::after {
          content:''; flex:1; height:1px; background:#e2e8f0;
        }

        /* Eye button */
        #sp-root .lf-eye {
          position: absolute; right: 0.875rem; color: #94a3b8;
          background: none; border: none; cursor: pointer;
          display: flex; align-items: center; padding: 0;
          transition: color 0.15s;
        }
        #sp-root .lf-eye:hover { color: #475569; }

        /* Badge */
        #sp-root .lf-badge {
          display: inline-flex; align-items: center; gap: 0.375rem;
          padding: 0.3rem 0.75rem; border-radius: 99px;
          font-size: 0.75rem; font-weight: 600;
          color: #1d4ed8; background: #eff6ff; border: 1px solid #bfdbfe;
          font-family: 'Inter', sans-serif;
        }

        /* Copyright */
        #sp-copy {
          margin-top: 1.5rem;
          text-align: center;
          font-size: 0.6875rem;
          color: #94a3b8;
          font-family: 'Inter', sans-serif;
        }

        /* Responsive */
        @media (max-width: 480px) {
          #sp-card  { border-radius: 1rem; }
          #sp-auth  { padding: 1.5rem 0.75rem; justify-content: flex-start; padding-top: 2rem; }
        }
      `}</style>

      {/* ══ Wrapper: position:fixed = centrado 100% garantizado ══ */}
      <div id="sp-root">
        <div id="sp-auth">

          {/* ── Card ── */}
          <div id="sp-card">

            {/* Header / Branding */}
            <div style={{
              padding: '2rem 2rem 1.5rem',
              textAlign: 'center',
              borderBottom: '1px solid #f1f5f9',
            }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '3.25rem', height: '3.25rem', borderRadius: '0.875rem',
                background: 'linear-gradient(135deg,#2563eb,#4f46e5)',
                boxShadow: '0 6px 18px rgba(37,99,235,0.3)',
                marginBottom: '0.875rem',
              }}>
                <IC.GraduationCap />
              </div>
              <h1 style={{ fontSize:'1.5rem', fontWeight:800, color:'#0f172a', margin:0, letterSpacing:'-0.02em' }}>
                Sapientia
              </h1>
              <p style={{ fontSize:'0.8125rem', color:'#64748b', margin:'0.25rem 0 0', fontWeight:500 }}>
                Plataforma de aprendizaje en línea
              </p>
            </div>

            {/* Body */}
            <div style={{ padding: '1.75rem 2rem 2rem' }}>

              {/* TABS */}
              {tab !== 'forgot' && (
                <div className="sp-tabs" style={{ marginBottom:'1.5rem' }}>
                  <button id="tab-login"
                    className={`sp-tab ${tab === 'login' ? 'active' : ''}`}
                    onClick={() => switchTab('login')}>
                    Iniciar sesión
                  </button>
                  <button id="tab-register"
                    className={`sp-tab ${tab === 'register' ? 'active' : ''}`}
                    onClick={() => switchTab('register')}>
                    Crear cuenta
                  </button>
                </div>
              )}

              {/* ─── LOGIN ─── */}
              {tab === 'login' && (
                <form id="login-form" className="sp-pane" onSubmit={handleLogin} noValidate>
                  <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>

                    {loginError && <ErrorMsg>{loginError}</ErrorMsg>}

                    {/* Email */}
                    <div>
                      <label htmlFor="login-email" className="lf-label">Correo electrónico</label>
                      <div className="lf-wrap">
                        <span className="lf-icon"><IC.Mail /></span>
                        <input id="login-email" type="email" autoComplete="email" required
                          disabled={loginLoading} value={loginEmail}
                          onChange={e => setLoginEmail(e.target.value)}
                          placeholder="usuario@sapientia.com"
                          className="lf-input" />
                      </div>
                    </div>

                    {/* Contraseña */}
                    <div>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.4rem' }}>
                        <label htmlFor="login-password" className="lf-label" style={{ margin:0 }}>Contraseña</label>
                        <button type="button" onClick={() => switchTab('forgot')}
                          style={{ fontSize:'0.75rem', fontWeight:600, color:'#2563eb', background:'none', border:'none', cursor:'pointer', padding:0, fontFamily:'Inter,sans-serif' }}>
                          ¿Olvidaste tu contraseña?
                        </button>
                      </div>
                      <div className="lf-wrap">
                        <span className="lf-icon"><IC.Lock /></span>
                        <input id="login-password" type={showPwd ? 'text' : 'password'} autoComplete="current-password"
                          disabled={loginLoading} value={loginPassword}
                          onChange={e => setLoginPassword(e.target.value)}
                          placeholder="••••••••"
                          className="lf-input lf-input-pr" />
                        <button type="button" className="lf-eye" onClick={() => setShowPwd(v => !v)} tabIndex={-1}>
                          {showPwd ? <IC.EyeOff /> : <IC.EyeOn />}
                        </button>
                      </div>
                    </div>

                    <button id="login-submit" type="submit" disabled={loginLoading}
                      className="lf-btn-primary" style={{ marginTop:'0.25rem' }}>
                      {loginLoading
                        ? <span style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}><IC.Spinner /> Iniciando sesión…</span>
                        : 'Iniciar sesión'}
                    </button>

                    <div className="lf-divider">o continúa con</div>

                    {googleError && <ErrorMsg>{googleError}</ErrorMsg>}

                    <button id="login-google" type="button" onClick={handleGoogle}
                      disabled={loginLoading || googleLoading} className="lf-btn-secondary">
                      {googleLoading
                        ? <span style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                            <IC.Spinner /> Redirigiendo a Google…
                          </span>
                        : <><IC.Google /> Continuar con Google</>
                      }
                    </button>

                  </div>

                  <p style={{ textAlign:'center', fontSize:'0.8125rem', color:'#94a3b8', marginTop:'1.25rem', fontFamily:'Inter,sans-serif' }}>
                    ¿No tienes cuenta?{' '}
                    <button type="button" onClick={() => switchTab('register')}
                      style={{ color:'#2563eb', fontWeight:600, background:'none', border:'none', cursor:'pointer', padding:0, fontFamily:'Inter,sans-serif' }}>
                      Regístrate gratis
                    </button>
                  </p>
                </form>
              )}

              {/* ─── REGISTRO ─── */}
              {tab === 'register' && (
                <form id="register-form" className="sp-pane" onSubmit={handleRegistro} noValidate>
                  <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>

                    {regError   && <ErrorMsg>{regError}</ErrorMsg>}
                    {regSuccess && <SuccessMsg>{regSuccess}</SuccessMsg>}

                    <div style={{ display:'flex', justifyContent:'center' }}>
                      <span className="lf-badge">
                        <IC.Shield /> Registro como Estudiante
                      </span>
                    </div>

                    {/* Nombre */}
                    <div>
                      <label htmlFor="reg-nombre" className="lf-label">Nombre completo</label>
                      <div className="lf-wrap">
                        <span className="lf-icon"><IC.User /></span>
                        <input id="reg-nombre" type="text" autoComplete="name" required
                          disabled={regLoading} value={regNombre}
                          onChange={e => setRegNombre(e.target.value)}
                          placeholder="Tu nombre completo"
                          className="lf-input" />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="reg-email" className="lf-label">Correo electrónico</label>
                      <div className="lf-wrap">
                        <span className="lf-icon"><IC.Mail /></span>
                        <input id="reg-email" type="email" autoComplete="email" required
                          disabled={regLoading} value={regEmail}
                          onChange={e => setRegEmail(e.target.value)}
                          placeholder="usuario@sapientia.com"
                          className="lf-input" />
                      </div>
                    </div>

                    {/* Contraseña */}
                    <div>
                      <label htmlFor="reg-password" className="lf-label">Contraseña</label>
                      <div className="lf-wrap">
                        <span className="lf-icon"><IC.Lock /></span>
                        <input id="reg-password" type={showRegPwd ? 'text' : 'password'} autoComplete="new-password" required
                          minLength={6} disabled={regLoading} value={regPwd}
                          onChange={e => setRegPwd(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          className="lf-input lf-input-pr" />
                        <button type="button" className="lf-eye" onClick={() => setShowRegPwd(v => !v)} tabIndex={-1}>
                          {showRegPwd ? <IC.EyeOff /> : <IC.EyeOn />}
                        </button>
                      </div>
                      <PasswordStrength password={regPwd} />
                    </div>

                    {/* Confirmar contraseña */}
                    <div>
                      <label htmlFor="reg-confirm" className="lf-label">Confirmar contraseña</label>
                      <div className="lf-wrap">
                        <span className="lf-icon"><IC.Lock /></span>
                        <input id="reg-confirm" type={showRegPwd ? 'text' : 'password'} autoComplete="new-password" required
                          disabled={regLoading} value={regPwdConf}
                          onChange={e => setRegPwdConf(e.target.value)}
                          placeholder="Repite tu contraseña"
                          className="lf-input lf-input-pr"
                          style={regPwdConf && regPwdConf !== regPwd ? { borderColor:'#f87171' } : {}} />
                        {regPwdConf && (
                          <span style={{
                            position:'absolute', right:'0.875rem',
                            color: regPwdConf === regPwd ? '#22c55e' : '#f87171',
                            display:'flex', alignItems:'center',
                          }}>
                            {regPwdConf === regPwd ? <IC.Check /> : <IC.Alert />}
                          </span>
                        )}
                      </div>
                    </div>

                    <button id="register-submit" type="submit" disabled={regLoading}
                      className="lf-btn-primary" style={{ marginTop:'0.25rem' }}>
                      {regLoading
                        ? <span style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}><IC.Spinner /> Creando cuenta…</span>
                        : 'Crear cuenta'}
                    </button>

                    <div className="lf-divider">o regístrate con</div>

                    {googleError && <ErrorMsg>{googleError}</ErrorMsg>}

                    <button id="register-google" type="button" onClick={handleGoogle}
                      disabled={regLoading || googleLoading} className="lf-btn-secondary">
                      {googleLoading
                        ? <span style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                            <IC.Spinner /> Redirigiendo a Google…
                          </span>
                        : <><IC.Google /> Continuar con Google</>
                      }
                    </button>
                  </div>

                  <p style={{ textAlign:'center', fontSize:'0.8125rem', color:'#94a3b8', marginTop:'1.25rem', fontFamily:'Inter,sans-serif' }}>
                    ¿Ya tienes cuenta?{' '}
                    <button type="button" onClick={() => switchTab('login')}
                      style={{ color:'#2563eb', fontWeight:600, background:'none', border:'none', cursor:'pointer', padding:0, fontFamily:'Inter,sans-serif' }}>
                      Iniciar sesión
                    </button>
                  </p>
                </form>
              )}

              {/* ─── FORGOT PASSWORD ─── */}
              {tab === 'forgot' && (
                <div className="sp-pane">
                  <ForgotPassword onBack={() => switchTab('login')} />
                </div>
              )}

            </div>{/* /body */}
          </div>{/* /card */}

          <p id="sp-copy">
            © 2026 Sapientia · Plataforma de aprendizaje en línea
          </p>

        </div>{/* /sp-auth */}
      </div>{/* /sp-root */}
    </>
  );
};

export default Login;
