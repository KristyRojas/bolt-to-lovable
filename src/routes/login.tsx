import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BrainCircuit,
  Clock,
  Eye,
  EyeOff,
  FileBarChart,
  Loader2,
  Lock,
  Network,
  Radar,
  ShieldCheck,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BrandLogo } from '@/components/BrandLogo';
import { Captcha } from '@/components/Captcha';
import { branding } from '@/config/branding';
import {
  INTENTOS_INICIAL,
  MAX_INTENTOS,
  registrarFallo,
  segundosRestantes,
  type EstadoIntentos,
} from '@/lib/login-seguridad';

export const Route = createFileRoute('/login')({
  head: () => ({
    meta: [
      { title: 'Iniciar sesión — EMI-INSIGHT' },
      { name: 'description', content: 'Acceso al sistema EMI-INSIGHT de percepción institucional de la EMI-UALP.' },
      { property: 'og:title', content: 'Iniciar sesión — EMI-INSIGHT' },
      { property: 'og:description', content: 'Acceso al sistema EMI-INSIGHT de percepción institucional de la EMI-UALP.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: LoginPage,
});

const RECORDAR_KEY = 'emi_insight_usuario_recordado';

const CARACTERISTICAS = [
  { icono: Radar, titulo: 'Recopilación automatizada', detalle: 'Opiniones de Facebook y Google Maps' },
  { icono: BrainCircuit, titulo: 'Clasificación con BETO', detalle: 'Polaridad positiva, neutral o negativa' },
  { icono: Network, titulo: 'Factores con BERTopic', detalle: 'Temas que explican la percepción' },
  { icono: FileBarChart, titulo: 'Dashboards y reportes PDF', detalle: 'Informes institucionales al instante' },
];

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [verContrasena, setVerContrasena] = useState(false);
  const [recordar, setRecordar] = useState(false);
  const [captchaValido, setCaptchaValido] = useState(false);
  const [reinicioCaptcha, setReinicioCaptcha] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [intentos, setIntentos] = useState<EstadoIntentos>(INTENTOS_INICIAL);
  const [ahora, setAhora] = useState(0);
  const [olvidoAbierto, setOlvidoAbierto] = useState(false);

  const restantes = segundosRestantes(intentos, ahora);
  const bloqueado = restantes > 0;
  const puedeEnviar =
    !!usuario.trim() && !!contrasena && captchaValido && !bloqueado && !enviando;

  // Solo en el login: la página no puede desplazarse (se restaura al salir).
  useEffect(() => {
    document.documentElement.classList.add('login-lock');
    return () => document.documentElement.classList.remove('login-lock');
  }, []);

  useEffect(() => {
    const guardado = window.localStorage.getItem(RECORDAR_KEY);
    if (guardado) {
      setUsuario(guardado);
      setRecordar(true);
    }
  }, []);

  // Cuenta regresiva del bloqueo temporal
  useEffect(() => {
    const hasta = intentos.bloqueadoHasta;
    if (!hasta) return;
    const id = window.setInterval(() => {
      const t = Date.now();
      setAhora(t);
      if (t >= hasta) {
        window.clearInterval(id);
        setIntentos(INTENTOS_INICIAL);
        setError(null);
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [intentos.bloqueadoHasta]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!puedeEnviar) return;
    setError(null);
    setEnviando(true);
    const resultado = await login(usuario, contrasena);
    setEnviando(false);
    if (resultado.ok) {
      if (recordar) window.localStorage.setItem(RECORDAR_KEY, usuario.trim());
      else window.localStorage.removeItem(RECORDAR_KEY);
      toast.success(`Bienvenido a ${branding.systemName}`);
      navigate({ to: '/dashboard' });
      return;
    }
    const t = Date.now();
    const siguiente = registrarFallo(intentos, t);
    setIntentos(siguiente);
    setAhora(t);
    setContrasena('');
    setReinicioCaptcha((n) => n + 1);
    if (siguiente.bloqueadoHasta) {
      setError('Demasiados intentos fallidos.');
    } else {
      const quedan = MAX_INTENTOS - siguiente.fallos;
      setError(
        `${resultado.error ?? 'Error al iniciar sesión.'} ${quedan === 1 ? 'Queda 1 intento' : `Quedan ${quedan} intentos`}.`
      );
    }
  }

  const mensajeAlerta = bloqueado
    ? `Demasiados intentos fallidos · reintente en ${restantes} s`
    : error;

  return (
    <div className="login-root grid h-dvh w-full grid-cols-1 overflow-hidden bg-login-panel lg:grid-cols-[1.15fr_1fr]">
      {/* PANEL IZQUIERDO — identidad institucional (solo ≥1024px) */}
      <aside
        className="login-hero relative hidden h-full min-h-0 flex-col justify-between overflow-hidden p-[clamp(1.5rem,4.5vh,3.5rem)] text-primary-foreground lg:flex"
        style={{ '--login-bg': `url("${branding.loginBackground}")` } as CSSProperties}
      >
        {/* Borde institucional */}
        <div aria-hidden className="login-gold-edge pointer-events-none absolute inset-y-0 right-0 w-px" />

        {/* 1. ARRIBA */}
        <div className="login-enter relative">
          <BrandLogo variant="emiColorDark" size="lg" tone="dark" className="h-[clamp(64px,10vh,96px)] w-auto" />
        </div>

        {/* 2. CENTRO */}
        <div className="login-enter login-enter-delay relative flex max-w-xl flex-col gap-[clamp(0.75rem,2.4vh,1.75rem)]">
          <BrandLogo
            variant="systemLight"
            size="lg"
            tone="dark"
            className="login-system-logo h-[clamp(64px,10vh,96px)] w-auto self-start"
          />
          <div>
            <h1 className="sr-only">
              {branding.systemName}
            </h1>
            <div className="mt-[clamp(0.6rem,1.8vh,1rem)] h-1 w-12 rounded-full bg-gold" />
          </div>
          <p className="login-system-description max-w-lg text-lg font-medium leading-relaxed text-primary-foreground/90">
            {branding.systemTagline}
          </p>
          <p className="max-w-lg border-l-2 border-gold pl-3 text-sm leading-relaxed text-primary-foreground/70">
            {branding.institutionNameShort}<br />
            {branding.institutionUnit} · {branding.location}
          </p>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-[clamp(0.6rem,2vh,1.1rem)] pt-[clamp(0rem,1vh,0.5rem)] shorter:hidden">
            {CARACTERISTICAS.map(({ icono: Icono, titulo, detalle }) => (
              <li key={titulo} className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold ring-1 ring-gold/30">
                  <Icono className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0">
                   <p className="text-sm font-semibold leading-snug">{titulo}</p>
                   <p className="text-xs leading-snug text-primary-foreground/70">{detalle}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* 3. ABAJO */}
        <div className="login-enter login-enter-delay-2 relative flex items-center gap-2.5 text-xs text-primary-foreground/60 shorter:hidden">
          <span>{branding.thesisNote}</span>
          <span aria-hidden className="h-1 w-1 rounded-full bg-gold" />
          <span>{branding.version}</span>
        </div>
      </aside>

      {/* PANEL DERECHO — formulario */}
      <main className="login-form-panel relative flex h-full min-h-0 flex-col items-center justify-center gap-[clamp(0.6rem,2vh,1.25rem)] overflow-y-auto overflow-x-hidden px-5 py-[clamp(0.75rem,2.5vh,2rem)] sm:px-8">

        {/* Mini encabezado (<1024px): logos pequeños */}
        <div className="relative flex w-full max-w-[420px] items-center justify-center gap-3 lg:hidden">
          <BrandLogo variant="emi" size="sm" />
          <div className="min-w-0 text-xs leading-snug">
            <p className="truncate font-semibold text-foreground">{branding.institutionNameShort}</p>
            <p className="truncate text-muted-foreground">
              {branding.institutionUnit} · {branding.institutionShort}
            </p>
          </div>
        </div>

        <div className="login-enter relative w-full max-w-[420px]">
          <div className="login-card relative overflow-hidden rounded-2xl border bg-card p-[clamp(1.25rem,3vh,2rem)]">
            <div aria-hidden className="login-card-stripe absolute inset-x-0 top-0 h-[3px]" />

            <div className="flex flex-col items-center text-center">
              <BrandLogo variant="system" size="md" className="h-[clamp(32px,6vh,52px)] w-auto" />
              <h2 className="mt-[clamp(0.4rem,1.2vh,0.75rem)] text-xl font-semibold tracking-tight text-navy xl:text-2xl">
                Iniciar sesión
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground shorter:hidden">
                Ingrese sus credenciales institucionales
              </p>
            </div>

            <form onSubmit={onSubmit} className="mt-[clamp(0.75rem,2.2vh,1.25rem)]" noValidate>
              <fieldset disabled={bloqueado || enviando} className="flex flex-col gap-[clamp(0.55rem,1.6vh,1rem)]">
                <div className="space-y-1.5">
                  <Label htmlFor="usuario" className="text-xs">Usuario</Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="usuario"
                      placeholder="Ingrese su usuario"
                      value={usuario}
                      onChange={(e) => setUsuario(e.target.value)}
                      className="h-11 rounded-lg pl-9 transition-shadow duration-200"
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="contrasena" className="text-xs">Contraseña</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="contrasena"
                      type={verContrasena ? 'text' : 'password'}
                      placeholder="Ingrese su contraseña"
                      value={contrasena}
                      onChange={(e) => setContrasena(e.target.value)}
                      className="h-11 rounded-lg pl-9 pr-10 transition-shadow duration-200"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setVerContrasena((v) => !v)}
                      aria-label={verContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors duration-200 hover:bg-secondary hover:text-foreground"
                    >
                      {verContrasena ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="login-captcha">
                  <Captcha
                    compacto
                    onValidChange={setCaptchaValido}
                    onIncorrecto={() => setError('Código captcha incorrecto · se generó uno nuevo.')}
                    reinicio={reinicioCaptcha}
                    disabled={bloqueado || enviando}
                  />
                </div>

                <div className="flex items-center justify-between gap-3 text-xs">
                  <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap text-foreground">
                    <Checkbox checked={recordar} onCheckedChange={(v) => setRecordar(v === true)} />
                    Recordar usuario
                  </label>
                  <button
                    type="button"
                    onClick={() => setOlvidoAbierto(true)}
                    className="whitespace-nowrap font-medium text-accent underline-offset-2 transition-colors duration-200 hover:underline"
                  >
                    ¿Olvidó su contraseña?
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={!puedeEnviar}
                  className="emi-btn-primary group h-11 w-full rounded-lg font-semibold"
                >
                  {enviando ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      Ingresar
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </>
                  )}
                </Button>
              </fieldset>
            </form>

            {/* Espacio reservado para la alerta: no desplaza el formulario */}
            <div className="relative mt-2 h-9" aria-live="assertive">
              {mensajeAlerta && (
                <div
                  role="alert"
                  title={mensajeAlerta}
                  className="absolute inset-0 flex items-center gap-2 rounded-lg border border-destructive/25 bg-destructive/10 px-3 text-xs text-destructive"
                >
                  {bloqueado ? (
                    <Clock className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0" />
                  )}
                  <span className="line-clamp-2 leading-tight">{mensajeAlerta}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <p className="relative flex w-full max-w-[420px] items-center justify-center gap-1.5 truncate text-[11px] text-muted-foreground shorter:hidden">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            Acceso restringido a personal autorizado · © {branding.year} {branding.systemName}
          </span>
        </p>
      </main>

      <Dialog open={olvidoAbierto} onOpenChange={setOlvidoAbierto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿Olvidó su contraseña?</DialogTitle>
            <DialogDescription>
              Contacte al Superadministrador de la Unidad de Tecnología para restablecer su
              contraseña.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="emi-btn-primary" onClick={() => setOlvidoAbierto(false)}>
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
