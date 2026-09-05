import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { AlertTriangle, CheckCircle2, Clock3, ExternalLink, ShieldAlert, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

import { db } from '@/firebaseConfig';
import MainLayout from '@/layouts/MainLayout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Report, ReportCategory, ReportStatus, PriorityLevel } from '@/types';

const categories: ReportCategory[] = ['Waste', 'Pothole', 'Streetlight', 'Drainage', 'Water Supply'];
const priorities: PriorityLevel[] = ['LOW', 'MEDIUM', 'HIGH'];

const normalizeCategory = (value: unknown): ReportCategory => categories.includes(value as ReportCategory) ? value as ReportCategory : 'Waste';
const normalizeStatus = (value: unknown): ReportStatus => value === 'Completed' || value === 'Fixed' || value === 'Resolved' ? 'Completed' : value === 'Cancelled' ? 'Cancelled' : 'Pending';
const normalizePriority = (value: unknown): PriorityLevel => {
  const normalized = String(value || '').toUpperCase() as PriorityLevel;
  return priorities.includes(normalized) ? normalized : 'LOW';
};

export default function Admin() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onSnapshot(collection(db, 'reports'), (snapshot) => {
      setReports(snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId || 'unknown',
          userEmail: data.userEmail || 'unknown',
          category: normalizeCategory(data.category),
          priority: normalizePriority(data.priority),
          location: {
            lat: data.location?.lat || 0,
            lng: data.location?.lng || 0,
            address: data.location?.address || data.address || 'No address provided',
          },
          photo: data.photoUrl || data.photo || '',
          description: data.description || '',
          status: normalizeStatus(data.status),
          address: data.address || '',
          timestamp: data.timestamp?.toDate?.() || new Date(data.timestamp || Date.now()),
          updatedAt: data.updatedAt?.toDate?.() || null,
          assignedTo: data.assignedTo || '',
        };
      }));
      setLoading(false);
    }, () => setLoading(false));
  }, []);

  const pendingReports = reports.filter((report) => report.status === 'Pending');
  const highPriority = reports.filter((report) => report.priority === 'HIGH');
  const completedReports = reports.filter((report) => report.status === 'Completed');
  const unassigned = pendingReports.filter((report) => !report.assignedTo);
  const priorityOrder: Record<PriorityLevel, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
  const queue = [...pendingReports]
    .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority] || new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .slice(0, 6);

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Operations console</p>
            <h1 className="text-4xl font-bold tracking-tight">Admin overview</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">Monitor report flow, identify work needing attention, and open the underlying report record.</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline"><Link to="/map">Open map</Link></Button>
            <Button asChild><Link to="/dashboard">Dashboard</Link></Button>
          </div>
        </div>

        <Alert className="border-amber-500/30 bg-amber-500/10 text-foreground">
          <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <AlertTitle>Read-only operations view</AlertTitle>
          <AlertDescription className="text-muted-foreground">Server-verified administrator roles are not configured, so status changes, assignment, and deletion remain disabled. The metrics below are live report data.</AlertDescription>
        </Alert>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AdminMetric icon={Clock3} label="Needs attention" value={pendingReports.length} tone="warning" />
          <AdminMetric icon={AlertTriangle} label="High priority" value={highPriority.length} tone="danger" />
          <AdminMetric icon={Users} label="Unassigned" value={unassigned.length} tone="primary" />
          <AdminMetric icon={CheckCircle2} label="Completed" value={completedReports.length} tone="success" />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
          <Card className="border-border/70 bg-card/75 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div><CardTitle className="text-base">Priority queue</CardTitle><p className="mt-1 text-sm text-muted-foreground">Pending reports ordered by priority and age.</p></div>
              <Badge variant="outline">{pendingReports.length} pending</Badge>
            </CardHeader>
            <CardContent>
              {loading ? <p className="py-12 text-center text-sm text-muted-foreground">Loading operations data...</p> : queue.length ? <div className="space-y-3">{queue.map((report) => <QueueRow key={report.id} report={report} />)}</div> : <p className="py-12 text-center text-sm text-muted-foreground">No pending reports require attention.</p>}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/75 shadow-sm">
            <CardHeader><CardTitle className="text-base">Operational actions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <ActionLink to="/reports" label="Review all reports" detail="Search and filter report records" />
              <ActionLink to="/map" label="Inspect spatial activity" detail="Open reports and hotspot layers" />
              <ActionLink to="/dashboard" label="Review analytics" detail="Explore live and ML-derived signals" />
              <div className="mt-5 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">Mutation tools will become available after a server-verified admin role is added to the authentication model.</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

function AdminMetric({ icon: Icon, label, value, tone }: { icon: typeof Clock3; label: string; value: number; tone: 'warning' | 'danger' | 'primary' | 'success' }) {
  const color = tone === 'warning' ? 'text-amber-500 dark:text-amber-400' : tone === 'danger' ? 'text-destructive' : tone === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary';
  return <Card className="border-border/70 bg-card/75 shadow-sm"><CardContent className="p-5"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{label}</p><Icon className={`h-4 w-4 ${color}`} /></div><p className={`mt-3 text-3xl font-bold ${color}`}>{value}</p></CardContent></Card>;
}

function QueueRow({ report }: { report: Report }) {
  const priorityClass = report.priority === 'HIGH' ? 'bg-destructive/10 text-destructive border-destructive/20' : report.priority === 'MEDIUM' ? 'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300' : 'bg-primary/10 text-primary border-primary/20';
  const location = report.location.address || report.address || 'Location unavailable';
  return <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-muted/30 p-4 md:flex-row md:items-center md:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{report.category} issue</p><Badge variant="outline" className={priorityClass}>{report.priority}</Badge><Badge variant="outline">{report.status}</Badge></div><p className="mt-1 truncate text-sm text-muted-foreground">{location}</p><p className="mt-1 text-xs text-muted-foreground">Reported {formatDistanceToNow(new Date(report.timestamp), { addSuffix: true })}</p></div><Button asChild variant="outline" size="sm" className="shrink-0"><Link to={`/reports/${report.id}`}>Open report <ExternalLink className="ml-2 h-3.5 w-3.5" /></Link></Button></div>;
}

function ActionLink({ to, label, detail }: { to: string; label: string; detail: string }) {
  return <Link to={to} className="block rounded-lg border border-border/70 p-3 transition-colors hover:bg-muted"><p className="text-sm font-medium">{label}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></Link>;
}
