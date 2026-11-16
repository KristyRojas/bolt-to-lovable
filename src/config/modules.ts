/**
 * Nombres oficiales de los módulos y su estructura de submódulos (rutas).
 * Toda la app (sidebar, encabezados, migas de pan, permisos, reportes) usa
 * estas constantes: cambiar un nombre aquí lo cambia en todas partes.
 */
export const MODULOS = {
  usuarios: 'GESTIÓN DE USUARIOS',
  fuentes: 'GESTIÓN DE FUENTE Y RECOPILACIÓN',
  pln: 'PROCESAMIENTO Y ANÁLISIS PLN',
  informes: 'INFORMES Y REPORTES',
} as const;

export type ModuloId = keyof typeof MODULOS;

export type RutaModulo =
  | '/usuarios'
  | '/fuentes'
  | '/scraping'
  | '/pln'
  | '/informes'
  | '/dashboard'
  | '/buscar'
  | '/reportes'
  | '/historial';

export type SubmoduloId =
  | 'usuarios'
  | 'fuentes'
  | 'scraping'
  | 'pln'
  | 'informes-inicio'
  | 'dashboard'
  | 'buscar'
  | 'reportes'
  | 'historial';

export interface Submodulo {
  id: SubmoduloId;
  etiqueta: string;
  href: RutaModulo;
}

export interface ModuloDef {
  id: ModuloId;
  nombre: string;
  submodulos: Submodulo[];
}

export const ESTRUCTURA_MODULOS: ModuloDef[] = [
  {
    id: 'usuarios',
    nombre: MODULOS.usuarios,
    submodulos: [{ id: 'usuarios', etiqueta: 'Usuarios y permisos', href: '/usuarios' }],
  },
  {
    id: 'fuentes',
    nombre: MODULOS.fuentes,
    submodulos: [
      { id: 'fuentes', etiqueta: 'Fuentes', href: '/fuentes' },
      { id: 'scraping', etiqueta: 'Ejecutar scraping', href: '/scraping' },
    ],
  },
  {
    id: 'pln',
    nombre: MODULOS.pln,
    submodulos: [{ id: 'pln', etiqueta: 'Pipeline BETO y BERTopic', href: '/pln' }],
  },
  {
    id: 'informes',
    nombre: MODULOS.informes,
    submodulos: [
      { id: 'informes-inicio', etiqueta: 'Inicio informes', href: '/informes' },
      { id: 'dashboard', etiqueta: 'Dashboard', href: '/dashboard' },
      { id: 'buscar', etiqueta: 'Buscar y filtrar', href: '/buscar' },
      { id: 'reportes', etiqueta: 'Generar reportes', href: '/reportes' },
      { id: 'historial', etiqueta: 'Historial', href: '/historial' },
    ],
  },
];

export const TODOS_SUBMODULOS: SubmoduloId[] = ESTRUCTURA_MODULOS.flatMap((m) =>
  m.submodulos.map((s) => s.id)
);

/** Submódulo al que pertenece una ruta (o null si la ruta no es de un módulo). */
export function submoduloDeRuta(pathname: string): { modulo: ModuloDef; sub: Submodulo } | null {
  for (const modulo of ESTRUCTURA_MODULOS) {
    const sub = modulo.submodulos.find(
      (s) => pathname === s.href || pathname.startsWith(`${s.href}/`)
    );
    if (sub) return { modulo, sub };
  }
  return null;
}
