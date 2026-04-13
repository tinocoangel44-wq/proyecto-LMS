import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getForosPorCurso, createForo, deleteForo,
  getMensajesPorForo, publicarMensaje, deleteMensaje, buildMessageTree,
} from '../services/forosService';
import Button from './ui/Button';

// ── Helpers ────────────────────────────────────────────────────────────────
const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'Justo ahora';
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `Hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `Hace ${days}d`;
  return new Date(dateStr).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
};

const getInitial = (nombre) => (nombre || '?').charAt(0).toUpperCase();

const AVATAR_COLORS = [
  'bg-primary-500', 'bg-indigo-500', 'bg-emerald-500',
  'bg-rose-500',   'bg-amber-500',  'bg-violet-500',
];
const getAvatarColor = (str = '') => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

// ── Avatar ─────────────────────────────────────────────────────────────────
const Avatar = ({ nombre, size = 'md' }) => {
  const sz = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
  return (
    <div className={`${sz} ${getAvatarColor(nombre)} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {getInitial(nombre)}
    </div>
  );
};

// ── Caja de texto para nuevo mensaje ──────────────────────────────────────
const ComposBox = ({ placeholder, onSubmit, onCancel, loading, autoFocus = false, compact = false }) => {
  const [text, setText] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (autoFocus && ref.current) ref.current.focus();
  }, [autoFocus]);

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSubmit(text);
    setText('');
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <textarea
        ref={ref}
        rows={compact ? 2 : 3}
        placeholder={placeholder}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) submit(e); }}
        className="w-full px-4 py-3 text-sm bg-white dark:bg-dark-bg border border-slate-300 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white resize-none placeholder-slate-400"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">Ctrl + Enter para enviar</span>
        <div className="flex gap-2">
          {onCancel && (
            <button type="button" onClick={onCancel} className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg transition-colors">
              Cancelar
            </button>
          )}
          <Button type="submit" variant="primary" size="sm" isLoading={loading} disabled={!text.trim()}>
            Publicar
          </Button>
        </div>
      </div>
    </form>
  );
};

