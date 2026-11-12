import { useEffect, useRef, useState } from 'react';
import { branding } from '@/config/branding';
import { cn } from '@/lib/utils';

type Variante = 'emi' | 'system' | 'systemIcon' | 'emiIcon' | 'systemLight' | 'emiColorDark';
type Tamano = 'sm' | 'md' | 'lg';

const TAMANOS: Record<Tamano, string> = {
  sm: 'h-9 w-9',
  md: 'h-12 w-12',
  lg: 'h-28 w-28',
};

// Los logos reales son anchos: se fija la altura y el ancho queda libre.
const TAMANOS_IMG: Record<Tamano, string> = {
  sm: 'h-9 w-auto',
  md: 'h-12 w-auto',
  lg: 'h-28 w-auto',
};

// Las imágenes se leen de src/config/branding.ts.
// Para reemplazarlas, copie sus archivos en /public/images/ con el mismo nombre.
const FUENTES: Record<Variante, { src: string; alt: string; placeholder: string }> = {
  emi: {
    src: branding.logoEmi,
    alt: `Logo de la ${branding.institutionName}`,
    placeholder: 'LOGO EMI',
  },
  system: {
    src: branding.logoSystem,
    alt: `Logo del sistema ${branding.systemName}`,
    placeholder: 'LOGO EMI-INSIGHT',
  },
  systemIcon: {
    src: branding.iconSystem,
    alt: `Ícono del sistema ${branding.systemName}`,
    placeholder: 'EMI-INSIGHT',
  },
  emiIcon: {
    src: branding.iconEmi,
    alt: `Ícono de la ${branding.institutionName}`,
    placeholder: 'EMI',
  },
  systemLight: {
    src: branding.logoSystemLight,
    alt: `Logo del sistema ${branding.systemName}`,
    placeholder: 'EMI-INSIGHT',
  },
  emiColorDark: {
    src: branding.logoEmiColorDark,
    alt: `Logo de la ${branding.institutionName}`,
    placeholder: 'EMI',
  },
};

export function BrandLogo({
  variant,
  size = 'md',
  tone = 'light',
  className,
}: {
  variant: Variante;
  size?: Tamano;
  /** Tono del fondo donde se muestra: define el color del marcador de posición. */
  tone?: 'light' | 'dark';
  className?: string;
}) {
  const fuente = FUENTES[variant];
  const imgRef = useRef<HTMLImageElement>(null);
  const [fallo, setFallo] = useState(false);

  // Si la imagen falló antes de hidratar, onError no se dispara: se revisa aquí.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setFallo(true);
  }, []);

  if (fallo) {
    return (
      <div
        role="img"
        aria-label={`${fuente.alt} (pendiente de reemplazar)`}
        className={cn(
          'brand-placeholder @container flex shrink-0 items-center justify-center rounded-xl border-2 border-dashed p-1 text-center font-semibold uppercase leading-tight tracking-wide',
          tone === 'dark' ? 'brand-placeholder-dark' : 'brand-placeholder-light',
          TAMANOS[size],
          className
        )}
      >
        {/* El texto escala con el tamaño del recuadro */}
        <span className="text-[clamp(6px,14cqw,12px)]">{fuente.placeholder}</span>
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={fuente.src}
      alt={fuente.alt}
      onError={() => setFallo(true)}
      className={cn('shrink-0 object-contain', TAMANOS_IMG[size], className)}
    />
  );
}
