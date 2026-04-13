import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = process.env.REACT_APP_SUPABASE_URL     || 'https://kzrfxoxiizedyaacngto.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6cmZ4b3hpaXplZHlhYWNuZ3RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MzU0ODUsImV4cCI6MjA5MTExMTQ4NX0.gxSeJjwg2HD8uA9ifyw47EYiMUfhy0F-rCIH9aMvpUQ';

/**
 * Storage personalizado que tolera fallos de localStorage
 * (modo privado, políticas de seguridad, etc.)
 * Fallback a memoria RAM para no crashear la app.
 */
const memoryFallback = {};

const safeStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return memoryFallback[key] ?? null;
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      memoryFallback[key] = value;
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      delete memoryFallback[key];
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Usar nuestro storage tolerante a fallos
    storage: safeStorage,

    // Persistir sesión en el storage
    persistSession: true,

    // Detectar sesión en la URL (para magic links, OAuth)
    detectSessionInUrl: true,

    // ── CLAVE: evitar el NavigatorLockAcquireTimeoutError ──────────────────
    // El lock de Web Locks API bloquea cuando hay múltiples tabs.
    // Desactivar el lock hace que cada tab maneje su propio estado de sesión.
    // Alternativa: usar un timeout personalizado (requiere Supabase JS >= 2.39)
    lock: async (name, acquireTimeout, fn) => {
      // Intentar adquirir el lock con timeout de 5 segundos
      if (typeof navigator !== 'undefined' && navigator.locks) {
        try {
          const result = await Promise.race([
            navigator.locks.request(name, fn),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Lock timeout')), 5000)
            ),
          ]);
          return result;
        } catch {
          // Si falla el lock (timeout u otro error), ejecutar sin lock
          // Esto puede causar condiciones de carrera en multi-tab,
          // pero evita que la app se congele completamente.
          return fn();
        }
      }
      // Web Locks API no disponible → ejecutar directamente
      return fn();
    },
  },
});
