import { getPlnResultados, RESULTADOS_ESPERADOS } from '@/services/pln.service';
import { getFuentes, FUENTES_INICIALES } from '@/services/fuentes.service';
import { FRASES_NEGATIVAS, FRASES_NEUTRAS, FRASES_POSITIVAS } from '@/data/scraping';
import type { FactorTema, PlnResultados, Polaridad } from '@/types/pln';
import type { Fuente } from '@/types/fuentes';

/**
 * Opinión ya clasificada. No contiene ningún dato que identifique al autor:
 * solo el texto, la fuente, la fecha y el resultado del análisis PLN.
 */
export interface OpinionAnalizada {
  id: string;
  fuenteId: string;
  fuente: string;
  texto: string;
  fecha: string; // YYYY-MM-DD
  polaridad: Polaridad;
  factor: string;
}

export interface AnalisisConsolidado {
  resultados: PlnResultados;
  opiniones: OpinionAnalizada[];
  /** Fecha del análisis: los periodos se calculan hacia atrás desde aquí. */
  referencia: string;
  /** true cuando no hay un análisis PLN guardado y se usan datos de ejemplo. */
  esEjemplo: boolean;
}

export const PERIODOS = [
  { valor: '7d', etiqueta: 'Últimos 7 días', dias: 7 },
  { valor: '30d', etiqueta: 'Últimos 30 días', dias: 30 },
  { valor: '90d', etiqueta: 'Últimos 90 días', dias: 90 },
  { valor: 'todo', etiqueta: 'Últimos 6 meses', dias: 180 },
] as const;

export type PeriodoId = (typeof PERIODOS)[number]['valor'];

export function etiquetaPeriodo(id: string): string {
  return PERIODOS.find((p) => p.valor === id)?.etiqueta ?? id;
}

