import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { NOTIF_ICONS } from '../services/notificationsService';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'Justo ahora';
  if (mins  < 60) return `Hace ${mins} min`;
  if (hours < 24) return `Hace ${hours}h`;
  return `Hace ${days}d`;
};

const TIPO_COLORS = {
  tarea:        'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  calificacion: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  material:     'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  foro:         'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  curso:        'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  entrega:      'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  sistema:      'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

// ─── Ítem individual de notificación ─────────────────────────────────────────
const NotifItem = ({ notif, onRead, onDelete }) => {
  const icon   = NOTIF_ICONS[notif.tipo_notificacion] ?? '🔔';
  const color  = TIPO_COLORS[notif.tipo_notificacion] ?? TIPO_COLORS.sistema;

  return (
    <div
      className={[
        'group flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer relative',
        notif.leida
          ? 'hover:bg-slate-50 dark:hover:bg-dark-hover'
          : 'bg-primary-50/60 dark:bg-primary-900/10 hover:bg-primary-50 dark:hover:bg-primary-900/20',
      ].join(' ')}
      onClick={() => !notif.leida && onRead(notif.id)}
    >
      {/* Ícono de tipo */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-base ${color}`}>
        {icon}
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <p className={`text-xs leading-snug font-semibold ${notif.leida ? 'text-slate-600 dark:text-slate-400' : 'text-slate-800 dark:text-white'}`}>
          {notif.titulo}
        </p>
        {notif.mensaje && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
            {notif.mensaje}
          </p>
        )}
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
          {timeAgo(notif.created_at)}
        </p>
      </div>

      {/* Punto de no leída + botón eliminar */}
      <div className="flex-shrink-0 flex flex-col items-center gap-1.5">
        {!notif.leida && (
          <span className="w-2 h-2 rounded-full bg-primary-500 mt-0.5" />
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(notif.id); }}
          className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-all rounded"
          title="Eliminar"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// ─── Skeleton loader ─────────────────────────────────────────────────────────
const NotifSkeleton = () => (
  <div className="flex items-start gap-3 px-4 py-3 animate-pulse">
    <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-dark-border flex-shrink-0" />
    <div className="flex-1 space-y-1.5">
      <div className="h-3 bg-slate-200 dark:bg-dark-border rounded w-3/4" />
      <div className="h-2.5 bg-slate-200 dark:bg-dark-border rounded w-full" />
      <div className="h-2 bg-slate-200 dark:bg-dark-border rounded w-1/3" />
    </div>
  </div>
);

// ─── Componente principal: NotificationBell ───────────────────────────────────
/**
 * Campana de notificaciones en tiempo real.
 * Se coloca en el Navbar — consume NotificationContext.
 */
const NotificationBell = () => {
  const {
    notificaciones,
    noLeidasCount,
    loading,
    newPing,
    leerNotificacion,
    leerTodas,
    borrarNotificacion,
  } = useNotifications();

  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Marcar todas al abrir (opcional: comentar si se prefiere marcar individualmente)
  const handleToggle = () => {
    setOpen(prev => !prev);
  };

  const visibles = notificaciones.slice(0, 15);
  const sinNotifs = !loading && visibles.length === 0;

  return (
    <div ref={ref} className="relative">
      {/* ── Botón campana ── */}
      <button
        onClick={handleToggle}
        aria-label="Notificaciones"
        className={[
          'relative p-2 rounded-xl transition-all',
          open
            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-hover hover:text-slate-700 dark:hover:text-slate-200',
        ].join(' ')}
      >
        {/* Ícono campana con animación shake si hay nueva */}
        <svg
          className={`w-5 h-5 transition-transform ${newPing ? 'animate-bounce' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path
            strokeLinecap="round"
            d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
          />
        </svg>

        {/* Badge contador */}
        {noLeidasCount > 0 && (
          <span
            className={[
              'absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center',
              'bg-red-500 text-white text-[9px] font-bold rounded-full px-1',
              'border-2 border-white dark:border-dark-card',
              newPing ? 'animate-ping-once' : '',
            ].join(' ')}
          >
            {noLeidasCount > 99 ? '99+' : noLeidasCount}
          </span>
        )}
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[480px] animate-slide-down">

          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-dark-border flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-800 dark:text-white">
                Notificaciones
              </span>
              {noLeidasCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full leading-none">
                  {noLeidasCount}
                </span>
              )}
            </div>
            {noLeidasCount > 0 && (
              <button
                onClick={leerTodas}
                className="text-[11px] font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          {/* Lista scrollable */}
          <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-dark-border/50">
            {loading && (
              <>
                <NotifSkeleton />
                <NotifSkeleton />
                <NotifSkeleton />
              </>
            )}

            {sinNotifs && (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-dark-surface flex items-center justify-center text-2xl mb-3">
                  🔔
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Sin notificaciones
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Aquí aparecerán tus alertas en tiempo real
                </p>
              </div>
            )}

            {!loading && visibles.map(notif => (
              <NotifItem
                key={notif.id}
                notif={notif}
                onRead={leerNotificacion}
                onDelete={borrarNotificacion}
              />
            ))}
          </div>

          {/* Footer */}
          {visibles.length > 0 && (
            <div className="px-4 py-2.5 border-t border-slate-100 dark:border-dark-border text-center flex-shrink-0">
              <button
                onClick={() => { leerTodas(); setOpen(false); }}
                className="text-xs text-slate-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors"
              >
                Limpiar todas ·{' '}
                <span className="text-primary-600 dark:text-primary-400">
                  {notificaciones.length} total
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
