import { useState } from 'react';
import { branding, versionNumero } from '@/config/branding';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Textos de ejemplo: reemplácelos por los documentos oficiales.
const DOCUMENTOS = {
  terminos: {
    titulo: 'Términos de uso',
    texto:
      'El uso de EMI-INSIGHT está limitado a personal autorizado de la EMI-UALP con fines de análisis institucional. Las credenciales son personales e intransferibles y toda actividad queda registrada.',
  },
  privacidad: {
    titulo: 'Política de privacidad',
    texto:
      'El sistema procesa únicamente opiniones públicas y no almacena datos que identifiquen a sus autores. Los resultados se usan de forma agregada para la mejora institucional.',
  },
  soporte: {
    titulo: 'Soporte técnico',
    texto:
      'Para asistencia, contacte a la Unidad de Tecnología de la EMI-UALP en horario de oficina, o comuníquese con el Superadministrador del sistema.',
  },
} as const;

type Doc = keyof typeof DOCUMENTOS;

export function AppFooter() {
  const [abierto, setAbierto] = useState<Doc | null>(null);
  const doc = abierto ? DOCUMENTOS[abierto] : null;

  return (
    <footer className="border-t bg-card">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <div className="flex items-start gap-3">
          <img
            src={branding.logoEmiCompact}
            alt={`Logo de la ${branding.institutionName}`}
            className="footer-logo h-8 w-auto shrink-0 object-contain"
          />
          <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
            © {branding.year} {branding.systemName} · {branding.institutionName} —{' '}
            {branding.institutionShort}. Todos los derechos reservados.
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs font-medium" aria-label="Enlaces legales">
          {(Object.keys(DOCUMENTOS) as Doc[]).map((k) => (
            <button
              key={k}
              onClick={() => setAbierto(k)}
              className="text-navy transition-colors duration-200 hover:text-accent"
            >
              {DOCUMENTOS[k].titulo}
            </button>
          ))}
        </nav>
        <div className="flex gap-4 text-xs text-muted-foreground lg:flex-col lg:gap-0 lg:text-right">
          <span>Versión {versionNumero}</span>
          <span>{branding.location}</span>
        </div>
      </div>
      <div className="border-t">
        <p className="mx-auto max-w-7xl px-4 py-2.5 text-center text-[11px] text-muted-foreground sm:px-6 lg:px-10">
          {branding.developedBy}
        </p>
      </div>

      <Dialog open={!!doc} onOpenChange={(o) => !o && setAbierto(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{doc?.titulo}</DialogTitle>
            <DialogDescription className="leading-relaxed">{doc?.texto}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </footer>
  );
}
