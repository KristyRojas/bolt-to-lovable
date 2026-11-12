import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import {
  AlertCircle,
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
  { icono: Radar, texto: 'Recopilación automatizada de opiniones (Facebook y Google Maps)' },
  { icono: BrainCircuit, texto: 'Clasificación de polaridad con BETO' },
  { icono: Network, texto: 'Identificación de factores con BERTopic' },
  { icono: FileBarChart, texto: 'Dashboards y reportes institucionales en PDF' },
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
      setError(`Demasiados intentos fallidos. El acceso se bloqueó temporalmente.`);
    } else {
      const quedan = MAX_INTENTOS - siguiente.fallos;
      setError(
        `${resultado.error ?? 'Error al iniciar sesión.'} Le ${quedan === 1 ? 'queda 1 intento' : `quedan ${quedan} intentos`}.`
      );
    }
  }

  return (
    <div className="flex min-h-screen bg-login-panel">
      {/* PANEL IZQUIERDO — identidad institucional (solo ≥1024px) */}
      <aside
        className="login-hero relative hidden flex-col justify-between overflow-hidden p-10 text-primary-foreground lg:flex lg:w-[55%] xl:p-14"
        style={{ '--login-bg': `url("${branding.loginBackground}")` } as CSSProperties}
      >
        <div className="login-enter flex items-center gap-3">
          <BrandLogo variant="emi" size="md" tone="dark" />
          <div className="text-xs leading-snug">
            <p className="font-semibold">{branding.institutionName}</p>
            <p className="text-primary-foreground/70">
              {branding.institutionShort} · {branding.location}
            </p>
          </div>
        </div>

        <div className="login-enter login-enter-delay max-w-xl">
          <BrandLogo variant="system" size="lg" tone="dark" />
          <h1 className="mt-6 text-5xl font-bold tracking-[0.12em] xl:text-6xl">
            {branding.systemName}
          </h1>
          <div className="mt-4 h-1 w-24 rounded-full bg-gold" />
          <p className="mt-5 text-lg leading-relaxed text-primary-foreground/80">
            {branding.systemTagline}
          </p>
          <ul className="mt-10 space-y-4">
            {CARACTERISTICAS.map(({ icono: Icono, texto }) => (
              <li key={texto} className="flex items-center gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold ring-1 ring-gold/30">
                  <Icono className="h-5 w-5" />
                </span>
                <span className="text-sm text-primary-foreground/90">{texto}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="login-enter login-enter-delay-2 flex items-center justify-between text-xs text-primary-foreground/55">
          <span>{branding.thesisNote}</span>
          <span>{branding.version}</span>
        </div>
      </aside>

      {/* PANEL DERECHO — formulario */}
      <main className="flex w-full flex-col items-center justify-center px-5 py-10 sm:px-8 lg:w-[45%]">
        {/* Mini encabezado móvil con el logo EMI */}
        <div className="mb-8 flex w-full max-w-[420px] items-center gap-3 border-b pb-4 lg:hidden">
          <BrandLogo variant="emi" size="sm" />
          <div className="text-xs leading-snug">
            <p className="font-semibold text-foreground">{branding.institutionNameShort}</p>
            <p className="text-muted-foreground">
              {branding.institutionUnit} · {branding.institutionShort}
            </p>
          </div>
        </div>

        <div className="login-enter w-full max-w-[420px]">
          <div className="emi-card p-7 sm:p-8">
            <div className="flex items-center gap-3">
              <BrandLogo variant="system" size="md" />
              <div>
                <p className="text-lg font-bold tracking-[0.08em] text-navy">{branding.systemName}</p>
                <p className="text-xs text-muted-foreground">{branding.systemShortTagline}</p>
              </div>
            </div>

            <h2 className="mt-7 text-2xl font-bold tracking-tight text-navy">Iniciar sesión</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ingrese sus credenciales institucionales para acceder
            </p>

            <form onSubmit={onSubmit} className="mt-6" noValidate>
              <fieldset disabled={bloqueado || enviando} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="usuario">Usuario</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="usuario"
                      placeholder="Ingrese su usuario"
                      value={usuario}
                      onChange={(e) => setUsuario(e.target.value)}
                      className="h-11 pl-9"
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contrasena">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="contrasena"
                      type={verContrasena ? 'text' : 'password'}
                      placeholder="Ingrese su contraseña"
                      value={contrasena}
                      onChange={(e) => setContrasena(e.target.value)}
                      className="h-11 pl-9 pr-10"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setVerContrasena((v) => !v)}
                      aria-label={verContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors duration-200 hover:bg-secondary hover:text-foreground"
                    >
                      {verContrasena ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Captcha
                  onValidChange={setCaptchaValido}
                  onIncorrecto={() => setError('Código captcha incorrecto. Ingrese el nuevo código.')}
                  reinicio={reinicioCaptcha}
                  disabled={bloqueado || enviando}
                />

                <div className="flex items-center justify-between gap-3 pt-1">
                  <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap text-sm text-foreground">
                    <Checkbox checked={recordar} onCheckedChange={(v) => setRecordar(v === true)} />
                    Recordar usuario
                  </label>
                  <button
                    type="button"
                    onClick={() => setOlvidoAbierto(true)}
                    className="whitespace-nowrap text-sm font-medium text-accent underline-offset-2 hover:underline"
                  >
                    ¿Olvidó su contraseña?
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={!puedeEnviar}
                  className="emi-btn-primary h-11 w-full rounded-xl font-semibold"
                >
                  {enviando ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    'Ingresar'
                  )}
                </Button>
              </fieldset>
            </form>

            {(error || bloqueado) && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-2.5 rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
              >
                {bloqueado ? (
                  <Clock className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <div>
                  {error && <p>{error}</p>}
                  {bloqueado && (
                    <p className="font-semibold">
                      Intente nuevamente en {restantes} segundo{restantes === 1 ? '' : 's'}.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 space-y-1.5 text-center text-xs text-muted-foreground">
            <p>
              <ShieldCheck className="mr-1 inline h-3.5 w-3.5 align-[-2px]" />
              Acceso restringido a personal autorizado. Toda actividad es registrada.
            </p>
            <p>
              © {branding.year} {branding.systemName} · {branding.institutionShort}
            </p>
          </div>
        </div>
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
