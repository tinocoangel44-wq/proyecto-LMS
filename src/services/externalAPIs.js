/**
 * externalAPIs.js — Servicio centralizado de APIs externas sin autenticación.
 *
 * APIs integradas:
 *  1. dummyjson.com  — Frases motivacionales (CORS-safe, sin key)
 *  2. wttr.in        — Clima por geolocalización (CORS-safe, sin key)
 *  3. date.nager.at  — Días festivos de México (REST pública, sin key)
 */

// ── Utilidad: caché simple en sessionStorage ──────────────────────────────
const cache = {
  get: (key) => {
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return null;
      const { data, exp } = JSON.parse(raw);
      if (Date.now() > exp) { sessionStorage.removeItem(key); return null; }
      return data;
    } catch { return null; }
  },
  set: (key, data, ttlMs = 10 * 60 * 1000) => {
    try {
      sessionStorage.setItem(key, JSON.stringify({ data, exp: Date.now() + ttlMs }));
    } catch { /* storage lleno — ignorar */ }
  },
};

// ── 1. Frases motivacionales ───────────────────────────────────────────────
export const fetchQuote = async () => {
  const cached = cache.get('ext_quote');
  if (cached) return cached;

  try {
    const res = await fetch('https://dummyjson.com/quotes/random');
    if (!res.ok) throw new Error('quote API error');
    const json = await res.json();
    const result = { quote: json.quote, author: json.author };
    cache.set('ext_quote', result, 5 * 60 * 1000); // TTL 5 min
    return result;
  } catch {
    // Fallback curado
    const fallbacks = [
      { quote: 'El éxito es la suma de pequeños esfuerzos repetidos día tras día.', author: 'Robert Collier' },
      { quote: 'La educación es el arma más poderosa para cambiar el mundo.', author: 'Nelson Mandela' },
      { quote: 'Nunca es tarde para aprender.', author: 'Proverbio latino' },
      { quote: 'El aprendizaje es un tesoro que seguirá a su dueño a dondequiera.', author: 'Proverbio chino' },
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
};

// ── 2. Clima vía wttr.in (geolocalización del navegador) ─────────────────
// Mapeo de weatherCode → {emoji, desc_es}
const WEATHER_MAP = {
  113: { emoji: '☀️', desc: 'Soleado' },
  116: { emoji: '⛅', desc: 'Parcialmente nublado' },
  119: { emoji: '☁️', desc: 'Nublado' },
  122: { emoji: '☁️', desc: 'Muy nublado' },
  143: { emoji: '🌫️', desc: 'Con niebla' },
  176: { emoji: '🌦️', desc: 'Lluvia ligera local' },
  179: { emoji: '🌨️', desc: 'Nieve ligera local' },
  182: { emoji: '🌧️', desc: 'Llovizna' },
  185: { emoji: '🌧️', desc: 'Llovizna helada' },
  200: { emoji: '⛈️', desc: 'Tormenta eléctrica' },
  227: { emoji: '🌨️', desc: 'Ventisca' },
  230: { emoji: '❄️', desc: 'Tormenta de nieve' },
  248: { emoji: '🌫️', desc: 'Niebla densa' },
  260: { emoji: '🌫️', desc: 'Niebla helada' },
  263: { emoji: '🌦️', desc: 'Llovizna ligera' },
  266: { emoji: '🌧️', desc: 'Lluvia ligera' },
  281: { emoji: '🌧️', desc: 'Aguanieve' },
  293: { emoji: '🌧️', desc: 'Lluvia moderada' },
  296: { emoji: '🌧️', desc: 'Lluvia' },
  299: { emoji: '🌧️', desc: 'Lluvia intensa' },
  302: { emoji: '🌧️', desc: 'Lluvia fuerte' },
  305: { emoji: '🌧️', desc: 'Lluvia muy fuerte' },
  308: { emoji: '⛈️', desc: 'Lluvia torrencial' },
  374: { emoji: '🌨️', desc: 'Nieve ligera' },
  377: { emoji: '❄️', desc: 'Nevando' },
  386: { emoji: '⛈️', desc: 'Tormenta con lluvia' },
  389: { emoji: '⛈️', desc: 'Tormenta fuerte' },
  392: { emoji: '⛈️', desc: 'Tormenta con nieve' },
};

const getWeatherInfo = (code) => WEATHER_MAP[code] || { emoji: '🌡️', desc: 'Variable' };

const getUserLocation = () =>
  new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude.toFixed(2), lon: pos.coords.longitude.toFixed(2) }),
      () => resolve(null),
      { timeout: 5000 }
    );
  });

