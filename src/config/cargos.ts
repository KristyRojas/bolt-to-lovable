import type { Rol } from '@/types';

/**
 * Unidades y cargos predefinidos. En los formularios de usuario el cargo no
 * se escribe: se elige la unidad y luego uno de sus cargos. Cada cargo trae un
 * rol sugerido que el Superadministrador puede cambiar.
 */
export interface CargoDef {
  nombre: string;
  rolSugerido: Rol;
}

export interface UnidadDef {
  id: string;
  nombre: string;
  /** Nombre breve para espacios reducidos (sidebar, encabezado). */
  corto: string;
  cargos: CargoDef[];
}

export const UNIDADES: UnidadDef[] = [
  {
    id: 'bienestar',
    nombre: 'UNIDAD DE EXTENSIÓN Y BIENESTAR UNIVERSITARIO – UNIDAD ACADÉMICA LA PAZ',
    corto: 'Extensión y Bienestar Universitario',
    cargos: [
      { nombre: 'Jefe de Unidad', rolSugerido: 'superadministrador' },
      { nombre: 'Responsable de Marketing y Publicidad', rolSugerido: 'administrador' },
      {
        nombre: 'Responsable de Gabinete Psicológico y Extensión Universitaria',
        rolSugerido: 'administrador',
      },
      { nombre: 'Secretaria', rolSugerido: 'usuario' },
    ],
  },
  {
    id: 'sistemas',
    nombre: 'CARRERA DE INGENIERÍA DE SISTEMAS – UNIDAD ACADÉMICA LA PAZ',
    corto: 'Ingeniería de Sistemas',
    cargos: [
      { nombre: 'Jefe de Carrera', rolSugerido: 'administrador' },
      {
        nombre: 'Docente a Dedicación Exclusiva (Coordinador Académico)',
        rolSugerido: 'administrador',
      },
      { nombre: 'Secretaria', rolSugerido: 'usuario' },
      { nombre: 'Auxiliar', rolSugerido: 'usuario' },
    ],
  },
];

export function getUnidad(nombre: string | undefined): UnidadDef | undefined {
  return UNIDADES.find((u) => u.nombre === nombre);
}

export function cargosDeUnidad(nombreUnidad: string | undefined): CargoDef[] {
  return getUnidad(nombreUnidad)?.cargos ?? [];
}

export function rolSugerido(nombreUnidad: string, nombreCargo: string): Rol | undefined {
  return cargosDeUnidad(nombreUnidad).find((c) => c.nombre === nombreCargo)?.rolSugerido;
}

export function unidadCorta(nombreUnidad: string | undefined): string {
  return getUnidad(nombreUnidad)?.corto ?? nombreUnidad ?? '';
}