/** Generador pseudoaleatorio con semilla: mismos datos en cada visita. */
function crearAzar(semilla: number) {
  let s = semilla >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function elegirPonderado<T>(items: T[], pesos: number[], r: number): T {
  const total = pesos.reduce((a, b) => a + b, 0);
  let acumulado = 0;
  for (let i = 0; i < items.length; i++) {
    acumulado += pesos[i]! / total;
    if (r < acumulado) return items[i]!;
  }
  return items[items.length - 1]!;
}

function aFechaISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function construirOpiniones(
  resultados: PlnResultados,
  fuentes: Fuente[],
  referencia: Date
): OpinionAnalizada[] {
  const azar = crearAzar(2026);
  const total = resultados.corpus.validos;
  const nPos = Math.round((total * resultados.sentimientos.positivo) / 100);
  const nNeu = Math.round((total * resultados.sentimientos.neutral) / 100);
  const polaridades: Polaridad[] = [
    ...Array<Polaridad>(nPos).fill('positivo'),
    ...Array<Polaridad>(nNeu).fill('neutral'),
    ...Array<Polaridad>(Math.max(0, total - nPos - nNeu)).fill('negativo'),
  ];
  // Mezcla determinista (Fisher-Yates)
  for (let i = polaridades.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [polaridades[i], polaridades[j]] = [polaridades[j]!, polaridades[i]!];
  }

  const lista = fuentes.length > 0 ? fuentes : FUENTES_INICIALES;
  const pesosFuente = lista.map((_, i) => 1 / (i + 1.5));
  const factores = resultados.factores;
  const frases: Record<Polaridad, string[]> = {
    positivo: FRASES_POSITIVAS,
    neutral: FRASES_NEUTRAS,
    negativo: FRASES_NEGATIVAS,
  };

  return polaridades.map((polaridad, i) => {
    const fuente = elegirPonderado(lista, pesosFuente, azar());
    // Más opiniones recientes que antiguas (sesgo hacia el presente).
    const diasAtras = Math.floor(Math.pow(azar(), 1.4) * 180);
    const fecha = new Date(referencia.getTime() - diasAtras * 86_400_000);
    const factor = elegirPonderado(
      factores.map((f) => f.nombre),
      factores.map((f) => f.porcentaje),
      azar()
    );
    const opciones = frases[polaridad];
    return {
      id: `OP-${String(i + 1).padStart(4, '0')}`,
      fuenteId: fuente.id,
      fuente: `${fuente.id} · ${fuente.nombre}`,
      texto: opciones[Math.floor(azar() * opciones.length)]!,
      fecha: aFechaISO(fecha),
      polaridad,
      factor,
    };
  });
}

export function getAnalisisConsolidado(): AnalisisConsolidado {
  const guardado = getPlnResultados();
  const resultados: PlnResultados =
    guardado ?? { ...RESULTADOS_ESPERADOS, generadoEn: new Date().toISOString() };
  const referencia = new Date(resultados.generadoEn);
  return {
    resultados,
    opiniones: construirOpiniones(resultados, getFuentes(), referencia),
    referencia: referencia.toISOString(),
    esEjemplo: !guardado,
  };
}

export function fuentesDisponibles(): { id: string; nombre: string }[] {
  return getFuentes().map((f) => ({ id: f.id, nombre: `${f.id} — ${f.nombre}` }));
}

export interface FiltroAnalisis {
  fuenteId?: string | undefined; // "todas" o vacío = sin filtro
  periodo?: string | undefined; // id de PERIODOS
}

export function filtrarOpiniones(
  opiniones: OpinionAnalizada[],
  filtro: FiltroAnalisis,
  referencia: string | Date
): OpinionAnalizada[] {
  const ref = new Date(referencia);
  const dias = PERIODOS.find((p) => p.valor === filtro.periodo)?.dias;
  const desde = dias ? aFechaISO(new Date(ref.getTime() - (dias - 1) * 86_400_000)) : null;
  return opiniones.filter((o) => {
    if (filtro.fuenteId && filtro.fuenteId !== 'todas' && o.fuenteId !== filtro.fuenteId) return false;
    if (desde && o.fecha < desde) return false;
    return true;
  });
}

export interface FactorResumen {
  nombre: string;
  menciones: number;
  negativas: number;
  porcentaje: number; // % de las opiniones filtradas
  terminos: string[];
}

export interface ResumenAnalisis {
  total: number;
  positivas: number;
  neutrales: number;
  negativas: number;
  pctPositivo: number;
  pctNeutral: number;
  pctNegativo: number;
  factores: FactorResumen[];
}

const pct = (n: number, total: number) => (total ? Math.round((n / total) * 1000) / 10 : 0);

export function resumirOpiniones(
  opiniones: OpinionAnalizada[],
  factoresBase: FactorTema[]
): ResumenAnalisis {
  const total = opiniones.length;
  const positivas = opiniones.filter((o) => o.polaridad === 'positivo').length;
  const neutrales = opiniones.filter((o) => o.polaridad === 'neutral').length;
  const negativas = opiniones.filter((o) => o.polaridad === 'negativo').length;
  const factores = factoresBase
    .map((f) => {
      const delFactor = opiniones.filter((o) => o.factor === f.nombre);
      return {
        nombre: f.nombre,
        menciones: delFactor.length,
        negativas: delFactor.filter((o) => o.polaridad === 'negativo').length,
        porcentaje: pct(delFactor.length, total),
        terminos: f.terminos,
      };
    })
    .sort((a, b) => b.menciones - a.menciones);
  return {
    total,
    positivas,
    neutrales,
    negativas,
    pctPositivo: pct(positivas, total),
    pctNeutral: pct(neutrales, total),
    pctNegativo: pct(negativas, total),
    factores,
  };
}

/** Evolución por mes (últimos 6 meses hasta la fecha de referencia). */
export function evolucionMensual(opiniones: OpinionAnalizada[], referencia: string | Date) {
  const ref = new Date(referencia);
  const meses: { clave: string; mes: string; positivo: number; neutral: number; negativo: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() - i, 1));
    meses.push({
      clave: d.toISOString().slice(0, 7),
      mes: d.toLocaleDateString('es-BO', { month: 'short', timeZone: 'UTC' }),
      positivo: 0,
      neutral: 0,
      negativo: 0,
    });
  }
  opiniones.forEach((o) => {
    const m = meses.find((x) => x.clave === o.fecha.slice(0, 7));
    if (m) m[o.polaridad]++;
  });
  return meses;
}

const RECOMENDACION_POR_FACTOR: Record<string, string> = {
  'Gestión administrativa':
    'Optimizar los procesos de inscripción y trámites administrativos, reduciendo tiempos de espera en secretaría.',
  'Calidad académica':
    'Abrir canales de retroalimentación entre estudiantes y dirección académica sobre docentes y plan de estudios.',
  Infraestructura:
    'Priorizar el mantenimiento de aulas y la renovación de equipos de laboratorio del campus antiguo.',
  'Costos y pagos':
    'Transparentar el uso de los recursos económicos y comunicar con anticipación los cambios en las cuotas.',
  'Atención estudiantil':
    'Fortalecer bienestar estudiantil con tutores asignados por carrera y difusión del sistema de becas.',
  'Régimen disciplinario':
    'Difundir el reglamento disciplinario y notificar las sanciones con criterios claros y oportunos.',
  'Imagen institucional':
    'Reforzar la comunicación institucional en redes sociales destacando logros académicos y de investigación.',
};

export function recomendacionesPara(factores: FactorResumen[], max = 5): string[] {
  return [...factores]
    .sort((a, b) => b.negativas - a.negativas || b.menciones - a.menciones)
    .slice(0, max)
    .map(
      (f) =>
        `${f.nombre} (${f.negativas} opiniones negativas): ${
          RECOMENDACION_POR_FACTOR[f.nombre] ?? 'Analizar las opiniones asociadas y definir acciones de mejora.'
        }`
    );
}
