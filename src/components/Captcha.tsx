/**
 * Captcha propio dibujado en <canvas>, sin servicios externos.
 *
 * NOTA: la validación ocurre en el navegador. Más adelante puede reemplazarse
 * por Cloudflare Turnstile o Google reCAPTCHA con verificación en el backend.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  CAPTCHA_LONGITUD,
  captchaCoincide,
  generarCodigoCaptcha,
} from '@/lib/login-seguridad';

const TAMANO_NORMAL = { ancho: 180, alto: 56 };
const TAMANO_COMPACTO = { ancho: 150, alto: 44 };

function leerColor(variable: string, respaldo: string): string {
  const valor = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return valor || respaldo;
}

function dibujar(canvas: HTMLCanvasElement, codigo: string, ANCHO: number, ALTO: number) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = ANCHO * dpr;
  canvas.height = ALTO * dpr;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const navy = leerColor('--emi-navy', '#0B2545');
  const azul = leerColor('--emi-blue', '#1F6FEB');
  const gris = leerColor('--muted-foreground', '#64748B');
  const fondoA = leerColor('--secondary', '#EEF2F7');
  const fondoB = leerColor('--card', '#FFFFFF');
  const tintas = [navy, gris, navy, azul];

  const fondo = ctx.createLinearGradient(0, 0, ANCHO, ALTO);
  fondo.addColorStop(0, fondoA);
  fondo.addColorStop(1, fondoB);
  ctx.fillStyle = fondo;
  ctx.fillRect(0, 0, ANCHO, ALTO);

  // Puntos de ruido
  for (let i = 0; i < 45; i++) {
    ctx.globalAlpha = 0.25 + Math.random() * 0.35;
    ctx.fillStyle = tintas[i % tintas.length]!;
    ctx.beginPath();
    ctx.arc(Math.random() * ANCHO, Math.random() * ALTO, Math.random() * 1.6 + 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Caracteres con rotación, tamaño y posición aleatorios
  const paso = ANCHO / (codigo.length + 1);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  codigo.split('').forEach((caracter, i) => {
    const tamano = (ALTO / 56) * (24 + Math.random() * 8);
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.translate(paso * (i + 1) + (Math.random() * 8 - 4), ALTO / 2 + (Math.random() * 10 - 5));
    ctx.rotate((Math.random() - 0.5) * 0.7);
    ctx.font = `700 ${tamano}px Inter, ui-sans-serif, system-ui, sans-serif`;
    ctx.fillStyle = i % 2 === 0 ? navy : gris;
    ctx.fillText(caracter, 0, 0);
    ctx.restore();
  });

  // Líneas de ruido
  const lineas = 3 + Math.round(Math.random());
  for (let i = 0; i < lineas; i++) {
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = i % 2 === 0 ? navy : gris;
    ctx.lineWidth = 1 + Math.random();
    ctx.beginPath();
    ctx.moveTo(Math.random() * 20, Math.random() * ALTO);
    ctx.bezierCurveTo(
      ANCHO * 0.3, Math.random() * ALTO,
      ANCHO * 0.7, Math.random() * ALTO,
      ANCHO - Math.random() * 20, Math.random() * ALTO
    );
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

export function Captcha({
  onValidChange,
  onIncorrecto,
  reinicio = 0,
  disabled = false,
  compacto = false,
}: {
  onValidChange: (isValid: boolean) => void;
  /** Se llama cuando el código ingresado es incorrecto. */
  onIncorrecto?: () => void;
  /** Cambie este número para generar un captcha nuevo desde fuera. */
  reinicio?: number;
  disabled?: boolean;
  /** Versión reducida (150x44) para formularios compactos. Solo cambia la presentación. */
  compacto?: boolean;
}) {
  const { ancho, alto } = compacto ? TAMANO_COMPACTO : TAMANO_NORMAL;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const avisarValidez = useRef(onValidChange);
  avisarValidez.current = onValidChange;
  const [codigo, setCodigo] = useState('');
  const [valor, setValor] = useState('');
  const [valido, setValido] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const regenerar = useCallback((conservarError = false) => {
    setCodigo(generarCodigoCaptcha());
    setValor('');
    setValido(false);
    if (!conservarError) setError(null);
    avisarValidez.current(false);
  }, []);

  // El código aleatorio se genera solo en el navegador (evita diferencias con el servidor).
  useEffect(() => {
    regenerar();
  }, [reinicio, regenerar]);

  useEffect(() => {
    if (codigo && canvasRef.current) dibujar(canvasRef.current, codigo, ancho, alto);
  }, [codigo, ancho, alto]);

  function onChange(texto: string) {
    const limpio = texto.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CAPTCHA_LONGITUD);
    setValor(limpio);
    setError(null);
    if (limpio.length < CAPTCHA_LONGITUD) {
      if (valido) {
        setValido(false);
        avisarValidez.current(false);
      }
      return;
    }
    if (captchaCoincide(limpio, codigo)) {
      setValido(true);
      avisarValidez.current(true);
    } else {
      setError('Código incorrecto');
      onIncorrecto?.();
      regenerar(true);
    }
  }

  return (
    <div className={compacto ? 'space-y-1.5' : 'space-y-2'}>
      <Label htmlFor="captcha">Código de verificación</Label>
      <div className={cn('flex items-center', compacto ? 'gap-2' : 'gap-3')}>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Imagen de verificación con un código de 5 caracteres"
          className="captcha-canvas shrink-0 rounded-lg border"
          style={{ width: ancho, height: alto }}
        />
        <button
          type="button"
          onClick={() => regenerar()}
          disabled={disabled}
          aria-label="Refrescar: generar un nuevo código"
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-secondary disabled:opacity-50',
            compacto ? 'h-11' : 'h-10'
          )}
        >
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Refrescar</span>
        </button>
      </div>
      <div className="relative">
        <Input
          id="captcha"
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ingrese el código de la imagen"
          maxLength={CAPTCHA_LONGITUD}
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby="captcha-ayuda"
          className={cn(
            compacto && 'h-11',
            'pr-10 font-mono uppercase tracking-[0.3em] placeholder:font-sans placeholder:normal-case placeholder:tracking-normal',
            valido && 'border-sentiment-positive',
            error && 'border-destructive'
          )}
        />
        {valido && (
          <CheckCircle2
            aria-label="Código correcto"
            className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-sentiment-positive"
          />
        )}
      </div>
      <div id="captcha-ayuda" className="flex items-center justify-between gap-3 text-xs" aria-live="polite">
        {error ? (
          <span className="font-medium text-destructive">
            {error}. {compacto ? 'Se generó otro.' : 'Se generó un nuevo código.'}
          </span>
        ) : valido ? (
          <span className="font-medium text-sentiment-positive">Código verificado</span>
        ) : (
          <span className="text-muted-foreground">No distingue mayúsculas.</span>
        )}
        <button
          type="button"
          onClick={() => regenerar()}
          disabled={disabled}
          className="shrink-0 text-accent underline-offset-2 hover:underline disabled:opacity-50"
        >
          {compacto ? 'Otro código' : 'Generar otro código'}
        </button>
      </div>
    </div>
  );
}
