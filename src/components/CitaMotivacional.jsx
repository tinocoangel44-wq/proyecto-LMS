/**
 * CitaMotivacional.jsx — Versión mejorada
 * Usa externalAPIs.js (caché + fallback) en lugar de axios.
 * Redisenado con Tailwind CSS.
 */
import React, { useState, useEffect } from 'react';
import { fetchQuote } from '../services/externalAPIs';

const CitaMotivacional = () => {
  const [cita, setCita] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadCita = async () => {
    setLoading(true);
    const data = await fetchQuote();
    setCita(data);
    setLoading(false);
  };

  useEffect(() => { loadCita(); }, []);

  const handleRefresh = async () => {
    try { sessionStorage.removeItem('ext_quote'); } catch {}
    loadCita();
  };

  if (!loading && !cita) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-white/5">
      <div className="absolute right-4 top-4 text-6xl opacity-5 select-none pointer-events-none">"</div>

      <p className="text-[10px] font-bold uppercase tracking-widest text-primary-400 mb-3 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" />
        Frase del día
      </p>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-4 bg-white/10 rounded w-4/5" />
          <div className="h-4 bg-white/10 rounded w-3/5" />
          <div className="h-3 bg-white/5 rounded w-24 mt-3" />
        </div>
      ) : (
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <blockquote className="text-base text-white/90 italic leading-relaxed font-light">
              "{cita.quote}"
            </blockquote>
            <cite className="text-sm text-white/40 not-italic">— {cita.author}</cite>
          </div>
          <button
            onClick={handleRefresh}
            className="flex-shrink-0 p-2 rounded-xl text-white/30 hover:text-white/70 hover:bg-white/10 transition-all"
            title="Nueva frase"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default CitaMotivacional;
