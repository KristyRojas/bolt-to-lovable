import { Link, useRouterState } from '@tanstack/react-router';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { BrandLogo } from '@/components/BrandLogo';
import { branding } from '@/config/branding';
import { cn } from '@/lib/utils';
import { RolBadge } from './RolBadge';
import { GRUPOS_NAV, esActivo, iniciales } from './navegacion';

export function AppSidebar({
  colapsado = false,
  onNavegar,
}: {
  colapsado?: boolean;
  /** Se llama al elegir una opción (cierra el drawer en móvil). */
  onNavegar?: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { usuario } = useAuth();
  if (!usuario) return null;

  return (
    <div className="app-sidebar flex h-full flex-col bg-navy text-primary-foreground">
      {/* Marca */}
      <div
        className={cn(
          'flex shrink-0 items-center border-b border-sidebar-line transition-all duration-200',
          colapsado ? 'h-20 justify-center px-2' : 'gap-3 px-5 py-5'
        )}
      >
        <BrandLogo variant="systemIcon" size="sm" tone="dark" className="h-9 w-auto" />
        {!colapsado && (
          <div className="min-w-0">
            <p className="truncate text-base font-bold tracking-[0.08em]">{branding.systemName}</p>
            <p className="truncate text-xs text-sidebar-muted">{branding.systemShortTagline}</p>
          </div>
        )}
      </div>

      {/* Menú */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4" aria-label="Menú principal">
        {GRUPOS_NAV.map((grupo, gi) => {
          const items = grupo.items.filter((i) => i.roles.includes(usuario.rol));
          if (items.length === 0) return null;
          return (
            <div key={grupo.titulo} className="mb-4">
              {colapsado ? (
                gi > 0 && <div className="mx-4 mb-3 h-px bg-sidebar-line" />
              ) : (
                <p className="px-5 pb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-sidebar-muted">
                  {grupo.titulo}
                </p>
              )}
              <ul className="space-y-0.5 pr-3">
                {items.map((item) => {
                  const activo = esActivo(item.href, pathname);
                  const Icono = item.icono;
                  const enlace = (
                    <Link
                      to={item.href}
                      onClick={onNavegar}
                      aria-current={activo ? 'page' : undefined}
                      className={cn(
                        'sidebar-item flex items-center rounded-r-lg py-2.5 text-sm',
                        activo && 'active',
                        colapsado ? 'justify-center px-0' : 'gap-3 px-5'
                      )}
                    >
                      <Icono className="h-[18px] w-[18px] shrink-0" />
                      {!colapsado && <span className="truncate">{item.etiqueta}</span>}
                      {colapsado && <span className="sr-only">{item.etiqueta}</span>}
                    </Link>
                  );
                  return (
                    <li key={item.href}>
                      {colapsado ? (
                        <Tooltip>
                          <TooltipTrigger asChild>{enlace}</TooltipTrigger>
                          <TooltipContent side="right">{item.etiqueta}</TooltipContent>
                        </Tooltip>
                      ) : (
                        enlace
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Usuario y respaldo institucional */}
      <div className={cn('shrink-0 border-t border-sidebar-line', colapsado ? 'p-3' : 'p-4')}>
        <div
          className={cn(
            'flex items-center',
            colapsado ? 'justify-center' : 'gap-3 rounded-xl border border-sidebar-line bg-sidebar-card p-3'
          )}
          title={colapsado ? usuario.nombre : undefined}
        >
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="bg-emiblue text-xs font-semibold text-primary-foreground">
              {iniciales(usuario.nombre)}
            </AvatarFallback>
          </Avatar>
          {!colapsado && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{usuario.nombre}</p>
              <RolBadge rol={usuario.rol} className="mt-1" />
            </div>
          )}
        </div>
        {!colapsado && (
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 px-1">
            <span className="whitespace-nowrap text-[10px] uppercase tracking-[0.12em] text-sidebar-muted">
              Respaldado por
            </span>
            <BrandLogo variant="emiIcon" size="sm" tone="dark" className="h-6 w-auto" />
            <span className="whitespace-nowrap text-xs font-semibold">{branding.institutionShort}</span>
          </div>
        )}
      </div>
    </div>
  );
}
