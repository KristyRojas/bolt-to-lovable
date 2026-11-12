import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { FileText, Trash2, FileSpreadsheet, Inbox, CalendarDays, User, Database, Clock } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getReportes, eliminarReporte, type ReporteGuardado } from '@/services/historial.service';
import { getAnalisisConsolidado } from '@/services/analisis.service';
import { descargarCSV } from '@/lib/csv';
import { contenidoReporte, etiquetaSeccion, filasCsv, nombreArchivo } from '@/lib/reporte-datos';

export const Route = createFileRoute('/historial')({
  head: () => ({
    meta: [
      { title: 'Historial de reportes — PercepciónEMI' },
      { name: 'description', content: 'Revise, descargue o elimine los reportes generados.' },
      { property: 'og:title', content: 'Historial de reportes — PercepciónEMI' },
      { property: 'og:description', content: 'Revise, descargue o elimine los reportes generados.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: HistorialPage,
});

function formatearFecha(iso: string) {
  return new Date(iso).toLocaleString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function HistorialPage() {
  const [reportes, setReportes] = useState<ReporteGuardado[]>([]);
  const [aEliminar, setAEliminar] = useState<ReporteGuardado | null>(null);

  function refrescar() {
    setReportes(getReportes());
  }

  useEffect(() => {
    refrescar();
  }, []);

  function handleEliminar() {
    if (!aEliminar) return;
    eliminarReporte(aEliminar.id);
    toast.success(`Reporte "${aEliminar.titulo}" eliminado del historial.`);
    setAEliminar(null);
    refrescar();
  }

  async function descargar(r: ReporteGuardado, formato: 'pdf' | 'csv') {
    try {
      const contenido = contenidoReporte(r, getAnalisisConsolidado());
      if (formato === 'pdf') {
        // Se carga bajo demanda: jsPDF solo funciona en el navegador.
        const { descargarPdfReporte } = await import('@/lib/pdf');
        descargarPdfReporte(contenido);
      } else {
        const { encabezados, filas } = filasCsv(contenido);
        descargarCSV(nombreArchivo(r.titulo, 'csv'), encabezados, filas);
      }
      toast.success(`Descargando "${r.titulo}" en ${formato.toUpperCase()}.`);
    } catch {
      toast.error('No se pudo descargar el reporte.');
    }
  }

  return (
    <AppLayout>
      <PageHeader
        titulo="Gestionar Historial"
        subtitulo="Revise, descargue o elimine los reportes generados anteriormente."
      />

      {reportes.length === 0 ? (
        <div className="emi-empty emi-card">
          <Inbox className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium">No hay reportes generados</p>
          <p className="mt-1 text-xs">Los reportes que genere aparecerán aquí.</p>
          <Button asChild size="sm" className="emi-btn-primary mt-4 rounded-lg">
            <Link to="/reportes">Generar un reporte</Link>
          </Button>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">{reportes.length} reporte(s) en el historial</p>

          <Accordion type="single" collapsible className="space-y-3">
            {reportes.map((r) => (
              <AccordionItem key={r.id} value={r.id} className="emi-card overflow-hidden border-0 px-5">
                <AccordionTrigger className="py-4 hover:no-underline">
                  <div className="flex min-w-0 flex-1 items-center gap-4 pr-3 text-left">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy/10">
                      {r.formato === 'pdf' ? (
                        <FileText className="h-5 w-5 text-navy" />
                      ) : (
                        <FileSpreadsheet className="h-5 w-5 text-navy" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-navy">{r.titulo}</p>
                      <p className="truncate text-xs font-normal text-muted-foreground">
                        {formatearFecha(r.fecha)} · {r.autor}
                      </p>
                    </div>
                    <Badge variant="outline" className="hidden shrink-0 border-border text-muted-foreground sm:inline-flex">
                      {r.periodo}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-5 pt-1">
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                      <Dato icono={CalendarDays} etiqueta="Fecha" valor={formatearFecha(r.fecha)} />
                      <Dato icono={User} etiqueta="Autor" valor={r.autor} />
                      <Dato icono={Clock} etiqueta="Periodo" valor={r.periodo} />
                      <Dato icono={Database} etiqueta="Fuente" valor={r.fuente} />
                    </dl>
                    <div className="mt-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Secciones incluidas
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {r.secciones.map((s) => (
                          <Badge key={s} variant="outline" className="border-border text-[11px] text-muted-foreground">
                            {etiquetaSeccion(s)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                      <Button size="sm" className="emi-btn-primary rounded-lg font-semibold" onClick={() => descargar(r, 'pdf')}>
                        <FileText className="mr-1.5 h-4 w-4" />
                        Descargar PDF
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-lg font-semibold" onClick={() => descargar(r, 'csv')}>
                        <FileSpreadsheet className="mr-1.5 h-4 w-4" />
                        Descargar CSV
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-auto rounded-lg border-destructive/40 font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setAEliminar(r)}
                      >
                        <Trash2 className="mr-1.5 h-4 w-4" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </>
      )}

      <AlertDialog open={aEliminar !== null} onOpenChange={(abierto) => !abierto && setAEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este reporte?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará "{aEliminar?.titulo}" del historial. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleEliminar}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}

function Dato({ icono: Icono, etiqueta, valor }: { icono: typeof User; etiqueta: string; valor: string }) {
  return (
    <div>
      <dt className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icono className="h-3.5 w-3.5" />
        {etiqueta}
      </dt>
      <dd className="mt-0.5 text-navy">{valor}</dd>
    </div>
  );
}
