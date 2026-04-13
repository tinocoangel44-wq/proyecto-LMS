import React, { useState, useEffect, useCallback } from 'react';
import { fetchAllExternalData } from '../services/externalAPIs';

// ── Skeleton animado ───────────────────────────────────────────────────────
const Shimmer = ({ w = 'w-full', h = 'h-4', rounded = 'rounded' }) => (
  <div className={`animate-pulse bg-white/20 ${w} ${h} ${rounded}`} />
);

// ── Formatear fecha festivo ────────────────────────────────────────────────
const formatHolidayDate = (str) => {
  const d = new Date(str + 'T00:00:00');
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' });
};

const daysUntil = (str) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(str + 'T00:00:00');
  const diff = Math.round((target - today) / 86400000);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  return `En ${diff} días`;
};

// ── Reloj en vivo ──────────────────────────────────────────────────────────
const LiveClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="text-right">
      <div className="text-3xl font-black tabular-nums tracking-tight text-white">
        {time.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className="text-xs text-white/60 mt-0.5">
        {time.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
      </div>
    </div>
  );
};

// ── Panel de clima ─────────────────────────────────────────────────────────
const WeatherPanel = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="space-y-2">
        <Shimmer w="w-16" h="h-10" rounded="rounded-lg" />
        <Shimmer w="w-28" h="h-3" />
        <Shimmer w="w-20" h="h-3" />
      </div>
    );
  }
  if (!data) return (
    <div className="text-white/40 text-sm italic">Clima no disponible</div>
  );
  return (
    <div className="space-y-1.5">
      <div className="flex items-end gap-2">
        <span className="text-5xl">{data.emoji}</span>
        <div>
          <div className="text-3xl font-black text-white leading-none">{data.temp}°C</div>
          <div className="text-xs text-white/60">{data.desc}</div>
        </div>
      </div>
      <div className="text-xs text-white/70 font-medium">📍 {data.city}, {data.country}</div>
      <div className="flex gap-3 text-xs text-white/60">
        <span>↑{data.maxTemp}° ↓{data.minTemp}°</span>
        <span>💧{data.humidity}%</span>
        <span>💨{data.windKmph} km/h</span>
      </div>
      {data.tomorrow && (
        <div className="pt-1.5 border-t border-white/10 flex items-center gap-2 text-xs text-white/50">
          <span>{data.tomorrow.emoji}</span>
          <span>Mañana: {data.tomorrow.min}°–{data.tomorrow.max}°C</span>
        </div>
      )}
    </div>
  );
};

// ── Panel de frase motivacional ────────────────────────────────────────────
const QuotePanel = ({ data, loading, onRefresh }) => {
  if (loading) {
    return (
      <div className="space-y-2">
        <Shimmer w="w-full" h="h-3" />
        <Shimmer w="w-4/5" h="h-3" />
        <Shimmer w="w-24" h="h-3" />
      </div>
    );
  }
  if (!data) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <span className="text-yellow-300 text-lg leading-none mt-0.5 flex-shrink-0">"</span>
        <blockquote className="text-sm text-white/90 italic leading-relaxed font-light">
          {data.quote}
        </blockquote>
        <span className="text-yellow-300 text-lg leading-none mt-auto flex-shrink-0">"</span>
      </div>
      <div className="flex items-center justify-between">
        <cite className="text-xs text-white/50 not-italic">— {data.author}</cite>
        <button
          onClick={onRefresh}
          className="text-[10px] text-white/40 hover:text-white/70 transition-colors px-2 py-0.5 rounded hover:bg-white/10"
          title="Nueva cita"
        >
          ↻ Nueva
        </button>
      </div>
    </div>
  );
};

// ── Panel de festivos ──────────────────────────────────────────────────────
const HolidaysPanel = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1,2,3].map(i => <Shimmer key={i} w="w-full" h="h-8" rounded="rounded-lg" />)}
      </div>
    );
  }
  if (!data || data.upcoming.length === 0) {
    return <p className="text-xs text-white/40 italic">Sin festivos próximos</p>;
  }
  return (
    <div className="space-y-1.5">
      {data.todayHoliday && (
        <div className="px-3 py-2 bg-yellow-400/20 border border-yellow-400/30 rounded-xl text-xs text-yellow-300 font-semibold flex items-center gap-2 animate-pulse">
          🎉 Hoy: {data.todayHoliday}
        </div>
      )}
      {data.upcoming.map((h, i) => {
        const days = daysUntil(h.date);
        const isToday = days === 'Hoy';
        return (
          <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-xl ${isToday ? 'bg-yellow-400/10' : 'bg-white/5 hover:bg-white/10'} transition-colors`}>
            <div className="text-lg flex-shrink-0">{isToday ? '🎉' : i === 0 ? '📅' : '📆'}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{h.name}</p>
              <p className="text-[10px] text-white/50">{formatHolidayDate(h.date)}</p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
              isToday
                ? 'bg-yellow-400/20 text-yellow-300'
                : days === 'Mañana'
                ? 'bg-orange-400/20 text-orange-300'
                : 'bg-white/10 text-white/50'
            }`}>
              {days}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ── Widget principal ────────────────────────────────────────────────────────
const ExternalWidgets = ({ className = '' }) => {
  const [data, setData] = useState({ quote: null, weather: null, holidays: null });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('clima');

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchAllExternalData();
    setData(result);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const refreshQuote = async () => {
    // Borrar caché de cita y recargar solo esa sección
    try { sessionStorage.removeItem('ext_quote'); } catch {}
    const { fetchQuote } = await import('../services/externalAPIs');
    const q = await fetchQuote();
    setData(prev => ({ ...prev, quote: q }));
  };

  const tabs = [
    { id: 'clima',    label: 'Clima',   icon: '🌤️' },
    { id: 'frase',    label: 'Frase',   icon: '💡' },
    { id: 'festivos', label: 'Festivos', icon: '📅' },
  ];

  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0c1445 100%)' }}
    >
      {/* Orbes decorativos de fondo */}
      <div className="absolute -top-8 -right-8 w-40 h-40 bg-primary-500 rounded-full opacity-10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-indigo-500 rounded-full opacity-10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-violet-500 rounded-full opacity-5 blur-2xl pointer-events-none" />

      <div className="relative z-10 p-5">
        {/* Header: reloj + fecha */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">Información en vivo</p>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-white/50">APIs externas conectadas</span>
            </div>
          </div>
          <LiveClock />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-white/5 rounded-xl p-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                activeTab === t.id
                  ? 'bg-white/20 text-white shadow-inner'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/10'
              }`}
            >
              <span>{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Contenido del tab activo */}
        <div className="min-h-[120px]">
          {activeTab === 'clima' && (
            <WeatherPanel data={data.weather} loading={loading} />
          )}
          {activeTab === 'frase' && (
            <QuotePanel data={data.quote} loading={loading} onRefresh={refreshQuote} />
          )}
          {activeTab === 'festivos' && (
            <HolidaysPanel data={data.holidays} loading={loading} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ExternalWidgets;
