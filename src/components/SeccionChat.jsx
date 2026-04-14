import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getMensajesCurso,
  enviarMensaje,
  suscribirChat,
} from '../services/mensajesService';

// ── Helpers ────────────────────────────────────────────────────────────────
const formatHora = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
};

const formatFecha = (dateStr) => {
  const d = new Date(dateStr);
  const hoy = new Date();
  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);

  if (d.toDateString() === hoy.toDateString()) return 'Hoy';
  if (d.toDateString() === ayer.toDateString()) return 'Ayer';
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
};

const groupByDate = (mensajes) => {
  const groups = {};
  mensajes.forEach((m) => {
    const fecha = new Date(m.created_at).toDateString();
    if (!groups[fecha]) groups[fecha] = { label: formatFecha(m.created_at), items: [] };
    groups[fecha].items.push(m);
  });
  return Object.values(groups);
};

// ── Colores por rol ────────────────────────────────────────────────────────
const ROL_COLOR = {
  administrador: 'from-rose-500 to-pink-600',
  docente: 'from-indigo-500 to-violet-600',
  estudiante: 'from-emerald-500 to-teal-600',
};

// Helper para obtener el nombre del rol independientemente de cómo venga
const getRolNombre = (perfil) => perfil?.roles?.nombre ?? perfil?.rol ?? null;

const getInitial = (nombre) => (nombre || '?').charAt(0).toUpperCase();

// ── Avatar del remitente ───────────────────────────────────────────────────
const Avatar = ({ perfil, size = 'sm' }) => {
  const gradient = ROL_COLOR[getRolNombre(perfil)] ?? 'from-slate-400 to-slate-500';
  const dim = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  return (
    <div className={`${dim} rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {perfil?.avatar_url ? (
        <img
          src={perfil.avatar_url}
          alt={perfil.nombre_completo}
          className="w-full h-full rounded-xl object-cover"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      ) : (
        getInitial(perfil?.nombre_completo)
      )}
    </div>
  );
};

// ── Burbuja de mensaje ─────────────────────────────────────────────────────
const MensajeBurbuja = ({ mensaje, esPropio }) => {
  const perfil = mensaje.perfiles_usuarios;
  const nombre = perfil?.nombre_completo || 'Usuario';
  const rol = getRolNombre(perfil);

  if (esPropio) {
    return (
      <div className="flex justify-end items-end gap-2 group">
        <div className="max-w-[75%] space-y-0.5">
          <div className="bg-primary-600 text-white px-4 py-2.5 rounded-2xl rounded-br-sm shadow-sm">
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{mensaje.contenido}</p>
          </div>
          <p className="text-[10px] text-slate-400 text-right pr-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {formatHora(mensaje.created_at)}
          </p>
        </div>
        <Avatar perfil={perfil} />
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2 group">
      <Avatar perfil={perfil} />
      <div className="max-w-[75%] space-y-0.5">
        <div className="flex items-center gap-2 mb-0.5 pl-1">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{nombre}</span>
          {rol && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize ${
              rol === 'docente'
                ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400'
                : rol === 'administrador'
                ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400'
                : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
            }`}>
              {rol}
            </span>
          )}
        </div>
        <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border px-4 py-2.5 rounded-2xl rounded-bl-sm shadow-sm">
          <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words">{mensaje.contenido}</p>
        </div>
        <p className="text-[10px] text-slate-400 pl-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {formatHora(mensaje.created_at)}
        </p>
      </div>
    </div>
  );
};

// ── Separador de fecha ─────────────────────────────────────────────────────
const FechaDivider = ({ label }) => (
  <div className="flex items-center gap-3 py-2">
    <div className="flex-1 h-px bg-slate-200 dark:bg-dark-border" />
    <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 whitespace-nowrap">{label}</span>
    <div className="flex-1 h-px bg-slate-200 dark:bg-dark-border" />
  </div>
);

