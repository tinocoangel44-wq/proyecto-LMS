import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import {
  getNotificaciones,
  countNoLeidas,
  marcarLeida,
  marcarTodasLeidas,
  eliminarNotificacion,
  suscribirNotificaciones,
  getPerfilId,
} from '../services/notificationsService';
import { useAuth } from './AuthContext';

// ─── Sonido de notificación (Web Audio API, sin archivos externos) ───────────
const playNotifSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch (_) {
    // Web Audio no disponible — silencio graceful
  }
};

// ─── Context ─────────────────────────────────────────────────────────────────
const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user, perfil } = useAuth();
  const [notificaciones, setNotificaciones]   = useState([]);
  const [noLeidasCount, setNoLeidasCount]     = useState(0);
  const [loading, setLoading]                 = useState(false);
  const [perfilId, setPerfilId]               = useState(null);
  // Control para animación de "nueva notif" en la campana
  const [newPing, setNewPing]                 = useState(false);
  const canalRef                              = useRef(null);

  // ── Resolver perfil_id cuando el usuario hace login ──────────────────────
  useEffect(() => {
    if (!user?.id) {
      setPerfilId(null);
      setNotificaciones([]);
      setNoLeidasCount(0);
      return;
    }
    // Si ya tenemos el perfil del AuthContext, usarlo directamente
    if (perfil?.id) {
      setPerfilId(perfil.id);
    } else {
      getPerfilId(user.id).then(id => setPerfilId(id));
    }
  }, [user?.id, perfil?.id]);

  // ── Cargar notificaciones iniciales ──────────────────────────────────────
  const cargarNotificaciones = useCallback(async () => {
    if (!perfilId) return;
    setLoading(true);
    const [{ data }, { count }] = await Promise.all([
      getNotificaciones(perfilId, 30),
      countNoLeidas(perfilId),
    ]);
    setNotificaciones(data);
    setNoLeidasCount(count);
    setLoading(false);
  }, [perfilId]);

  useEffect(() => {
    cargarNotificaciones();
  }, [cargarNotificaciones]);

  // ── Suscripción Realtime ──────────────────────────────────────────────────
  useEffect(() => {
    if (!perfilId) return;

    // Limpiar canal anterior si existe
    if (canalRef.current) {
      canalRef.current.unsubscribe();
      canalRef.current = null;
    }

    const canal = suscribirNotificaciones(perfilId, (nueva) => {
      // Agregar al inicio de la lista
      setNotificaciones(prev => [nueva, ...prev]);
      setNoLeidasCount(prev => prev + 1);
      // Feedback: sonido + animación ping
      playNotifSound();
      setNewPing(true);
      setTimeout(() => setNewPing(false), 3000);
    });

    canalRef.current = canal;

    return () => {
      canal.unsubscribe();
      canalRef.current = null;
    };
  }, [perfilId]);

  // ── Acciones ─────────────────────────────────────────────────────────────
  const leerNotificacion = useCallback(async (id) => {
    await marcarLeida(id);
    setNotificaciones(prev =>
      prev.map(n => n.id === id ? { ...n, leida: true } : n)
    );
    setNoLeidasCount(prev => Math.max(0, prev - 1));
  }, []);

  const leerTodas = useCallback(async () => {
    if (!perfilId) return;
    await marcarTodasLeidas(perfilId);
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
    setNoLeidasCount(0);
  }, [perfilId]);

  const borrarNotificacion = useCallback(async (id) => {
    const notif = notificaciones.find(n => n.id === id);
    await eliminarNotificacion(id);
    setNotificaciones(prev => prev.filter(n => n.id !== id));
    if (notif && !notif.leida) setNoLeidasCount(prev => Math.max(0, prev - 1));
  }, [notificaciones]);

  return (
    <NotificationContext.Provider value={{
      notificaciones,
      noLeidasCount,
      loading,
      newPing,
      cargarNotificaciones,
      leerNotificacion,
      leerTodas,
      borrarNotificacion,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications debe usarse dentro de <NotificationProvider>');
  return ctx;
};
