import {
  BrainCircuit,
  FileBarChart,
  FileText,
  History,
  LayoutDashboard,
  Radar,
  Rss,
  Search,
  Users,
} from 'lucide-react';
import type { Rol } from '@/types';

export interface ItemNav {
  href:
    | '/usuarios'
    | '/fuentes'
    | '/scraping'
    | '/pln'
    | '/informes'
    | '/dashboard'
    | '/buscar'
    | '/reportes'
    | '/historial';
  etiqueta: string;
  icono: typeof Users;
  roles: Rol[];
}

const TODOS: Rol[] = ['superadministrador', 'administrador', 'usuario'];
const ADMINS: Rol[] = ['superadministrador', 'administrador'];

/** Menú del sidebar y fuente de las migas de pan del header. */
export const GRUPOS_NAV: { titulo: string; items: ItemNav[] }[] = [
  {
    titulo: 'Gestión',
    items: [{ href: '/usuarios', etiqueta: 'Usuarios', icono: Users, roles: ['superadministrador'] }],
  },
  {
    titulo: 'Recopilación',
    items: [
      { href: '/fuentes', etiqueta: 'Fuentes', icono: Rss, roles: ADMINS },
      { href: '/scraping', etiqueta: 'Ejecutar scraping', icono: Radar, roles: ADMINS },
    ],
  },
  {
    titulo: 'Análisis',
    items: [{ href: '/pln', etiqueta: 'Procesamiento PLN', icono: BrainCircuit, roles: ADMINS }],
  },
  {
    titulo: 'Informes',
    items: [
      { href: '/informes', etiqueta: 'Inicio informes', icono: FileText, roles: TODOS },
      { href: '/dashboard', etiqueta: 'Dashboard', icono: LayoutDashboard, roles: TODOS },
      { href: '/buscar', etiqueta: 'Buscar y filtrar', icono: Search, roles: TODOS },
      { href: '/reportes', etiqueta: 'Generar reportes', icono: FileBarChart, roles: TODOS },
      { href: '/historial', etiqueta: 'Historial', icono: History, roles: TODOS },
    ],
  },
];

export function esActivo(href: ItemNav['href'], pathname: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function migasDePan(pathname: string): string[] {
  for (const grupo of GRUPOS_NAV) {
    const item = grupo.items.find((i) => esActivo(i.href, pathname));
    if (item) return [grupo.titulo, item.etiqueta];
  }
  return [];
}

export function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
}
