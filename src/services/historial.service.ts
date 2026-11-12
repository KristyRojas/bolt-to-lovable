export interface ReporteGuardado {
  id: string;
  titulo: string;
  fecha: string;
  autor: string;
  periodo: string; // etiqueta legible
  fuente: string; // etiqueta legible
  formato: 'pdf' | 'csv';
  secciones: string[];
  /** Filtros usados, para volver a generar el mismo contenido desde el historial. */
  periodoId?: string;
  fuenteId?: string;
  destinatario?: string;
}

const STORAGE_KEY = 'percepcionemi_reportes';

export function getReportes(): ReporteGuardado[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const datos = JSON.parse(raw) as ReporteGuardado[];
    return Array.isArray(datos) ? datos : [];
  } catch {
    return [];
  }
}

export function guardarReporte(reporte: ReporteGuardado): void {
  if (typeof window === 'undefined') return;
  const lista = getReportes();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([reporte, ...lista]));
}

export function eliminarReporte(id: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(getReportes().filter((r) => r.id !== id))
  );
}
