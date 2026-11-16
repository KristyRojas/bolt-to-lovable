import { normalizar, PERMISOS_DEFECTO, type MatrizPermisos } from '@/lib/permisos';

export const PERMISOS_KEY = 'emi_insight_permisos_rol';
const HISTORIAL_KEY = 'emi_insight_permisos_historial';

export interface CambioPermisos {
  por: string;
  en: string;
  accion: 'guardar' | 'restablecer';
}

export function getPermisos(): MatrizPermisos {
  if (typeof window === 'undefined') return normalizar(PERMISOS_DEFECTO);
  try {
    const raw = window.localStorage.getItem(PERMISOS_KEY);
    return normalizar(raw ? JSON.parse(raw) : null);
  } catch {
    return normalizar(PERMISOS_DEFECTO);
  }
}

export function guardarPermisos(m: MatrizPermisos, cambio: CambioPermisos): MatrizPermisos {
  const limpio = normalizar(m);
  window.localStorage.setItem(PERMISOS_KEY, JSON.stringify(limpio));
  const historial = [cambio, ...getHistorialPermisos()].slice(0, 10);
  window.localStorage.setItem(HISTORIAL_KEY, JSON.stringify(historial));
  return limpio;
}

export function getHistorialPermisos(): CambioPermisos[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(HISTORIAL_KEY);
    const datos = raw ? (JSON.parse(raw) as CambioPermisos[]) : [];
    return Array.isArray(datos) ? datos : [];
  } catch {
    return [];
  }
}
