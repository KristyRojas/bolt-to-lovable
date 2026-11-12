import { useState } from 'react';
import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import {
  Bell,
  BrainCircuit,
  ChevronDown,
  ChevronRight,
  FileBarChart,
  KeyRound,
  LogOut,
  Menu,
  Radar,
  UserCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BrandLogo } from '@/components/BrandLogo';
import { branding } from '@/config/branding';
import { ROL_LABEL } from '@/types';
import { RolBadge } from './RolBadge';
import { iniciales, migasDePan } from './navegacion';

// Notificaciones de ejemplo (sin backend todavía).
const NOTIFICACIONES = [
  { id: 1, icono: Radar, titulo: 'Recopilación finalizada', detalle: 'Se obtuvieron nuevas opiniones de las fuentes activas.', hace: 'Hace 10 min' },
  { id: 2, icono: BrainCircuit, titulo: 'Análisis PLN completado', detalle: 'BETO y BERTopic procesaron el corpus.', hace: 'Hace 1 h' },
  { id: 3, icono: FileBarChart, titulo: 'Nuevo reporte generado', detalle: 'Reporte de percepción institucional listo.', hace: 'Ayer' },
];

export function AppHeader({ onMenu }: { onMenu: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const [noLeidas, setNoLeidas] = useState(NOTIFICACIONES.length);
  const [dialogo, setDialogo] = useState<'perfil' | 'contrasena' | null>(null);
  const migas = migasDePan(pathname);

  if (!usuario) return null;

  function onLogout() {
    logout();
    toast.success('Sesión cerrada correctamente');
    navigate({ to: '/login' });
  }

  return (
    <header className="app-header sticky top-0 z-30 h-16 border-b-2 border-gold bg-card">
      <div className="flex h-full items-center gap-3 px-3 sm:px-5">
        <Button
          variant="header"
          size="icon"
          onClick={onMenu}
          aria-label="Mostrar u ocultar el menú"
          className="shrink-0"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex min-w-0 items-center gap-3">
          <BrandLogo variant="emi" size="sm" />
          <div className="hidden min-w-0 leading-tight sm:block">
            <p className="truncate text-sm font-semibold text-navy">{branding.institutionNameShort}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {branding.institutionUnit} · {branding.institutionShort}
            </p>
          </div>
        </div>

        {migas.length > 0 && (
          <nav
            aria-label="Ruta de navegación"
            className="ml-2 hidden min-w-0 items-center gap-1 border-l pl-4 text-xs text-muted-foreground md:flex"
          >
            <Link to="/" className="transition-colors duration-200 hover:text-navy">
              Inicio
            </Link>
            {migas.map((m, i) => (
              <span key={m} className="flex min-w-0 items-center gap-1">
                <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                <span className={i === migas.length - 1 ? 'truncate font-medium text-navy' : 'truncate'}>
                  {m}
                </span>
              </span>
            ))}
          </nav>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <span className="mr-2 hidden items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted-foreground xl:flex">
            <span className="status-dot h-2 w-2 rounded-full bg-sentiment-positive" />
            Sistema operativo
          </span>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="header" size="icon" className="relative" aria-label={`Notificaciones (${noLeidas} sin leer)`}>
                <Bell className="h-5 w-5" />
                {noLeidas > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                    {noLeidas}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <p className="text-sm font-semibold text-navy">Notificaciones</p>
                {noLeidas > 0 && (
                  <button onClick={() => setNoLeidas(0)} className="text-xs font-medium text-accent hover:underline">
                    Marcar como leídas
                  </button>
                )}
              </div>
              <ul className="divide-y">
                {NOTIFICACIONES.map((n, i) => (
                  <li key={n.id} className="flex gap-3 px-4 py-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-navy">
                      <n.icono className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                        {i < noLeidas && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                        {n.titulo}
                      </p>
                      <p className="text-xs text-muted-foreground">{n.detalle}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{n.hace}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2.5 rounded-xl px-1.5 py-1 transition-colors duration-200 hover:bg-secondary data-[state=open]:bg-secondary">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-navy text-xs font-semibold text-primary-foreground">
                    {iniciales(usuario.nombre)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden max-w-[180px] text-left leading-tight xl:block">
                  <p className="truncate text-sm font-semibold text-navy">{usuario.nombre}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{usuario.cargo}</p>
                </div>
                <RolBadge rol={usuario.rol} className="hidden lg:inline-flex" />
                <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-semibold text-navy">{usuario.nombre}</p>
                <p className="text-xs text-muted-foreground">{usuario.cargo}</p>
                <RolBadge rol={usuario.rol} className="mt-1.5" />
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setDialogo('perfil')}>
                <UserCircle className="mr-2 h-4 w-4" /> Mi perfil
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setDialogo('contrasena')}>
                <KeyRound className="mr-2 h-4 w-4" /> Cambiar contraseña
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onLogout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Dialog open={dialogo !== null} onOpenChange={(o) => !o && setDialogo(null)}>
        <DialogContent className="sm:max-w-md">
          {dialogo === 'perfil' ? (
            <>
              <DialogHeader>
                <DialogTitle>Mi perfil</DialogTitle>
                <DialogDescription>Datos de su cuenta en {branding.systemName}.</DialogDescription>
              </DialogHeader>
              <dl className="grid grid-cols-[110px_1fr] gap-y-2 text-sm">
                <dt className="text-muted-foreground">Nombre</dt>
                <dd className="font-medium">{usuario.nombre}</dd>
                <dt className="text-muted-foreground">Usuario</dt>
                <dd className="font-medium">{usuario.usuario}</dd>
                <dt className="text-muted-foreground">Cargo</dt>
                <dd className="font-medium">{usuario.cargo}</dd>
                <dt className="text-muted-foreground">Rol</dt>
                <dd className="font-medium">{ROL_LABEL[usuario.rol]}</dd>
                <dt className="text-muted-foreground">Estado</dt>
                <dd className="font-medium capitalize">{usuario.estado}</dd>
              </dl>
            </>
          ) : (
            <DialogHeader>
              <DialogTitle>Cambiar contraseña</DialogTitle>
              <DialogDescription>
                Por seguridad, el cambio de contraseña lo realiza el Superadministrador de la
                Unidad de Tecnología desde Gestión de Usuarios.
              </DialogDescription>
            </DialogHeader>
          )}
        </DialogContent>
      </Dialog>
    </header>
  );
}
