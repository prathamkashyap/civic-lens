import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, AlertTriangle, BarChart3, CheckCircle2, Layers3 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Report } from '@/types';
import { HotspotSummary } from '@/types/map';

type MatrixExport = {
  categories: string[];
  priorities: string[];
  matrix: number[][];
};

type RiskBin = { bin: string; count: number };

type AnalyticsExports = {
  matrix: MatrixExport | null;
  riskBins: RiskBin[];
  hotspots: HotspotSummary[];
};

const chartColors = {
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  warning: '#f59e0b',
  danger: 'hsl(var(--destructive))',
  success: '#10b981',
  muted: 'hsl(var(--muted-foreground))',
};

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '0.5rem',
  color: 'hsl(var(--foreground))',
};

export default function AnalyticsDashboard({ reports }: { reports: Report[] }) {
  const [exports, setExports] = useState<AnalyticsExports>({ matrix: null, riskBins: [], hotspots: [] });

  useEffect(() => {
    const loadExports = async () => {
      const [matrixResponse, riskResponse, hotspotResponse] = await Promise.all([
        fetch('/category_priority_matrix.json'),
        fetch('/risk_score_bins.json'),
        fetch('/hotspot_summary.json'),
      ]);

      setExports({
        matrix: matrixResponse.ok ? await matrixResponse.json() as MatrixExport : null,
        riskBins: riskResponse.ok ? await riskResponse.json() as RiskBin[] : [],
        hotspots: hotspotResponse.ok ? await hotspotResponse.json() as HotspotSummary[] : [],
      });
    };

    loadExports().catch((error) => console.error('Analytics exports unavailable:', error));
  }, []);

  const total = reports.length;
  const highPriority = reports.filter((report) => report.priority === 'HIGH').length;
  const pending = reports.filter((report) => report.status === 'Pending').length;
  const completed = reports.filter((report) => report.status === 'Completed').length;
  const resolutionRate = total ? Math.round((completed / total) * 100) : 0;

  const categoryCounts = reports.reduce<Record<string, number>>((counts, report) => {
    counts[report.category] = (counts[report.category] || 0) + 1;
    return counts;
  }, {});
  const categoryData = Object.entries(categoryCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const priorityData = [
    { name: 'High', value: highPriority, color: chartColors.danger },
    { name: 'Medium', value: reports.filter((report) => report.priority === 'MEDIUM').length, color: chartColors.warning },
    { name: 'Low', value: reports.filter((report) => report.priority === 'LOW').length, color: chartColors.primary },
  ];

  const statusData = [
    { name: 'Pending', value: pending, color: chartColors.warning },
    { name: 'Completed', value: completed, color: chartColors.success },
    { name: 'Cancelled', value: reports.filter((report) => report.status === 'Cancelled').length, color: chartColors.danger },
  ];

  const trendCounts = reports.reduce<Record<string, number>>((counts, report) => {
    const month = format(new Date(report.timestamp), 'MMM yy');
    counts[month] = (counts[month] || 0) + 1;
    return counts;
  }, {});
  const trendData = Object.entries(trendCounts)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => new Date(`1 ${a.month}`).getTime() - new Date(`1 ${b.month}`).getTime());

  const topHotspots = [...exports.hotspots]
    .filter((hotspot) => hotspot.cluster_id !== -1)
    .sort((a, b) => b.risk_score - a.risk_score)
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Civic intelligence</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">What needs attention?</h2>
          <p className="mt-2 text-sm text-muted-foreground">Live Firestore reports are paired with the current ML export artifacts.</p>
        </div>
        <p className="text-xs text-muted-foreground">{total} live reports analyzed</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InsightCard icon={Layers3} label="Reports analyzed" value={total.toString()} detail="Live report collection" tone="primary" />
        <InsightCard icon={AlertTriangle} label="High priority" value={highPriority.toString()} detail={total ? `${Math.round((highPriority / total) * 100)}% of reports` : 'No reports yet'} tone="danger" />
        <InsightCard icon={Activity} label="Awaiting action" value={pending.toString()} detail="Current pending status" tone="warning" />
        <InsightCard icon={CheckCircle2} label="Resolution rate" value={`${resolutionRate}%`} detail={`${completed} completed reports`} tone="success" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="border-border/70 bg-card/75 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="h-4 w-4 text-primary" />Reports over time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {trendData.length ? <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <defs><linearGradient id="reportTrendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={chartColors.primary} stopOpacity={0.3} /><stop offset="100%" stopColor={chartColors.primary} stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: chartColors.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: chartColors.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="count" name="Reports" stroke={chartColors.primary} fill="url(#reportTrendFill)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer> : <EmptyState text="Trend data will appear once reports have timestamps." />}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/75 shadow-sm">
          <CardHeader><CardTitle className="text-base">Status mix</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={86} paddingAngle={4}>
                    {statusData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">{statusData.map((entry) => <div key={entry.name}><p className="font-semibold" style={{ color: entry.color }}>{entry.value}</p><p className="text-muted-foreground">{entry.name}</p></div>)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="border-border/70 bg-card/75 shadow-sm">
          <CardHeader><CardTitle className="text-base">Category concentration</CardTitle></CardHeader>
          <CardContent><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}><CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" horizontal={false} /><XAxis type="number" allowDecimals={false} tick={{ fill: chartColors.muted, fontSize: 12 }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="name" width={90} tick={{ fill: chartColors.muted, fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="value" name="Reports" fill={chartColors.secondary} radius={[0, 5, 5, 0]} /></BarChart></ResponsiveContainer></div></CardContent>
        </Card>

        <Card className="border-border/70 bg-card/75 shadow-sm">
          <CardHeader><CardTitle className="text-base">Priority distribution</CardTitle></CardHeader>
          <CardContent><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={priorityData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}><CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fill: chartColors.muted, fontSize: 12 }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fill: chartColors.muted, fontSize: 12 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="value" name="Reports" radius={[5, 5, 0, 0]}>{priorityData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Bar></BarChart></ResponsiveContainer></div></CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Card className="border-border/70 bg-card/75 shadow-sm">
          <CardHeader><CardTitle className="text-base">Priority by category</CardTitle></CardHeader>
          <CardContent>{exports.matrix ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-border text-xs text-muted-foreground"><th className="pb-3 font-medium">Category</th>{exports.matrix.priorities.map((priority) => <th key={priority} className="pb-3 text-right font-medium">{priority}</th>)}</tr></thead><tbody>{exports.matrix.categories.map((category, rowIndex) => <tr key={category} className="border-b border-border/60 last:border-0"><td className="py-3 font-medium">{category}</td>{exports.matrix.priorities.map((priority, columnIndex) => <td key={priority} className="py-3 text-right text-muted-foreground">{exports.matrix?.matrix[rowIndex]?.[columnIndex] ?? 0}</td>)}</tr>)}</tbody></table><p className="mt-4 text-xs text-muted-foreground">Generated priority export; live report counts above reflect the current Firestore collection.</p></div> : <EmptyState text="Priority matrix export unavailable." />}</CardContent>
        </Card>

        <Card className="border-border/70 bg-card/75 shadow-sm">
          <CardHeader><CardTitle className="text-base">Highest-risk hotspots</CardTitle></CardHeader>
          <CardContent>{topHotspots.length ? <div className="space-y-3">{topHotspots.map((hotspot) => <div key={hotspot.cluster_id} className="flex items-center justify-between gap-3 rounded-lg bg-muted/60 p-3"><div><p className="font-medium">Cluster {hotspot.cluster_id}</p><p className="text-xs text-muted-foreground">{hotspot.complaint_count} reports · {hotspot.dominant_category}</p></div><div className="text-right"><p className="font-semibold text-amber-600 dark:text-amber-400">{hotspot.risk_score.toFixed(2)}</p><p className="text-xs text-muted-foreground">risk score</p></div></div>)}</div> : <EmptyState text="Hotspot export unavailable." />}</CardContent>
        </Card>
      </div>

      {exports.riskBins.length > 0 && <Card className="border-border/70 bg-card/75 shadow-sm"><CardHeader><CardTitle className="text-base">Model risk bins</CardTitle></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-4">{exports.riskBins.map((bin) => <div key={bin.bin} className="rounded-lg bg-muted/60 p-3"><p className="text-xs text-muted-foreground">{bin.bin}</p><p className="mt-1 text-xl font-semibold">{bin.count}</p><p className="text-xs text-muted-foreground">exported records</p></div>)}</div></CardContent></Card>}
    </div>
  );
}

function InsightCard({ icon: Icon, label, value, detail, tone }: { icon: typeof Layers3; label: string; value: string; detail: string; tone: 'primary' | 'danger' | 'warning' | 'success' }) {
  const color = tone === 'danger' ? 'text-destructive' : tone === 'warning' ? 'text-amber-500 dark:text-amber-400' : tone === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary';
  return <Card className="border-border/70 bg-card/75 shadow-sm"><CardContent className="p-5"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{label}</p><Icon className={`h-4 w-4 ${color}`} /></div><p className={`mt-3 text-3xl font-bold ${color}`}>{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></CardContent></Card>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="flex h-full min-h-40 items-center justify-center text-center text-sm text-muted-foreground">{text}</div>;
}
