import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getCuestionariosPorCurso,
  generarCuestionarioCompleto,
  calcularYGuardarExamen,
  getMiIntentoCuestionario,
} from '../services/cuestionariosService';
import Button from './ui/Button';
import Input from './ui/Input';
import Alert from './ui/Alert';

// ────────────────────────────────────────────────────────────────────────────
// UTILIDADES
// ────────────────────────────────────────────────────────────────────────────
const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const getNotaColor = (nota) =>
  nota >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
  nota >= 60 ? 'text-amber-600 dark:text-amber-400' :
  'text-red-600 dark:text-red-400';

const getNotaBg = (nota) =>
  nota >= 80 ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900/30' :
  nota >= 60 ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/30' :
  'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30';

// ────────────────────────────────────────────────────────────────────────────
// COMPONENTE: FORMULARIO CREACIÓN (DOCENTE)
// ────────────────────────────────────────────────────────────────────────────
const BLANK_OPCION = (correcta = false) => ({ texto: '', es_correcta: correcta });
const BLANK_PREGUNTA = () => ({
  enunciado: '',
  puntaje: 10,
  opciones: [BLANK_OPCION(true), BLANK_OPCION(), BLANK_OPCION(), BLANK_OPCION()],
});

const FormularioCreacion = ({ onSubmit, onCancel, isLoading }) => {
  const [meta, setMeta] = useState({ titulo: '', descripcion: '', tiempoMinutos: '' });
  const [preguntas, setPreguntas] = useState([BLANK_PREGUNTA()]);

  const addPregunta = () => setPreguntas(p => [...p, BLANK_PREGUNTA()]);
  const removePregunta = (i) => setPreguntas(p => p.filter((_, idx) => idx !== i));

  const updatePregunta = (i, field, val) => setPreguntas(p => {
    const copy = [...p];
    copy[i] = { ...copy[i], [field]: val };
    return copy;
  });

  const updateOpcionTexto = (pi, oi, texto) => setPreguntas(p => {
    const copy = [...p];
    copy[pi].opciones[oi].texto = texto;
    return copy;
  });

  const setCorrectaOpcion = (pi, oi) => setPreguntas(p => {
    const copy = [...p];
    copy[pi].opciones = copy[pi].opciones.map((o, idx) => ({ ...o, es_correcta: idx === oi }));
    return copy;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validar que cada pregunta tiene respuesta correcta y al menos 2 opciones con texto
    for (let i = 0; i < preguntas.length; i++) {
      const p = preguntas[i];
      const opcionesConTexto = p.opciones.filter(o => o.texto.trim());
      const tieneCorrecta = p.opciones.some(o => o.es_correcta && o.texto.trim());
      if (opcionesConTexto.length < 2) return alert(`Pregunta ${i + 1}: necesita al menos 2 opciones con texto.`);
      if (!tieneCorrecta) return alert(`Pregunta ${i + 1}: marca cuál es la respuesta CORRECTA.`);
    }
    onSubmit({ ...meta, preguntas: preguntas.map(p => ({
      ...p,
      opciones: p.opciones.filter(o => o.texto.trim()),
    })) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-900/30 rounded-2xl p-6">
      <div>
        <h3 className="font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-2 mb-4">
          📋 Nuevo cuestionario de opción múltiple
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Input
              required
              label="TÍTULO DEL EXAMEN *"
              placeholder="Ej. Examen Parcial 1 – Algoritmos"
              value={meta.titulo}
              onChange={e => setMeta(m => ({ ...m, titulo: e.target.value }))}
            />
          </div>
          <div>
            <Input
              label="TIEMPO LÍMITE (min)"
              type="number"
              min={1}
              placeholder="Sin límite"
              value={meta.tiempoMinutos}
              onChange={e => setMeta(m => ({ ...m, tiempoMinutos: e.target.value }))}
            />
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Descripción / Instrucciones</label>
          <textarea
            rows={2}
            placeholder="Instrucciones generales para el estudiante..."
            value={meta.descripcion}
            onChange={e => setMeta(m => ({ ...m, descripcion: e.target.value }))}
            className="px-4 py-2 text-sm bg-white dark:bg-dark-bg border border-slate-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white resize-none"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">
            Reactivos ({preguntas.length} pregunta{preguntas.length !== 1 ? 's' : ''})
          </h4>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            Puntaje total: {preguntas.reduce((s, p) => s + (parseFloat(p.puntaje) || 0), 0)} pts
          </span>
        </div>

        {preguntas.map((preg, pi) => (
          <div key={pi} className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 text-xs font-bold flex items-center justify-center">
                {pi + 1}
              </span>
              <div className="flex-1 space-y-3">
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Input
                      required
                      placeholder="Escribe el enunciado de la pregunta..."
                      value={preg.enunciado}
                      onChange={e => updatePregunta(pi, 'enunciado', e.target.value)}
                    />
                  </div>
                  <div className="w-20">
                    <Input
                      required
                      type="number"
                      min={1}
                      label="Pts"
                      value={preg.puntaje}
                      onChange={e => updatePregunta(pi, 'puntaje', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Opciones (🟢 = respuesta correcta)
                  </p>
                  {preg.opciones.map((opt, oi) => (
                    <label
                      key={oi}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg border-2 cursor-pointer transition-all ${
                        opt.es_correcta
                          ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-600'
                          : 'border-slate-200 dark:border-dark-border hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`correcta_${pi}`}
                        checked={opt.es_correcta}
                        onChange={() => setCorrectaOpcion(pi, oi)}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                      />
                      <input
                        className="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-300 focus:outline-none placeholder-slate-400"
                        placeholder={`Opción ${String.fromCharCode(65 + oi)}`}
                        value={opt.texto}
                        onChange={e => updateOpcionTexto(pi, oi, e.target.value)}
                      />
                      {opt.es_correcta && (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">✓ Correcta</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {preguntas.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePregunta(pi)}
                  className="flex-shrink-0 p-1 text-slate-300 hover:text-red-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addPregunta}
          className="w-full py-3 border-2 border-dashed border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 text-sm font-semibold rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
        >
          + Agregar pregunta
        </button>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 rounded-lg">Cancelar</button>
        <Button type="submit" variant="primary" isLoading={isLoading}>
          ✅ Publicar cuestionario
        </Button>
      </div>
    </form>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// COMPONENTE: PANTALLA DE EXAMEN EN VIVO
// ────────────────────────────────────────────────────────────────────────────
const PantallaExamen = ({ cuestionario, perfil, onFinish, onSalir }) => {
  const [respuestas, setRespuestas] = useState({});       // { preguntaId: opcionId }
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [segundos, setSegundos] = useState(
    cuestionario.tiempo_limite_minutos ? cuestionario.tiempo_limite_minutos * 60 : null
  );
  const [enviando, setEnviando] = useState(false);
  const timerRef = useRef(null);

  const preguntas = cuestionario.preguntas || [];
  const total = preguntas.length;
  const respondidas = Object.keys(respuestas).length;
  const progreso = total > 0 ? (respondidas / total) * 100 : 0;

  // Timer countdown
  useEffect(() => {
    if (segundos === null) return;
    if (segundos <= 0) {
      handleSubmit(true);
      return;
    }
    timerRef.current = setTimeout(() => setSegundos(s => s - 1), 1000);
    return () => clearTimeout(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segundos]);

  const seleccionarOpcion = (preguntaId, opcionId) => {
    setRespuestas(r => ({ ...r, [preguntaId]: opcionId }));
  };

  const handleSubmit = async (forzado = false) => {
    if (!forzado && respondidas < total) {
      if (!window.confirm(`Tienes ${total - respondidas} pregunta(s) sin responder. ¿Deseas enviar de todas formas?`)) return;
    }
    clearTimeout(timerRef.current);
    setEnviando(true);

    const respuestasArray = Object.entries(respuestas).map(([pregunta_id, opcion_id]) => ({
      pregunta_id, opcion_id,
    }));

    const resultado = await calcularYGuardarExamen({
      cuestionarioId: cuestionario.id,
      estudianteId: perfil.id,
      respuestasEstudiante: respuestasArray,
    });

    setEnviando(false);
    onFinish(resultado, preguntas);
  };

  const preg = preguntas[preguntaActual];
  const tiempoAlertar = segundos !== null && segundos < 60;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col animate-in fade-in duration-200">
      {/* Barra superior */}
      <div className="flex-shrink-0 px-6 py-3 bg-slate-800 border-b border-slate-700 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-white font-bold text-sm truncate max-w-xs">{cuestionario.titulo}</span>
          <span className="text-slate-400 text-xs">{respondidas}/{total} respondidas</span>
        </div>

        {/* Barra de progreso */}
        <div className="flex-1 max-w-sm hidden sm:block">
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-300"
              style={{ width: `${progreso}%` }}
            />
          </div>
        </div>

        {/* Timer */}
        {segundos !== null && (
          <div className={`font-mono font-bold text-lg tabular-nums ${tiempoAlertar ? 'text-red-400 animate-pulse' : 'text-white'}`}>
            {formatTime(segundos)}
          </div>
        )}

        <button
          onClick={onSalir}
          className="text-slate-400 hover:text-white transition-colors text-sm"
        >
          Salir
        </button>
      </div>

      {/* Navegación de preguntas (pills) */}
      <div className="flex-shrink-0 px-6 py-3 bg-slate-800/50 border-b border-slate-700/50 overflow-x-auto">
        <div className="flex gap-1.5 min-w-max">
          {preguntas.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => setPreguntaActual(idx)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                idx === preguntaActual
                  ? 'bg-primary-600 text-white ring-2 ring-primary-400'
                  : respuestas[p.id]
                  ? 'bg-emerald-700 text-emerald-100'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Pregunta actual */}
      <div className="flex-1 overflow-y-auto px-4 py-8">
        {preg && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-start gap-4">
              <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary-600 text-white font-bold text-sm flex items-center justify-center">
                {preguntaActual + 1}
              </span>
              <div className="flex-1">
                <p className="text-xl font-semibold text-white leading-relaxed">{preg.enunciado}</p>
                <p className="text-slate-400 text-sm mt-1">{preg.puntaje} puntos</p>
              </div>
            </div>

            <div className="space-y-3 pl-0 sm:pl-14">
              {preg.opciones_respuesta?.map((opc, oi) => {
                const seleccionada = respuestas[preg.id] === opc.id;
                return (
                  <label
                    key={opc.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      seleccionada
                        ? 'border-primary-500 bg-primary-900/30 text-white'
                        : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-500 hover:text-white'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                      seleccionada ? 'border-primary-400 bg-primary-500' : 'border-slate-500'
                    }`}>
                      {seleccionada && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <input
                      type="radio"
                      name={`preg_${preg.id}`}
                      value={opc.id}
                      checked={seleccionada}
                      onChange={() => seleccionarOpcion(preg.id, opc.id)}
                      className="sr-only"
                    />
                    <span className="font-medium">
                      <span className="text-slate-400 mr-2">{String.fromCharCode(65 + oi)}.</span>
                      {opc.texto_opcion}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Barra inferior */}
      <div className="flex-shrink-0 px-6 py-4 bg-slate-800 border-t border-slate-700 flex items-center justify-between gap-4">
        <button
          onClick={() => setPreguntaActual(i => Math.max(0, i - 1))}
          disabled={preguntaActual === 0}
          className="px-4 py-2 text-sm text-slate-300 hover:text-white disabled:opacity-30 transition-colors"
        >
          ← Anterior
        </button>

        <div className="flex gap-3">
          {preguntaActual < total - 1 ? (
            <Button
              variant="primary"
              onClick={() => setPreguntaActual(i => Math.min(total - 1, i + 1))}
            >
              Siguiente →
            </Button>
          ) : (
            <Button
              variant="primary"
              isLoading={enviando}
              onClick={() => handleSubmit(false)}
            >
              ✅ Enviar examen
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// COMPONENTE: PANTALLA DE RESULTADOS
// ────────────────────────────────────────────────────────────────────────────
const PantallaResultados = ({ resultado, preguntas, respuestasEstudiante, onCerrar }) => {
  const { notaFinal, puntosGanados, maximoPosible, resumenPorPregunta } = resultado;

  const mensaje = notaFinal >= 80 ? '¡Excelente trabajo! 🎉'
    : notaFinal >= 60 ? 'Buen esfuerzo 👍'
    : 'Sigue practicando 📚';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-300">
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">

        {/* Resultado principal */}
        <div className={`rounded-2xl border-2 p-8 text-center ${getNotaBg(notaFinal)}`}>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-2">{mensaje}</p>
          <div className={`text-7xl font-black mb-3 ${getNotaColor(notaFinal)}`}>
            {notaFinal.toFixed(0)}
          </div>
          <p className="text-slate-500 text-sm">de 100 puntos</p>
          <p className="text-slate-400 text-xs mt-2">
            {puntosGanados} / {maximoPosible} puntos base correctos
          </p>

          {/* Barra de progreso resultado */}
          <div className="mt-4 h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                notaFinal >= 80 ? 'bg-emerald-500' : notaFinal >= 60 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${notaFinal}%` }}
            />
          </div>
        </div>

        {/* Revisión de respuestas */}
        <div className="space-y-3">
          <h3 className="text-white font-bold text-base">Revisión detallada</h3>
          {preguntas.map((preg, idx) => {
            const resumen = resumenPorPregunta?.find(r => r.pregunta_id === preg.id);
            const isCorrecta = resumen?.es_correcta;

            return (
              <div key={preg.id} className={`rounded-xl border p-4 space-y-3 ${
                isCorrecta
                  ? 'bg-emerald-900/20 border-emerald-700/50'
                  : 'bg-red-900/20 border-red-700/50'
              }`}>
                <div className="flex items-start gap-3">
                  <span className={`text-lg flex-shrink-0 ${isCorrecta ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isCorrecta ? '✓' : '✗'}
                  </span>
                  <div>
                    <p className="text-slate-200 text-sm font-medium">{idx + 1}. {preg.enunciado}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{preg.puntaje} pts</p>
                  </div>
                </div>

                <div className="pl-7 space-y-1.5">
                  {preg.opciones_respuesta?.map(opc => {
                    const esLaSeleccionada = opc.id === resumen?.opcion_id;
                    const esLaCorrecta = opc.es_correcta;
                    return (
                      <div key={opc.id} className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${
                        esLaCorrecta
                          ? 'bg-emerald-800/40 text-emerald-300 font-medium'
                          : esLaSeleccionada && !esLaCorrecta
                          ? 'bg-red-800/40 text-red-300 line-through'
                          : 'text-slate-400'
                      }`}>
                        <span>{esLaCorrecta ? '✓' : esLaSeleccionada ? '✗' : '○'}</span>
                        {opc.texto_opcion}
                        {esLaCorrecta && <span className="ml-auto font-bold">Correcta</span>}
                        {esLaSeleccionada && !esLaCorrecta && <span className="ml-auto">Tu respuesta</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <Button variant="primary" onClick={onCerrar} className="w-full">
          Cerrar y volver
        </Button>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ────────────────────────────────────────────────────────────────────────────
const SeccionCuestionarios = ({ cursoId }) => {
  const { role, perfil } = useAuth();
  const esDocente = role === 'administrador' || role === 'docente';

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  // Estado para el examen activo
  const [examenActivo, setExamenActivo] = useState(null);        // cuestionario obj
  const [resultadoActivo, setResultadoActivo] = useState(null);  // { resultado, preguntas }

  // Intentos previos del estudiante
  const [intentosPrevios, setIntentosPrevios] = useState({});    // { cuestionarioId: intento }

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    const { data } = await getCuestionariosPorCurso(cursoId);
    if (data) {
      setQuizzes(data);
      // Cargar intentos previos para cada cuestionario
      if (!esDocente && perfil?.id) {
        const intentos = {};
        for (const q of data) {
          const { data: intento } = await getMiIntentoCuestionario(q.id, perfil.id);
          if (intento) intentos[q.id] = intento;
        }
        setIntentosPrevios(intentos);
      }
    }
    setLoading(false);
  }, [cursoId, perfil?.id, esDocente]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const showFeedback = (type, text) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback({ type: '', text: '' }), 5000);
  };

  const handleCrear = async (formData) => {
    setSaving(true);
    const { error } = await generarCuestionarioCompleto({
      cursoId,
      perfilId: perfil.id,
      ...formData,
    });
    setSaving(false);
    if (error) {
      showFeedback('error', 'Error al crear: ' + error.message);
    } else {
      showFeedback('success', '✅ Cuestionario publicado correctamente.');
      setShowForm(false);
      cargarDatos();
    }
  };

  const handleExamenFinalizado = (resultado, preguntas) => {
    setExamenActivo(null);
    setResultadoActivo({ resultado, preguntas });
    cargarDatos();
  };

  if (loading) return (
    <div className="pt-4 space-y-3 animate-pulse">
      {[1, 2].map(i => <div key={i} className="h-24 bg-slate-100 dark:bg-dark-bg rounded-xl" />)}
    </div>
  );

  return (
    <>
      {/* Modales por encima */}
      {examenActivo && (
        <PantallaExamen
          cuestionario={examenActivo}
          perfil={perfil}
          onFinish={handleExamenFinalizado}
          onSalir={() => {
            if (window.confirm('¿Salir del examen? Tu progreso se perderá.')) setExamenActivo(null);
          }}
        />
      )}

      {resultadoActivo && (
        <PantallaResultados
          resultado={resultadoActivo.resultado}
          preguntas={resultadoActivo.preguntas}
          onCerrar={() => setResultadoActivo(null)}
        />
      )}

      {/* Contenido principal */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <span>📋</span> Cuestionarios
            {quizzes.length > 0 && (
              <span className="text-sm font-normal text-slate-500">({quizzes.length})</span>
            )}
          </h2>
          {esDocente && !showForm && (
            <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
              + Nuevo cuestionario
            </Button>
          )}
        </div>

        {feedback.text && <Alert type={feedback.type}>{feedback.text}</Alert>}

        {showForm && esDocente && (
          <FormularioCreacion
            onSubmit={handleCrear}
            onCancel={() => setShowForm(false)}
            isLoading={saving}
          />
        )}

        {quizzes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-200 dark:border-dark-border rounded-2xl text-center">
            <div className="text-4xl mb-2 opacity-30">📋</div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {esDocente ? 'No hay cuestionarios. Crea el primero.' : 'No hay cuestionarios disponibles.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {quizzes.map(quiz => {
              const intentoPrevio = intentosPrevios[quiz.id];
              const yaCompletado = !!intentoPrevio;
              const numPreguntas = quiz.preguntas?.length || 0;

              return (
                <div key={quiz.id} className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-800 dark:text-white text-base">{quiz.titulo}</h3>
                        <span className="text-xs bg-slate-100 dark:bg-dark-bg text-slate-500 px-2 py-0.5 rounded-full">
                          {numPreguntas} pregunta{numPreguntas !== 1 ? 's' : ''}
                        </span>
                        {quiz.tiempo_limite_minutos && (
                          <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">
                            ⏱ {quiz.tiempo_limite_minutos} min
                          </span>
                        )}
                      </div>
                      {quiz.descripcion && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 truncate">{quiz.descripcion}</p>
                      )}

                      {/* Resultado previo */}
                      {yaCompletado && !esDocente && (
                        <div className={`mt-2 inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full ${getNotaBg(intentoPrevio.puntaje_total)} ${getNotaColor(intentoPrevio.puntaje_total)}`}>
                          🎓 Completado: {intentoPrevio.puntaje_total?.toFixed(0)}/100 pts
                        </div>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex-shrink-0">
                      {esDocente ? (
                        <button className="text-xs text-slate-400 hover:text-primary-600 transition-colors">
                          Vista previa
                        </button>
                      ) : yaCompletado ? (
                        <button
                          onClick={() => {
                            // Mostrar resultado anterior
                            setResultadoActivo({
                              resultado: {
                                notaFinal: intentoPrevio.puntaje_total,
                                puntosGanados: intentoPrevio.puntaje_total,
                                maximoPosible: 100,
                                resumenPorPregunta: [],
                              },
                              preguntas: quiz.preguntas || [],
                            });
                          }}
                          className="text-xs px-3 py-1.5 bg-slate-100 dark:bg-dark-bg text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          Ver resultado
                        </button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setExamenActivo(quiz)}
                        >
                          🖊 Comenzar examen
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default SeccionCuestionarios;
