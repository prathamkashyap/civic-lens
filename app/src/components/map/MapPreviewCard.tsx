import { format } from 'date-fns';
import { ArrowRight, CalendarDays, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Report } from '@/types';

export function MapPreviewCard({ report, onView }: { report: Report; onView: () => void }) {
  const location = report.location.address || report.address || `${report.location.lat.toFixed(4)}, ${report.location.lng.toFixed(4)}`;
  const priorityClass = report.priority === 'HIGH'
    ? 'bg-destructive/10 text-destructive border-destructive/20'
    : report.priority === 'MEDIUM'
      ? 'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300'
      : 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300';

  return (
    <Card className="border-border/70 bg-card/90 shadow-sm">
      {report.photo && <img src={report.photo} alt={`${report.category} report`} loading="lazy" className="h-36 w-full rounded-t-xl object-cover" />}
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Selected report</p>
            <h2 className="mt-1 text-xl font-semibold">{report.category} issue</h2>
          </div>
          <Badge variant="outline" className={priorityClass}>{report.priority}</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{report.status}</Badge>
          <span className="text-xs text-muted-foreground">Priority level: {report.priority}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <p className="line-clamp-3 text-sm text-muted-foreground">{report.description || 'No description provided.'}</p>
        <div className="space-y-2 text-xs text-muted-foreground">
          <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{location}</p>
          <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 shrink-0 text-primary" />{format(new Date(report.timestamp), 'MMM d, yyyy')}</p>
        </div>
        <Button onClick={onView} className="w-full">View report <ArrowRight className="ml-2 h-4 w-4" /></Button>
      </CardContent>
    </Card>
  );
}
