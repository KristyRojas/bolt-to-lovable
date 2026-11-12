import { beforeEach, describe, expect, it } from 'vitest';
import {
  construirOpiniones,
  filtrarOpiniones,
  resumirOpiniones,
} from '@/services/analisis.service';
import { RESULTADOS_ESPERADOS } from '@/services/pln.service';
import { FUENTES_INICIALES } from '@/services/fuentes.service';
import { eliminarReporte, getReportes, guardarReporte } from '@/services/historial.service';
import { contenidoReporte, filasCsv } from '@/lib/reporte-datos';

const referencia = new Date('2026-11-12T12:00:00Z');
const resultados = { ...RESULTADOS_ESPERADOS, generadoEn: referencia.toISOString() };
const opiniones = construirOpiniones(resultados, FUENTES_INICIALES, referencia);

describe('datos del análisis', () => {
  it('usa las opiniones válidas del análisis PLN guardado', () => {
    expect(opiniones).toHaveLength(172);
  });

  it('no incluye datos que identifiquen al autor', () => {
    expect(Object.keys(opiniones[0]!).sort()).toEqual(
      ['factor', 'fecha', 'fuente', 'fuenteId', 'id', 'polaridad', 'texto'].sort()
    );
  });
});

describe('filtros del dashboard', () => {
  it('el filtro de fuente deja solo opiniones de esa fuente', () => {
    const f = filtrarOpiniones(opiniones, { fuenteId: 'F02', periodo: 'todo' }, referencia);
    expect(f.length).toBeGreaterThan(0);
    expect(f.length).toBeLessThan(opiniones.length);
    expect(f.every((o) => o.fuenteId === 'F02')).toBe(true);
  });

  it('"Últimos 7 días" deja solo opiniones desde el 6 de noviembre', () => {
    const f = filtrarOpiniones(opiniones, { periodo: '7d' }, referencia);
    expect(f.length).toBeLessThan(opiniones.length);
    expect(f.every((o) => o.fecha >= '2026-11-06' && o.fecha <= '2026-11-12')).toBe(true);
  });

  it('los KPI suman el total filtrado', () => {
    const r = resumirOpiniones(opiniones, resultados.factores);
    expect(r.positivas + r.neutrales + r.negativas).toBe(r.total);
  });
});

describe('historial de reportes', () => {
  beforeEach(() => window.localStorage.clear());

  const base = {
    titulo: 'Prueba',
    fecha: referencia.toISOString(),
    autor: 'Admin',
    periodo: 'Últimos 30 días',
    fuente: 'Todas las fuentes',
    formato: 'pdf' as const,
    secciones: ['resumen'],
  };

  it('guarda y elimina reportes en el navegador', () => {
    guardarReporte({ ...base, id: 'a' });
    guardarReporte({ ...base, id: 'b' });
    expect(getReportes().map((r) => r.id)).toEqual(['b', 'a']);
    eliminarReporte('a');
    expect(getReportes().map((r) => r.id)).toEqual(['b']);
  });

  it('el CSV incluye solo las secciones elegidas', () => {
    const analisis = { resultados, opiniones, referencia: referencia.toISOString(), esEjemplo: false };
    const { filas } = filasCsv(contenidoReporte({ ...base, secciones: ['factores'] }, analisis));
    const secciones = new Set(filas.map((f) => f[0]));
    expect(secciones.has('Factores')).toBe(true);
    expect(secciones.has('Recomendaciones')).toBe(false);
    expect(secciones.has('Indicadores')).toBe(false);
  });
});
