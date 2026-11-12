import { createFileRoute } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
  LabelList,
} from 'recharts';
import { Filter, MessageSquare, SmilePlus, MinusCircle, Frown, Info } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  getAnalisisConsolidado,
  fuentesDisponibles,
  filtrarOpiniones,
  resumirOpiniones,
  evolucionMensual,
  PERIODOS,
} from '@/services/analisis.service';

export const Route = createFileRoute('/dashboard')({
  head: () => ({
    meta: [
      { title: 'Dashboard de percepción — PercepciónEMI' },
      { name: 'description', content: 'Indicadores visuales de percepción institucional por polaridad y factor.' },
      { property: 'og:title', content: 'Dashboard de percepción — PercepciónEMI' },
      { property: 'og:description', content: 'Indicadores visuales de percepción institucional por polaridad y factor.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: DashboardPage,
});

const COLORES = {
  total: '#1f6feb',
  positivo: '#2e9e6b',
  neutral: '#e0a100',
  negativo: '#d64545',
};

const tooltipStyle = {
  borderRadius: '0.75rem',
  border: '1px solid #e8edf5',
  boxShadow: '0 8px 24px rgba(11, 37, 69, 0.12)',
  fontSize: '0.8rem',
};

function KpiCard({
  etiqueta,
  valor,
  porcentaje,
  color,
  icono: Icono,
}: {
  etiqueta: string;
  valor: number;
  porcentaje?: number;
  color: string;
  icono: typeof MessageSquare;
}) {
  return (
    <div className="emi-card overflow-hidden p-5" style={{ borderTop: `4px solid ${color}` }}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{etiqueta}</p>
          <p className="mt-1 text-3xl font-bold text-navy">{valor}</p>
          <p className="mt-0.5 text-xs font-semibold" style={{ color }}>
            {porcentaje !== undefined ? `${porcentaje}% del total` : 'opiniones analizadas'}
          </p>
        </div>
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${color}1a` }}
        >
          <Icono className="h-5 w-5" style={{ color }} />
        </div>
      </div>
    </div>
  );
}

function DashboardPage() {
  const analisis = useMemo(() => getAnalisisConsolidado(), []);
  const fuentes = useMemo(() => fuentesDisponibles(), []);
  const [fuenteId, setFuenteId] = useState<string>('todas');
  const [periodo, setPeriodo] = useState<string>('todo');

  const opiniones = useMemo(
    () => filtrarOpiniones(analisis.opiniones, { fuenteId, periodo }, analisis.referencia),
    [analisis, fuenteId, periodo]
  );
  const resumen = useMemo(
    () => resumirOpiniones(opiniones, analisis.resultados.factores),
    [opiniones, analisis.resultados.factores]
  );
  const evolucion = useMemo(
    () => evolucionMensual(opiniones, analisis.referencia),
    [opiniones, analisis.referencia]
  );

  const datosDona = [
    { nombre: 'Positivas', valor: resumen.positivas, pct: resumen.pctPositivo, color: COLORES.positivo },
    { nombre: 'Neutrales', valor: resumen.neutrales, pct: resumen.pctNeutral, color: COLORES.neutral },
    { nombre: 'Negativas', valor: resumen.negativas, pct: resumen.pctNegativo, color: COLORES.negativo },
  ];
  const datosFactores = resumen.factores.filter((f) => f.menciones > 0);

  return (
    <AppLayout>
      <PageHeader
        titulo="Consultar Dashboard"
        subtitulo="Panorama general de la percepción institucional en redes sociales."
      />

      {analisis.esEjemplo && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground">
          <Info className="h-4 w-4 shrink-0 text-emiblue" />
          Aún no hay un análisis PLN guardado: se muestran datos de ejemplo.
        </div>
      )}

      {/* Filtros */}
      <div className="emi-card mb-6 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Filter className="h-4 w-4 text-emiblue" />
          <h2 className="text-sm font-semibold text-navy">Filtros</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Fuente</Label>
            <Select value={fuenteId} onValueChange={setFuenteId}>
              <SelectTrigger aria-label="Fuente">
                <SelectValue placeholder="Todas las fuentes" />
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
          <div className="space-y-1.5">
            <Label>Periodo</Label>
            <Select value={periodo} onValueChange={setPeriodo}>
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
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard etiqueta="Total" valor={resumen.total} color={COLORES.total} icono={MessageSquare} />
        <KpiCard etiqueta="Positivas" valor={resumen.positivas} porcentaje={resumen.pctPositivo} color={COLORES.positivo} icono={SmilePlus} />
        <KpiCard etiqueta="Negativas" valor={resumen.negativas} porcentaje={resumen.pctNegativo} color={COLORES.negativo} icono={Frown} />
        <KpiCard etiqueta="Neutrales" valor={resumen.neutrales} porcentaje={resumen.pctNeutral} color={COLORES.neutral} icono={MinusCircle} />
      </div>

      {/* Dona + Barras de factores */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="chart-card xl:col-span-2">
          <h2 className="text-base font-semibold text-navy">Distribución de polaridad</h2>
          <p className="mb-2 text-xs text-muted-foreground">Porcentaje de opiniones por sentimiento</p>
          {resumen.total === 0 ? (
            <SinDatos />
          ) : (
            <>
              <div className="relative">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={datosDona}
                      dataKey="valor"
                      nameKey="nombre"
                      innerRadius="65%"
                      outerRadius="100%"
                      paddingAngle={2}
                      strokeWidth={0}
                      startAngle={90}
                      endAngle={-270}
                    >
                      {datosDona.map((d) => (
                        <Cell key={d.nombre} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: number, name: string) => [
                        `${value} (${resumen.total ? Math.round((value / resumen.total) * 1000) / 10 : 0}%)`,
                        name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-navy">{resumen.total}</span>
                  <span className="text-xs text-muted-foreground">opiniones</span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {datosDona.map((d) => (
                  <div key={d.nombre} className="rounded-lg bg-muted/40 py-2 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-xs text-muted-foreground">{d.nombre}</span>
                    </div>
                    <p className="text-lg font-bold" style={{ color: d.color }}>
                      {d.pct}%
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="chart-card xl:col-span-3">
          <h2 className="text-base font-semibold text-navy">Factores de percepción</h2>
          <p className="mb-2 text-xs text-muted-foreground">Peso de cada factor sobre las opiniones filtradas</p>
          {datosFactores.length === 0 ? (
            <SinDatos />
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(220, datosFactores.length * 44)}>
              <BarChart data={datosFactores} layout="vertical" margin={{ top: 5, right: 48, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef1f6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#5a6a80' }} axisLine={false} tickLine={false} unit="%" />
                <YAxis
                  type="category"
                  dataKey="nombre"
                  width={150}
                  tick={{ fontSize: 12, fill: '#0b2545' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: '#f4f7fb' }}
                  contentStyle={tooltipStyle}
                  formatter={(v: number, _n, item) => [
                    `${v}% · ${(item?.payload as { menciones: number }).menciones} menciones`,
                    'Peso',
                  ]}
                />
                <Bar dataKey="porcentaje" fill={COLORES.total} radius={[0, 6, 6, 0]} maxBarSize={22}>
                  <LabelList
                    dataKey="porcentaje"
                    position="right"
                    formatter={(v: number) => `${v}%`}
                    style={{ fontSize: 11, fill: '#0b2545', fontWeight: 600 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Evolución mensual */}
      <div className="chart-card mt-6">
        <h2 className="text-base font-semibold text-navy">Evolución mensual por polaridad</h2>
        <p className="mb-2 text-xs text-muted-foreground">Opiniones por mes en los últimos 6 meses</p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={evolucion} margin={{ top: 8, right: 12, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef1f6" vertical={false} />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#5a6a80' }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#5a6a80' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '0.75rem' }} />
            <Line type="monotone" dataKey="positivo" name="Positivas" stroke={COLORES.positivo} strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="neutral" name="Neutrales" stroke={COLORES.neutral} strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="negativo" name="Negativas" stroke={COLORES.negativo} strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </AppLayout>
  );
}

function SinDatos() {
  return (
    <div className="emi-empty h-[220px]">
      <p className="text-sm font-medium">Sin opiniones</p>
      <p className="mt-1 text-xs">No hay datos para la fuente y el periodo seleccionados.</p>
    </div>
  );
}
