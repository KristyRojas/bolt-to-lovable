import {
  filtrarOpiniones,
  resumirOpiniones,
  recomendacionesPara,
  type AnalisisConsolidado,
  type ResumenAnalisis,
} from '@/services/analisis.service';
import type { ReporteGuardado } from '@/services/historial.service';
import type { MetricasBeto } from '@/types/pln';

export const SECCIONES_REPORTE = [
  { id: 'resumen', etiqueta: 'Resumen ejecutivo' },
  { id: 'metricas', etiqueta: 'Métricas e indicadores' },
  { id: 'factores', etiqueta: 'Factores de percepción' },
  { id: 'recomendaciones', etiqueta: 'Recomendaciones' },
] as const;

export function etiquetaSeccion(id: string): string {
  return SECCIONES_REPORTE.find((s) => s.id === id)?.etiqueta ?? id;
}

/** Contenido de un reporte, listo para PDF, CSV o vista previa. */
export interface ContenidoReporte {
  titulo: string;
  periodo: string;
  fuente: string;
  destinatario: string;
  autor: string;
  fechaGeneracion: string;
  secciones: string[];
  resumen: ResumenAnalisis;
  metricas: MetricasBeto;
  cvScore: number;
  recomendaciones: string[];
  textoResumen: string;
}

export function textoResumenEjecutivo(resumen: ResumenAnalisis): string {
  if (resumen.total === 0) {
    return 'No se registran opiniones para la fuente y el periodo seleccionados.';
  }
  const [f1, f2] = resumen.factores;
  return (
    `Se analizaron ${resumen.total} opiniones válidas: ${resumen.pctPositivo}% positivas, ` +
    `${resumen.pctNeutral}% neutrales y ${resumen.pctNegativo}% negativas. ` +
    (f1
      ? `Los factores con mayor presencia son ${f1.nombre} (${f1.porcentaje}%)` +
        (f2 ? ` y ${f2.nombre} (${f2.porcentaje}%).` : '.')
      : '')
  );
}

export function contenidoReporte(
  reporte: Pick<ReporteGuardado, 'titulo' | 'periodo' | 'fuente' | 'secciones' | 'autor' | 'fecha'> &
    Partial<Pick<ReporteGuardado, 'periodoId' | 'fuenteId' | 'destinatario'>>,
  analisis: AnalisisConsolidado
): ContenidoReporte {
  const opiniones = filtrarOpiniones(
    analisis.opiniones,
    { fuenteId: reporte.fuenteId, periodo: reporte.periodoId ?? 'todo' },
    analisis.referencia
  );
  const resumen = resumirOpiniones(opiniones, analisis.resultados.factores);
  return {
    titulo: reporte.titulo,
    periodo: reporte.periodo,
    fuente: reporte.fuente,
    destinatario: reporte.destinatario ?? 'Dirección Académica',
    autor: reporte.autor,
    fechaGeneracion: reporte.fecha,
    secciones: reporte.secciones,
    resumen,
    metricas: analisis.resultados.metricasBeto,
    cvScore: analisis.resultados.cvScore,
    recomendaciones: recomendacionesPara(resumen.factores),
    textoResumen: textoResumenEjecutivo(resumen),
  };
}

export function nombreArchivo(titulo: string, ext: 'pdf' | 'csv'): string {
  const base = titulo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
  return `${base || 'reporte'}.${ext}`;
}

/** Filas del CSV (separado por punto y coma) según las secciones elegidas. */
export function filasCsv(c: ContenidoReporte): { encabezados: string[]; filas: string[][] } {
  const filas: string[][] = [
    ['Reporte', 'Título', c.titulo, ''],
    ['Reporte', 'Periodo', c.periodo, ''],
    ['Reporte', 'Fuente', c.fuente, ''],
    ['Reporte', 'Destinatario', c.destinatario, ''],
    ['Reporte', 'Generado por', c.autor, new Date(c.fechaGeneracion).toLocaleDateString('es-BO')],
  ];
  const r = c.resumen;
  if (c.secciones.includes('resumen')) {
    filas.push(['Resumen ejecutivo', 'Texto', c.textoResumen, '']);
  }
  if (c.secciones.includes('metricas')) {
    filas.push(
      ['Indicadores', 'Total opiniones', String(r.total), '100%'],
      ['Indicadores', 'Positivas', String(r.positivas), `${r.pctPositivo}%`],
      ['Indicadores', 'Neutrales', String(r.neutrales), `${r.pctNeutral}%`],
      ['Indicadores', 'Negativas', String(r.negativas), `${r.pctNegativo}%`],
      ['Métricas del modelo', 'F1-Score (BETO)', String(c.metricas.f1), '>= 0.75'],
      ['Métricas del modelo', 'Precisión (BETO)', String(c.metricas.precision), '>= 0.75'],
      ['Métricas del modelo', 'Recall (BETO)', String(c.metricas.recall), '>= 0.70'],
      ['Métricas del modelo', 'Coherencia CV (BERTopic)', String(c.cvScore), '>= 0.50']
    );
  }
  if (c.secciones.includes('factores')) {
    r.factores.forEach((f) =>
      filas.push([
        'Factores',
        f.nombre,
        `${f.menciones} menciones (${f.negativas} negativas)`,
        `${f.porcentaje}% · ${f.terminos.join(', ')}`,
      ])
    );
  }
  if (c.secciones.includes('recomendaciones')) {
    c.recomendaciones.forEach((rec, i) => filas.push(['Recomendaciones', String(i + 1), rec, '']));
  }
  return { encabezados: ['Sección', 'Indicador', 'Valor', 'Detalle'], filas };
}
