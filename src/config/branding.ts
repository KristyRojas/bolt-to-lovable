/**
 * Branding centralizado de EMI-INSIGHT.
 *
 * Para cambiar los logos o el fondo del inicio de sesión basta con reemplazar
 * los archivos en /public/images/ (mismo nombre) o editar las rutas de abajo.
 * Si un archivo no existe, <BrandLogo /> muestra un marcador de posición.
 */
export const branding = {
  systemName: 'EMI-INSIGHT',
  systemTagline:
    'Sistema de identificación de factores de percepción institucional en redes sociales',
  systemShortTagline: 'Percepción Institucional',
  institutionName: 'Escuela Militar de Ingeniería «Mcal. Antonio José de Sucre»',
  institutionNameShort: 'Escuela Militar de Ingeniería',
  institutionUnit: 'Unidad Académica La Paz',
  institutionShort: 'EMI-UALP',
  location: 'La Paz, Bolivia',
  version: 'v1.0.0',
  year: 2026,
  thesisNote: 'Trabajo de Grado · Ingeniería · EMI-UALP 2026',
  developedBy: 'Desarrollado como Trabajo de Grado – Ingeniería de Sistemas, EMI-UALP 2026.',

  // ⬇ Reemplace estos archivos en /public/images/ para usar los logos reales.
  logoEmi: '/images/emi-logo.png', // Logo de la Escuela Militar de Ingeniería
  logoEmiCompact: '/images/emi-logo-compact.png', // Logo EMI compacto (sin leyenda)
  logoEmiCompactWhite: '/images/emi-logo-compact-white.png', // Compacto blanco para fondos oscuros
  logoEmiWhite: '/images/emi-logo-white.png', // Logo EMI completo en blanco (login)
  logoSystem: '/images/emi-insight-logo.png', // Logo del sistema EMI-INSIGHT
  loginBackground: '/images/login-bg.jpg', // Fotografía institucional del login
} as const;

/** Versión sin la "v" inicial, p. ej. "1.0.0". */
export const versionNumero = branding.version.replace(/^v/, '');
