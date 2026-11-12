/**
 * Reglas de seguridad del inicio de sesión (captcha y bloqueo temporal).
 * Funciones puras para poder probarlas sin la interfaz.
 */

/** Alfabeto del captcha: sin caracteres confusos (0, O, 1, I, l). */
export const CAPTCHA_ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const CAPTCHA_LONGITUD = 5;

export function generarCodigoCaptcha(azar: () => number = Math.random): string {
  let codigo = '';
  for (let i = 0; i < CAPTCHA_LONGITUD; i++) {
    codigo += CAPTCHA_ALFABETO[Math.floor(azar() * CAPTCHA_ALFABETO.length)];
  }
  return codigo;
}

/** Compara sin distinguir mayúsculas/minúsculas. */
export function captchaCoincide(entrada: string, codigo: string): boolean {
  return codigo.length > 0 && entrada.trim().toUpperCase() === codigo.toUpperCase();
}

export const MAX_INTENTOS = 5;
export const BLOQUEO_MS = 30_000;

export interface EstadoIntentos {
  fallos: number;
  bloqueadoHasta: number | null;
}

export const INTENTOS_INICIAL: EstadoIntentos = { fallos: 0, bloqueadoHasta: null };

/** Registra un intento fallido; al llegar a MAX_INTENTOS bloquea durante BLOQUEO_MS. */
export function registrarFallo(estado: EstadoIntentos, ahora: number): EstadoIntentos {
  const fallos = estado.fallos + 1;
  if (fallos >= MAX_INTENTOS) return { fallos: 0, bloqueadoHasta: ahora + BLOQUEO_MS };
  return { fallos, bloqueadoHasta: null };
}

export function segundosRestantes(estado: EstadoIntentos, ahora: number): number {
  if (!estado.bloqueadoHasta) return 0;
  return Math.max(0, Math.ceil((estado.bloqueadoHasta - ahora) / 1000));
}
