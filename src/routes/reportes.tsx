import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Download, Eye, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import {
  getAnalisisConsolidado,
  fuentesDisponibles,
  etiquetaPeriodo,
  PERIODOS,
} from '@/services/analisis.service';
import { guardarReporte, type ReporteGuardado } from '@/services/historial.service';
import { descargarCSV } from '@/lib/csv';
import { contenidoReporte, filasCsv, nombreArchivo, SECCIONES_REPORTE } from '@/lib/reporte-datos';

export const Route = createFileRoute('/reportes')({
  head: () => ({
    meta: [
      { title: 'Generar reportes — EMI-INSIGHT' },
      { name: 'description', content: 'Cree reportes PDF o CSV con diseño institucional.' },
      { property: 'og:title', content: 'Generar reportes — EMI-INSIGHT' },
      { property: 'og:description', content: 'Cree reportes PDF o CSV con diseño institucional.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: ReportesPage,
});

const DESTINATARIOS = [
  'Dirección Académica',
  'Rectorado',
  'Dirección de Comunicación',
  'Bienestar Estudiantil',
  'Jefaturas de Carrera',
];

function ReportesPage() {
  const { usuario } = useAuth();
  const analisis = useMemo(() => getAnalisisConsolidado(), []);
  const fuentes = useMemo(() => fuentesDisponibles(), []);

  const [titulo, setTitulo] = useState('Reporte de percepción institucional');
  const [periodoId, setPeriodoId] = useState<string>('30d');
  const [fuenteId, setFuenteId] = useState('todas');
  const [destinatario, setDestinatario] = useState(DESTINATARIOS[0]!);
  const [formato, setFormato] = useState<'pdf' | 'csv'>('pdf');
  const [secciones, setSecciones] = useState<string[]>(SECCIONES_REPORTE.map((s) => s.id));
  const [generando, setGenerando] = useState(false);

  const autor = usuario?.nombre ?? 'Sistema';
  const navigate = useNavigate();
  const fuenteLabel = fuente(fuenteId, fuentes);

  const contenido = useMemo(
    () =>
      contenidoReporte(
        {
          titulo: titulo || 'Sin título',
          periodo: etiquetaPeriodo(periodoId),
          periodoId,
          fuente: fuenteLabel,
          fuenteId,
          destinatario,
          secciones,
          autor,
          fecha: new Date().toISOString(),
        },
        analisis
      ),
    [titulo, periodoId, fuenteLabel, fuenteId, destinatario, secciones, autor, analisis]
  );

  function toggleSeccion(id: string) {
    setSecciones((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  async function generar() {
    if (!titulo.trim()) {
      toast.error('Ingrese un título para el reporte.');
      return;
    }
    if (secciones.length === 0) {
      toast.error('Seleccione al menos una sección.');
      return;
    }
    setGenerando(true);
    try {
      const reporte: ReporteGuardado = {
        id: `rep-${Date.now().toString(36)}`,
        titulo: titulo.trim(),
        fecha: new Date().toISOString(),
        autor,
        periodo: etiquetaPeriodo(periodoId),
        periodoId,
        fuente: fuenteLabel,
        fuenteId,
        destinatario,
        formato,
        secciones: SECCIONES_REPORTE.map((s) => s.id).filter((id) => secciones.includes(id)),
      };
      const c = { ...contenido, titulo: reporte.titulo, fechaGeneracion: reporte.fecha };
      if (formato === 'pdf') {
        // Se carga bajo demanda: jsPDF solo funciona en el navegador.
        const { descargarPdfReporte } = await import('@/lib/pdf');
        descargarPdfReporte(c);
      } else {
        const { encabezados, filas } = filasCsv(c);
        descargarCSV(nombreArchivo(reporte.titulo, 'csv'), encabezados, filas);
      }
      guardarReporte(reporte);
      toast.success(`Reporte "${reporte.titulo}" generado y guardado en el historial.`, {
        action: { label: 'Ver historial', onClick: () => navigate({ to: '/historial' }) },
      });
    } catch {
      toast.error('No se pudo generar el reporte. Intente nuevamente.');
    } finally {
      setGenerando(false);
    }
  }

  const r = contenido.resumen;

  return (
    <AppLayout>
      <PageHeader
        titulo="Generar Reportes"
        subtitulo="Cree documentos institucionales con diseño profesional y secciones a medida."
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        {/* Formulario en dos columnas */}
        <div className="emi-card p-6 xl:col-span-3">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-navy">Datos del reporte</h2>
              <div className="space-y-1.5">
                <Label htmlFor="rtitulo">Título</Label>
                <Input id="rtitulo" value={titulo} maxLength={120} onChange={(e) => setTitulo(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Periodo</Label>
                <Select value={periodoId} onValueChange={setPeriodoId}>
                  <SelectTrigger aria-label="Periodo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIODOS.map((p) => (
                      <SelectItem key={p.valor} value={p.valor}>
                        {p.etiqueta}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Fuente</Label>
                <Select value={fuenteId} onValueChange={setFuenteId}>
                  <SelectTrigger aria-label="Fuente">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas las fuentes</SelectItem>
                    {fuentes.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-navy">Salida y secciones</h2>
              <div className="space-y-1.5">
                <Label>Destinatario</Label>
                <Select value={destinatario} onValueChange={setDestinatario}>
                  <SelectTrigger aria-label="Destinatario">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DESTINATARIOS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Formato de salida</Label>
                <RadioGroup
                  value={formato}
                  onValueChange={(v) => setFormato(v as 'pdf' | 'csv')}
                  className="grid grid-cols-2 gap-2"
                >
                  {(['pdf', 'csv'] as const).map((f) => (
                    <Label
                      key={f}
                      htmlFor={`fmt-${f}`}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                        formato === f ? 'border-emiblue bg-emiblue/5 text-navy' : 'border-border text-muted-foreground'
                      }`}
                    >
                      <RadioGroupItem id={`fmt-${f}`} value={f} />
                      {f === 'pdf' ? <FileText className="h-4 w-4" /> : <FileSpreadsheet className="h-4 w-4" />}
                      {f.toUpperCase()}
                    </Label>
                  ))}
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label>Secciones a incluir</Label>
                <div className="space-y-2">
                  {SECCIONES_REPORTE.map((s) => (
                    <div key={s.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`sec-${s.id}`}
                        checked={secciones.includes(s.id)}
                        onCheckedChange={() => toggleSeccion(s.id)}
                      />
                      <Label htmlFor={`sec-${s.id}`} className="cursor-pointer text-sm font-normal">
                        {s.etiqueta}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <Link to="/historial" className="text-sm font-medium text-emiblue hover:underline">
              Ver reportes anteriores
            </Link>
            <Button
              onClick={generar}
              disabled={generando}
              className="emi-btn-primary h-10 rounded-xl px-6 font-semibold"
            >
              {generando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Generar reporte
            </Button>
          </div>
        </div>

        {/* Vista previa */}
        <div className="emi-card p-6 xl:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <Eye className="h-4 w-4 text-emiblue" />
            <h2 className="text-sm font-semibold text-navy">Vista previa del documento</h2>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="bg-navy px-5 py-4 text-primary-foreground">
              <p className="text-[11px] font-bold uppercase tracking-wide">Escuela Militar de Ingeniería</p>
              <p className="text-[10px] opacity-75">EMI-UALP · Percepción institucional</p>
            </div>
            <div className="h-1 bg-gold" />

            <div className="space-y-4 p-5">
              <div>
                <p className="text-sm font-bold text-navy">{titulo || 'Sin título'}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {etiquetaPeriodo(periodoId)} · {fuenteLabel} · Para: {destinatario}
                </p>
              </div>

              {secciones.length === 0 && (
                <p className="text-xs text-muted-foreground">Seleccione al menos una sección.</p>
              )}

              {secciones.includes('resumen') && (
                <PreviewSeccion titulo="Resumen ejecutivo">
                  <p className="text-xs leading-relaxed text-muted-foreground">{contenido.textoResumen}</p>
                </PreviewSeccion>
              )}

              {secciones.includes('metricas') && (
                <PreviewSeccion titulo="Indicadores (KPI)">
                  <div className="grid grid-cols-4 gap-1.5 text-center">
                    {[
                      { e: 'Total', v: r.total, c: '#1f6feb' },
                      { e: 'Positivas', v: r.positivas, c: '#2e9e6b' },
                      { e: 'Neutrales', v: r.neutrales, c: '#e0a100' },
                      { e: 'Negativas', v: r.negativas, c: '#d64545' },
                    ].map((k) => (
                      <div key={k.e} className="rounded-md border border-border py-1.5" style={{ borderTop: `3px solid ${k.c}` }}>
                        <p className="text-sm font-bold text-navy">{k.v}</p>
                        <p className="text-[9px] text-muted-foreground">{k.e}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-1.5 text-[10px] text-muted-foreground">
                    F1 {contenido.metricas.f1} · Precisión {contenido.metricas.precision} · Recall{' '}
                    {contenido.metricas.recall} · CV {contenido.cvScore}
                  </p>
                </PreviewSeccion>
              )}

              {secciones.includes('factores') && (
                <PreviewSeccion titulo="Factores de percepción">
                  <div className="space-y-1">
                    {r.factores.slice(0, 5).map((f) => (
                      <div key={f.nombre} className="flex items-center gap-2 text-xs">
                        <span className="w-36 shrink-0 truncate text-muted-foreground">{f.nombre}</span>
                        <div className="h-1.5 flex-1 rounded-full bg-muted">
                          <div className="h-1.5 rounded-full bg-emiblue" style={{ width: `${Math.min(100, f.porcentaje * 3)}%` }} />
                        </div>
                        <span className="w-10 text-right font-semibold text-navy">{f.porcentaje}%</span>
                      </div>
                    ))}
                  </div>
                </PreviewSeccion>
              )}

              {secciones.includes('recomendaciones') && (
                <PreviewSeccion titulo="Recomendaciones">
                  <ol className="list-decimal space-y-1 pl-4 text-[11px] text-muted-foreground">
                    {contenido.recomendaciones.slice(0, 3).map((rec) => (
                      <li key={rec}>{rec}</li>
                    ))}
                  </ol>
                </PreviewSeccion>
              )}

              <div className="flex items-center justify-between border-t border-border pt-3 text-[10px] text-muted-foreground">
                <span>
                  {formato.toUpperCase()} · {autor} · {new Date().toLocaleDateString('es-BO')}
                </span>
                <span>Página 1</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function fuente(id: string, fuentes: { id: string; nombre: string }[]): string {
  return id === 'todas' ? 'Todas las fuentes' : (fuentes.find((f) => f.id === id)?.nombre ?? id);
}

function PreviewSeccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-navy">{titulo}</p>
      {children}
    </div>
  );
}
