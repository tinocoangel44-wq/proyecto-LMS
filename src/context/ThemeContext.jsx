import React, { createContext, useContext, useState, useCallback } from 'react';

const ThemeContext = createContext(null);

// ─── Utilidades seguras ────────────────────────────────────────────────────────

/** Lee el localStorage de forma segura (puede fallar en modo privado). */
const safeGetStorage = (key) => {
  try { return localStorage.getItem(key); } catch { return null; }
};

/** Escribe en localStorage de forma segura. */
const safeSetStorage = (key, value) => {
  try { localStorage.setItem(key, value); } catch { /* silencio */ }
};

/** Elimina de localStorage de forma segura. */
const safeRemoveStorage = (key) => {
  try { localStorage.removeItem(key); } catch { /* silencio */ }
};

/**
 * Lee el tema desde el DOM (<html class="dark">).
 * El script síncrono de index.html ya lo aplicó antes de React.
 * Si el DOM no está disponible (SSR/test), fallback a leer localStorage.
 */
const getInitialDark = () => {
  try {
    // Fuente de verdad primaria: el DOM (ya configurado por index.html)
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
  } catch { /* ignorar */ }

  // Fallback: leer localStorage
  return safeGetStorage('theme') === 'dark';
};

/** Aplica el tema al DOM y persiste en localStorage. */
const applyTheme = (dark) => {
  try {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    safeSetStorage('theme', dark ? 'dark' : 'light');
  } catch { /* ignorar si el DOM no está disponible */ }
};

// ─── Provider ──────────────────────────────────────────────────────────────────

export const ThemeProvider = ({ children }) => {
  /**
   * Inicialización lazy: lee el DOM que el script de index.html ya configuró.
   * No usa useEffect para evitar el parpadeo (flash of unstyled content).
   */
  const [isDarkMode, setIsDarkMode] = useState(getInitialDark);

  /** Alterna entre light ↔ dark. */
  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => {
      const next = !prev;
      applyTheme(next);
      return next;
    });
  }, []);

  /** Fuerza un tema específico: 'light' | 'dark'. */
  const setTheme = useCallback((theme) => {
    const dark = theme === 'dark';
    applyTheme(dark);
    setIsDarkMode(dark);
  }, []);

  /** Resetea completamente a light y limpia el storage. */
  const resetTheme = useCallback(() => {
    applyTheme(false);
    safeRemoveStorage('theme');
    setIsDarkMode(false);
  }, []);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, setTheme, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  // Retorna valores seguros por defecto si se usa fuera del provider
  if (!ctx) {
    return {
      isDarkMode:     false,
      toggleDarkMode: () => {},
      setTheme:       () => {},
      resetTheme:     () => {},
    };
  }
  return ctx;
};
