import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ContenidoReporte } from '@/lib/reporte-datos';
import { nombreArchivo } from '@/lib/reporte-datos';

type RGB = [number, number, number];
const NAVY: RGB = [11, 37, 69];
const BLUE: RGB = [31, 111, 235];
const GOLD: RGB = [201, 162, 39];
const GRAY: RGB = [90, 106, 128];
const TEXTO: RGB = [40, 40, 40];
const POSITIVO: RGB = [46, 158, 107];
const NEUTRAL: RGB = [224, 161, 0];
const NEGATIVO: RGB = [214, 69, 69];

// Las fuentes estándar de jsPDF solo cubren Latin-1: se reemplazan símbolos fuera de ese rango.
const limpiar = (t: string) => t.replace(/[—–]/g, '-').replace(/≥/g, '>=').replace(/≤/g, '<=');

function lastY(doc: jsPDF, fallback: number): number {
  return (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? fallback;
}

export function generarPdfReporte(c: ContenidoReporte): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const ancho = doc.internal.pageSize.getWidth();
  const alto = doc.internal.pageSize.getHeight();
  const izq = 45;
  const der = ancho - 45;
  const r = c.resumen;
  let y = 0;
  let numero = 0;

  const asegurarEspacio = (necesario: number) => {
    if (y > alto - necesario) {
      doc.addPage();
      y = 60;
    }
  };
  const tituloSeccion = (texto: string) => {
    asegurarEspacio(120);
    numero += 1;
    doc.setTextColor(...NAVY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`${numero}. ${texto}`, izq, y);
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(1.5);
    doc.line(izq, y + 5, izq + 40, y + 5);
    y += 18;
  };

  // ----- Encabezado institucional -----
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, ancho, 86, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(0, 86, ancho, 4, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('ESCUELA MILITAR DE INGENIERÍA', izq, 36);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Unidad Académica La Paz (EMI-UALP)', izq, 54);
  doc.text('Sistema de Percepción Institucional en Redes Sociales', izq, 69);
  doc.setTextColor(...GOLD);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('PercepciónEMI', der, 36, { align: 'right' });

  // ----- Datos del reporte -----
  y = 122;
  doc.setTextColor(...NAVY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  const lineasTitulo = doc.splitTextToSize(limpiar(c.titulo), der - izq);
  doc.text(lineasTitulo, izq, y);
  y += lineasTitulo.length * 18;

  autoTable(doc, {
    startY: y,
    body: [
      ['Periodo', limpiar(c.periodo), 'Fuente', limpiar(c.fuente)],
      ['Destinatario', limpiar(c.destinatario), 'Generado por', limpiar(c.autor)],
    ],
    theme: 'plain',
    styles: { fontSize: 9, textColor: TEXTO, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: GRAY, cellWidth: 75 },
      2: { fontStyle: 'bold', textColor: GRAY, cellWidth: 75 },
    },
    margin: { left: izq - 3, right: 45 },
  });
  y = lastY(doc, y) + 22;

  // ----- Resumen ejecutivo -----
  if (c.secciones.includes('resumen')) {
    tituloSeccion('Resumen ejecutivo');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...TEXTO);
    const lineas = doc.splitTextToSize(limpiar(c.textoResumen), der - izq);
    doc.text(lineas, izq, y);
    y += lineas.length * 13 + 16;
  }

  // ----- KPIs + métricas -----
  if (c.secciones.includes('metricas')) {
    tituloSeccion('Indicadores de percepción (KPI)');
    autoTable(doc, {
      startY: y,
      head: [['Indicador', 'Cantidad', 'Porcentaje']],
      body: [
        ['Total de opiniones', String(r.total), '100%'],
        ['Positivas', String(r.positivas), `${r.pctPositivo}%`],
        ['Neutrales', String(r.neutrales), `${r.pctNeutral}%`],
        ['Negativas', String(r.negativas), `${r.pctNegativo}%`],
      ],
      theme: 'grid',
      headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: TEXTO },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
      margin: { left: izq, right: 45 },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 0 && data.row.index > 0) {
          const colores = [BLUE, POSITIVO, NEUTRAL, NEGATIVO];
          data.cell.styles.textColor = colores[data.row.index]!;
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });
    y = lastY(doc, y) + 14;
    autoTable(doc, {
      startY: y,
      head: [['Métrica del modelo', 'Valor', 'Umbral', 'Estado']],
      body: [
        ['F1-Score (BETO)', String(c.metricas.f1), '>= 0.75', c.metricas.f1 >= 0.75 ? 'Cumple' : 'No cumple'],
        ['Precisión (BETO)', String(c.metricas.precision), '>= 0.75', c.metricas.precision >= 0.75 ? 'Cumple' : 'No cumple'],
        ['Recall (BETO)', String(c.metricas.recall), '>= 0.70', c.metricas.recall >= 0.7 ? 'Cumple' : 'No cumple'],
        ['Coherencia CV (BERTopic)', String(c.cvScore), '>= 0.50', c.cvScore >= 0.5 ? 'Cumple' : 'No cumple'],
      ],
      theme: 'grid',
      headStyles: { fillColor: BLUE, textColor: [255, 255, 255], fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: TEXTO },
      margin: { left: izq, right: 45 },
    });
    y = lastY(doc, y) + 24;
  }

  // ----- Factores -----
  if (c.secciones.includes('factores')) {
    tituloSeccion('Factores de percepción identificados');
    autoTable(doc, {
      startY: y,
      head: [['Factor', 'Peso', 'Menciones', 'Negativas', 'Términos representativos']],
      body: r.factores.map((f) => [
        limpiar(f.nombre),
        `${f.porcentaje}%`,
        String(f.menciones),
        String(f.negativas),
        limpiar(f.terminos.join(', ')),
      ]),
      theme: 'striped',
      headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontSize: 9 },
      bodyStyles: { fontSize: 8.5, textColor: TEXTO },
      alternateRowStyles: { fillColor: [244, 247, 251] },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
      margin: { left: izq, right: 45 },
    });
    y = lastY(doc, y) + 24;
  }

  // ----- Recomendaciones -----
  if (c.secciones.includes('recomendaciones')) {
    tituloSeccion('Recomendaciones');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...TEXTO);
    c.recomendaciones.forEach((rec, i) => {
      const lineas = doc.splitTextToSize(limpiar(rec), der - izq - 18);
      asegurarEspacio(60 + lineas.length * 13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...BLUE);
      doc.text(`${i + 1}.`, izq + 2, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...TEXTO);
      doc.text(lineas, izq + 18, y);
      y += lineas.length * 13 + 8;
    });
  }

  // ----- Pie de página: fecha y paginación -----
  const fecha = new Date(c.fechaGeneracion).toLocaleDateString('es-BO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    const py = alto - 25;
    doc.setDrawColor(220, 228, 238);
    doc.setLineWidth(0.5);
    doc.line(izq, py - 10, der, py - 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(`EMI-UALP · PercepciónEMI · Generado el ${fecha}`, izq, py);
    doc.text(`Página ${i} de ${total}`, der, py, { align: 'right' });
  }

  return doc;
}

export function descargarPdfReporte(c: ContenidoReporte): void {
  generarPdfReporte(c).save(nombreArchivo(c.titulo, 'pdf'));
}
