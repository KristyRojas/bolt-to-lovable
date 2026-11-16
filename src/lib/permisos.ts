import {
  ESTRUCTURA_MODULOS,
  TODOS_SUBMODULOS,
  type ModuloId,
  type RutaModulo,
  type SubmoduloId,
} from '@/config/modules';
import type { Rol } from '@/types';

/** Para cada rol, qué submódulos puede abrir. */
export type MatrizPermisos = Record<Rol, Record<SubmoduloId, boolean>>;

export const ROLES: Rol[] = ['superadministrador', 'administrador', 'usuario'];

function fila(activos: SubmoduloId[]): Record<SubmoduloId, boolean> {
  return Object.fromEntries(TODOS_SUBMODULOS.map((s) => [s, activos.includes(s)])) as Record<
    SubmoduloId,
    boolean
  >;
}

export const PERMISOS_DEFECTO: MatrizPermisos = {
  superadministrador: fila(TODOS_SUBMODULOS),
  administrador: fila(TODOS_SUBMODULOS.filter((s) => s !== 'usuarios')),
  usuario: fila(['dashboard', 'buscar', 'historial']),
};

export function clonar(m: MatrizPermisos): MatrizPermisos {
  return {
    superadministrador: { ...m.superadministrador },
    administrador: { ...m.administrador },
    usuario: { ...m.usuario },
  };
}

/**
 * Aplica las reglas fijas: el Superadministrador siempre tiene todo y
 * GESTIÓN DE USUARIOS es solo suya. También completa valores faltantes.
 */
export function normalizar(entrada: Partial<Record<Rol, Partial<Record<SubmoduloId, boolean>>>> | null | undefined): MatrizPermisos {
  const m = clonar(PERMISOS_DEFECTO);
  for (const rol of ROLES) {
    for (const s of TODOS_SUBMODULOS) {
      const v = entrada?.[rol]?.[s];
      if (typeof v === 'boolean') m[rol][s] = v;
    }
  }
  m.superadministrador = fila(TODOS_SUBMODULOS);
  m.administrador.usuarios = false;
  m.usuario.usuarios = false;
  return m;
}

export function moduloBloqueado(rol: Rol, modulo: ModuloId): boolean {
  return rol === 'superadministrador' || modulo === 'usuarios';
}

function subsDe(modulo: ModuloId): SubmoduloId[] {
  return ESTRUCTURA_MODULOS.find((m) => m.id === modulo)?.submodulos.map((s) => s.id) ?? [];
}

/** 'todo' | 'parcial' | 'nada' según los submódulos activos del módulo. */
export function estadoModulo(m: MatrizPermisos, rol: Rol, modulo: ModuloId): 'todo' | 'parcial' | 'nada' {
  const subs = subsDe(modulo);
  const activos = subs.filter((s) => m[rol][s]).length;
  if (activos === 0) return 'nada';
  return activos === subs.length ? 'todo' : 'parcial';
}

export function conModulo(m: MatrizPermisos, rol: Rol, modulo: ModuloId, activo: boolean): MatrizPermisos {
  if (moduloBloqueado(rol, modulo)) return m;
  const n = clonar(m);
  for (const s of subsDe(modulo)) n[rol][s] = activo;
  return n;
}

export function conSubmodulo(m: MatrizPermisos, rol: Rol, sub: SubmoduloId, activo: boolean): MatrizPermisos {
  const modulo = ESTRUCTURA_MODULOS.find((x) => x.submodulos.some((s) => s.id === sub));
  if (!modulo || moduloBloqueado(rol, modulo.id)) return m;
  const n = clonar(m);
  n[rol][sub] = activo;
  return n;
}

export function puedeAcceder(m: MatrizPermisos, rol: Rol | null | undefined, sub: SubmoduloId): boolean {
  if (!rol) return false;
  return normalizar(m)[rol][sub];
}

/** Primera pantalla que el rol puede abrir, o null si no tiene ninguna. */
export function rutaInicial(m: MatrizPermisos, rol: Rol): RutaModulo | null {
  const preferidas: SubmoduloId[] = ['dashboard', ...TODOS_SUBMODULOS];
  for (const id of preferidas) {
    if (puedeAcceder(m, rol, id)) {
      for (const mod of ESTRUCTURA_MODULOS) {
        const s = mod.submodulos.find((x) => x.id === id);
        if (s) return s.href;
      }
    }
  }
  return null;
}

export function iguales(a: MatrizPermisos, b: MatrizPermisos): boolean {
  return ROLES.every((r) => TODOS_SUBMODULOS.every((s) => a[r][s] === b[r][s]));
}