export const fetchWeather = async () => {
  const cached = cache.get('ext_weather');
  if (cached) return cached;

  try {
    const loc = await getUserLocation();
    const url = loc
      ? `https://wttr.in/${loc.lat},${loc.lon}?format=j1`
      : 'https://wttr.in/Mexico+City?format=j1';

    const res = await fetch(url);
    if (!res.ok) throw new Error('wttr error');
    const json = await res.json();

    const cond = json.current_condition[0];
    const area = json.nearest_area?.[0];
    const today = json.weather?.[0];
    const tomorrow = json.weather?.[1];

    const weatherCode = parseInt(cond.weatherCode);
    const { emoji, desc } = getWeatherInfo(weatherCode);

    const result = {
      temp: parseInt(cond.temp_C),
      feelsLike: parseInt(cond.FeelsLikeC),
      humidity: parseInt(cond.humidity),
      windKmph: parseInt(cond.windspeedKmph),
      emoji,
      desc,
      city: area?.areaName?.[0]?.value || 'Tu ciudad',
      country: area?.country?.[0]?.value || 'México',
      maxTemp: parseInt(today?.maxtempC || 0),
      minTemp: parseInt(today?.mintempC || 0),
      sunrise: today?.astronomy?.[0]?.sunrise || '',
      sunset: today?.astronomy?.[0]?.sunset || '',
      tomorrow: tomorrow ? {
        date: tomorrow.date,
        max: parseInt(tomorrow.maxtempC),
        min: parseInt(tomorrow.mintempC),
        ...getWeatherInfo(parseInt(tomorrow.hourly?.[4]?.weatherCode || 113)),
      } : null,
    };

    cache.set('ext_weather', result, 15 * 60 * 1000); // TTL 15 min
    return result;
  } catch {
    return null;
  }
};

// ── 3. Días festivos de México (date.nager.at) ────────────────────────────
export const fetchHolidays = async () => {
  const year = new Date().getFullYear();
  const key = `ext_holidays_${year}`;
  const cached = cache.get(key);
  if (cached) return cached;

  try {
    const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/MX`);
    if (!res.ok) throw new Error('holidays error');
    const json = await res.json();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Próximos 3 festivos
    const upcoming = json
      .filter(h => new Date(h.date + 'T00:00:00') >= today)
      .slice(0, 3)
      .map(h => ({
        date: h.date,
        name: h.localName,
        type: h.types?.[0] || 'Public',
      }));

    // Festivo de hoy si existe
    const todayStr = today.toISOString().split('T')[0];
    const todayHoliday = json.find(h => h.date === todayStr);

    const result = { upcoming, todayHoliday: todayHoliday ? todayHoliday.localName : null };
    cache.set(key, result, 60 * 60 * 1000); // TTL 1 hora
    return result;
  } catch {
    return { upcoming: [], todayHoliday: null };
  }
};

// ── Carga paralela de todo ──────────────────────────────────────────────────
export const fetchAllExternalData = async () => {
  const [quote, weather, holidays] = await Promise.allSettled([
    fetchQuote(),
    fetchWeather(),
    fetchHolidays(),
  ]);
  return {
    quote: quote.status === 'fulfilled' ? quote.value : null,
    weather: weather.status === 'fulfilled' ? weather.value : null,
    holidays: holidays.status === 'fulfilled' ? holidays.value : null,
  };
};
