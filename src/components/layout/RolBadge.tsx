import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Rol } from '@/types';

const VARIANTE = {
  superadministrador: 'rolSuper',
  administrador: 'rolAdmin',
  usuario: 'rolUsuario',
} as const;

const ETIQUETA: Record<Rol, string> = {
  superadministrador: 'SuperAdmin',
  administrador: 'Administrador',
  usuario: 'Usuario',
};

export function RolBadge({ rol, className }: { rol: Rol; className?: string }) {
  return (
    <Badge variant={VARIANTE[rol]} className={cn('px-2 py-0 text-[10px] leading-5', className)}>
      {ETIQUETA[rol]}
    </Badge>
  );
}
