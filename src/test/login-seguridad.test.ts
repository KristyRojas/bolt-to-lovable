import { describe, expect, it } from 'vitest';
import {
  captchaCoincide,
  generarCodigoCaptcha,
  INTENTOS_INICIAL,
  registrarFallo,
  segundosRestantes,
} from '@/lib/login-seguridad';

describe('captcha', () => {
  it('genera 5 caracteres sin 0, O, 1, I ni l', () => {
    for (let i = 0; i < 300; i++) {
      const codigo = generarCodigoCaptcha();
      expect(codigo).toHaveLength(5);
      expect(codigo).not.toMatch(/[0O1Il]/);
    }
  });

  it('acepta el código sin distinguir mayúsculas', () => {
    expect(captchaCoincide('ab3kz', 'AB3KZ')).toBe(true);
    expect(captchaCoincide('AB3KY', 'AB3KZ')).toBe(false);
  });
});

describe('bloqueo por intentos fallidos', () => {
  it('no bloquea con 4 fallos', () => {
    let e = INTENTOS_INICIAL;
    for (let i = 0; i < 4; i++) e = registrarFallo(e, 1000);
    expect(segundosRestantes(e, 1000)).toBe(0);
  });

  it('bloquea 30 segundos al quinto fallo', () => {
    let e = INTENTOS_INICIAL;
    for (let i = 0; i < 5; i++) e = registrarFallo(e, 1000);
    expect(segundosRestantes(e, 1000)).toBe(30);
    expect(segundosRestantes(e, 1000 + 29_500)).toBe(1);
    expect(segundosRestantes(e, 1000 + 30_000)).toBe(0);
  });
});