// ── Componente Principal ───────────────────────────────────────────────────
const SeccionChat = ({ cursoId }) => {
  const { perfil } = useAuth();
  const [mensajes, setMensajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const canalRef = useRef(null);

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior });
    }, 50);
  }, []);

  // Cargar mensajes iniciales
  useEffect(() => {
    let activo = true;
    setLoading(true);
    getMensajesCurso(cursoId).then(({ data }) => {
      if (activo) {
        setMensajes(data);
        setLoading(false);
        scrollToBottom('instant');
      }
    });
    return () => { activo = false; };
  }, [cursoId, scrollToBottom]);

  // Suscripción Realtime
  useEffect(() => {
    if (!cursoId) return;

    if (canalRef.current) {
      canalRef.current.unsubscribe();
    }

    canalRef.current = suscribirChat(cursoId, (nuevo) => {
      setMensajes((prev) => {
        // Evitar duplicados
        if (prev.some((m) => m.id === nuevo.id)) return prev;
        return [...prev, nuevo];
      });
      scrollToBottom('smooth');
    });

    return () => {
      canalRef.current?.unsubscribe();
      canalRef.current = null;
    };
  }, [cursoId, scrollToBottom]);

  const handleEnviar = async () => {
    const contenido = texto.trim();
    if (!contenido || !perfil?.id) return;

    setEnviando(true);
    setError(null);

    const { data, error: err } = await enviarMensaje({
      cursoId,
      remitenteId: perfil.id,
      contenido,
    });

    setEnviando(false);

    if (err) {
      setError('No se pudo enviar el mensaje. ' + err.message);
    } else if (data) {
      setTexto('');
      // El canal Realtime lo recibirá, pero agregamos localmente para responsividad
      setMensajes((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev;
        return [...prev, data];
      });
      scrollToBottom('smooth');
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  };

  const grupos = groupByDate(mensajes);

  return (
    <div className="flex flex-col h-[600px] bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl overflow-hidden shadow-sm">

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-dark-border bg-slate-50 dark:bg-dark-bg/50 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white text-lg">
          💬
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">Chat del Curso</h3>
          <p className="text-xs text-slate-400">Mensajería en tiempo real · Turno abierto</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">En vivo</span>
        </div>
      </div>

      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex flex-col gap-3 animate-pulse pt-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`flex gap-2 ${i % 2 === 0 ? '' : 'justify-end'}`}>
                <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-dark-border flex-shrink-0" />
                <div className="h-12 rounded-2xl bg-slate-200 dark:bg-dark-border" style={{ width: `${35 + (i * 11) % 30}%` }} />
              </div>
            ))}
          </div>
        ) : mensajes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-dark-bg flex items-center justify-center text-3xl mb-3">
              💬
            </div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Nadie ha escrito todavía</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">¡Sé el primero en iniciar la conversación!</p>
          </div>
        ) : (
          grupos.map((grupo) => (
            <React.Fragment key={grupo.label}>
              <FechaDivider label={grupo.label} />
              {grupo.items.map((msg) => (
                <MensajeBurbuja
                  key={msg.id}
                  mensaje={msg}
                  esPropio={msg.remitente_id === perfil?.id}
                />
              ))}
            </React.Fragment>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-900/30 flex-shrink-0">
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Área de input */}
      <div className="flex items-end gap-3 px-4 py-3 border-t border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-bg/30 flex-shrink-0">
        <Avatar perfil={perfil} />
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            rows={1}
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje... (Enter para enviar, Shift+Enter para nueva línea)"
            disabled={enviando}
            className="w-full px-4 py-2.5 text-sm bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white resize-none overflow-hidden transition-all disabled:opacity-60"
            style={{ minHeight: '42px' }}
          />
        </div>
        <button
          onClick={handleEnviar}
          disabled={!texto.trim() || enviando}
          className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 dark:disabled:bg-dark-border text-white disabled:text-slate-400 flex items-center justify-center transition-all shadow-sm disabled:cursor-not-allowed"
          title="Enviar mensaje (Enter)"
        >
          {enviando ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default SeccionChat;