// ── Mensaje individual (recursivo) ─────────────────────────────────────────
const Mensaje = ({ msg, perfil, canManage, onReply, onDelete, depth = 0 }) => {
  const [showReply, setShowReply] = useState(false);
  const [posting, setPosting] = useState(false);
  const esPropio = msg.perfiles_usuarios?.id === perfil?.id;
  const autor = msg.perfiles_usuarios?.nombre_completo || 'Usuario';

  const handleReply = async (text) => {
    setPosting(true);
    await onReply(msg.id, text);
    setPosting(false);
    setShowReply(false);
  };

  const isRoot = depth === 0;

  return (
    <div className={`${!isRoot ? 'ml-8 mt-3 border-l-2 border-slate-200 dark:border-slate-700 pl-4' : ''}`}>
      <div className={`rounded-2xl p-4 transition-colors ${
        isRoot
          ? 'bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-sm'
          : 'bg-slate-50 dark:bg-dark-bg'
      }`}>
        {/* Cabecera del mensaje */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2.5">
            <Avatar nombre={autor} size={isRoot ? 'md' : 'sm'} />
            <div>
              <span className="text-sm font-bold text-slate-800 dark:text-white">{autor}</span>
              {!isRoot && (
                <span className="ml-1.5 text-xs text-slate-400">{timeAgo(msg.created_at)}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 flex-shrink-0">
            {isRoot && <span>{timeAgo(msg.created_at)}</span>}
            {(esPropio || canManage) && (
              <button
                onClick={() => onDelete(msg.id)}
                className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all p-0.5"
                title="Eliminar"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Contenido */}
        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed pl-11">
          {msg.contenido}
        </p>

        {/* Acciones */}
        <div className="pl-11 mt-2">
          <button
            onClick={() => setShowReply(!showReply)}
            className="text-xs text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors"
          >
            💬 {showReply ? 'Cancelar' : 'Responder'}
          </button>
        </div>

        {/* Formulario de respuesta */}
        {showReply && (
          <div className="pl-11 mt-3">
            <ComposBox
              placeholder={`Responder a ${autor}...`}
              onSubmit={handleReply}
              onCancel={() => setShowReply(false)}
              loading={posting}
              autoFocus
              compact
            />
          </div>
        )}
      </div>

      {/* Respuestas recursivas */}
      {msg.replies?.map(child => (
        <div key={child.id} className="group">
          <Mensaje
            msg={child}
            perfil={perfil}
            canManage={canManage}
            onReply={onReply}
            onDelete={onDelete}
            depth={depth + 1}
          />
        </div>
      ))}
    </div>
  );
};

// ── Vista del Foro (hilo de mensajes) ─────────────────────────────────────
const VistaForo = ({ foro, perfil, canManage, onSalir }) => {
  const [mensajes, setMensajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const bottomRef = useRef(null);

  const cargar = useCallback(async () => {
    const { data } = await getMensajesPorForo(foro.id);
    if (data) setMensajes(buildMessageTree(data));
    setLoading(false);
  }, [foro.id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const scrollToBottom = () => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handlePost = async (text) => {
    setPosting(true);
    await publicarMensaje({ foroId: foro.id, autorId: perfil.id, parentId: null, contenido: text });
    await cargar();
    setPosting(false);
    scrollToBottom();
  };

  const handleReply = async (parentId, text) => {
    await publicarMensaje({ foroId: foro.id, autorId: perfil.id, parentId, contenido: text });
    await cargar();
  };

  const handleDelete = async (mensajeId) => {
    if (!window.confirm('¿Eliminar este mensaje?')) return;
    await deleteMensaje(mensajeId);
    cargar();
  };

  const totalMensajes = foro.mensajes_foro?.length || 0;

  return (
    <div className="flex flex-col h-full">
      {/* Cabecera del foro */}
      <div className="flex items-center gap-3 px-5 py-4 bg-white dark:bg-dark-card border-b border-slate-200 dark:border-dark-border">
        <button
          onClick={onSalir}
          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-bg"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-slate-800 dark:text-white text-base truncate">{foro.titulo}</h2>
          {foro.descripcion && (
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{foro.descripcion}</p>
          )}
        </div>
        <span className="text-xs text-slate-400 flex-shrink-0">
          {totalMensajes} mensaje{totalMensajes !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Hilo de mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-dark-bg/50">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-dark-card rounded-2xl p-4 space-y-2">
                <div className="flex gap-3 items-center">
                  <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-dark-bg" />
                  <div className="h-4 bg-slate-200 dark:bg-dark-bg rounded w-32" />
                </div>
                <div className="h-3 bg-slate-100 dark:bg-dark-bg rounded w-3/4 ml-12" />
                <div className="h-3 bg-slate-100 dark:bg-dark-bg rounded w-1/2 ml-12" />
              </div>
            ))}
          </div>
        ) : mensajes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-3 opacity-30">💬</div>
            <h3 className="font-semibold text-slate-500 dark:text-slate-400">Sin publicaciones todavía</h3>
            <p className="text-sm text-slate-400 mt-1">¡Sé el primero en iniciar la conversación!</p>
          </div>
        ) : (
          mensajes.map(msg => (
            <div key={msg.id} className="group">
              <Mensaje
                msg={msg}
                perfil={perfil}
                canManage={canManage}
                onReply={handleReply}
                onDelete={handleDelete}
                depth={0}
              />
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Compositor de nuevo mensaje */}
      <div className="px-4 py-4 bg-white dark:bg-dark-card border-t border-slate-200 dark:border-dark-border">
        <div className="flex gap-3">
          <Avatar nombre={perfil?.nombre_completo} />
          <div className="flex-1">
            <ComposBox
              placeholder="Escribe tu publicación..."
              onSubmit={handlePost}
              loading={posting}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Lista de foros ─────────────────────────────────────────────────────────
const SeccionForo = ({ cursoId }) => {
  const { role, perfil } = useAuth();
  const canManage = role === 'administrador' || role === 'docente';

  const [foros, setForos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [foroActivo, setForoActivo] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ titulo: '', descripcion: '' });
  const [saving, setSaving] = useState(false);

  const cargarForos = useCallback(async () => {
    setLoading(true);
    const { data } = await getForosPorCurso(cursoId);
    if (data) setForos(data);
    setLoading(false);
  }, [cursoId]);

  useEffect(() => { cargarForos(); }, [cargarForos]);

  const handleCrearForo = async (e) => {
    e.preventDefault();
    if (!formData.titulo.trim()) return;
    setSaving(true);
    await createForo({ cursoId, creadorId: perfil?.id, ...formData });
    setSaving(false);
    setFormData({ titulo: '', descripcion: '' });
    setShowForm(false);
    cargarForos();
  };

  const handleEliminarForo = async (foroId) => {
    if (!window.confirm('¿Eliminar este foro y todos sus mensajes?')) return;
    await deleteForo(foroId);
    cargarForos();
  };

  // Vista interna del foro
  if (foroActivo) {
    return (
      <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl overflow-hidden" style={{ minHeight: '520px', display: 'flex', flexDirection: 'column' }}>
        <VistaForo
          foro={foroActivo}
          perfil={perfil}
          canManage={canManage}
          onSalir={() => { setForoActivo(null); cargarForos(); }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <span>💬</span> Foros de debate
          {foros.length > 0 && (
            <span className="text-sm font-normal text-slate-500">({foros.length})</span>
          )}
        </h2>
        {canManage && !showForm && (
          <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
            + Nuevo foro
          </Button>
        )}
      </div>

      {/* Formulario nuevo foro */}
      {showForm && canManage && (
        <form
          onSubmit={handleCrearForo}
          className="bg-primary-50 dark:bg-primary-900/10 border border-primary-200 dark:border-primary-900/30 rounded-xl p-4 space-y-3"
        >
          <h3 className="text-sm font-bold text-primary-800 dark:text-primary-300">💬 Crear foro de debate</h3>
          <input
            required
            placeholder="Título del foro (ej. Dudas del Tema 1)"
            value={formData.titulo}
            onChange={e => setFormData(p => ({ ...p, titulo: e.target.value }))}
            className="w-full px-4 py-2 text-sm bg-white dark:bg-dark-bg border border-slate-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
          />
          <textarea
            rows={2}
            placeholder="Descripción o instrucciones para el debate (opcional)"
            value={formData.descripcion}
            onChange={e => setFormData(p => ({ ...p, descripcion: e.target.value }))}
            className="w-full px-4 py-2 text-sm bg-white dark:bg-dark-bg border border-slate-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white resize-none"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 rounded-lg">
              Cancelar
            </button>
            <Button type="submit" variant="primary" size="sm" isLoading={saving}>
              Crear foro
            </Button>
          </div>
        </form>
      )}

      {/* Lista de foros */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2].map(i => (
            <div key={i} className="h-20 bg-slate-100 dark:bg-dark-bg rounded-xl" />
          ))}
        </div>
      ) : foros.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-200 dark:border-dark-border rounded-2xl text-center">
          <div className="text-4xl mb-2 opacity-30">💬</div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {canManage ? 'No hay foros. Crea el primero.' : 'No hay foros disponibles en este curso.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {foros.map(foro => {
            const numMensajes = foro.mensajes_foro?.length || 0;
            return (
              <div
                key={foro.id}
                className="group bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-200 overflow-hidden"
              >
                <div className="flex items-center gap-4 px-5 py-4">
                  {/* Icono */}
                  <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center text-xl flex-shrink-0">
                    💬
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {foro.titulo}
                    </h3>
                    {foro.descripcion && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{foro.descripcion}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      {numMensajes} publicación{numMensajes !== 1 ? 'es' : ''}
                    </p>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {canManage && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEliminarForo(foro.id); }}
                        className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => setForoActivo(foro)}
                      className="px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/40 rounded-xl transition-colors"
                    >
                      Entrar →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SeccionForo;
