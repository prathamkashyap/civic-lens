import { Crosshair, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { HotspotSummary } from '@/types/map';

export function HotspotPreviewCard({ hotspot, onInspect }: { hotspot: HotspotSummary; onInspect: () => void }) {
  const riskClass = hotspot.risk_level === 'HIGH'
    ? 'bg-destructive/10 text-destructive border-destructive/20'
    : hotspot.risk_level === 'MEDIUM'
      ? 'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300'
      : 'bg-primary/10 text-primary border-primary/20';

  return (
    <Card className="border-border/70 bg-card/90 shadow-sm">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-600 dark:text-amber-400">DBSCAN hotspot</p>
            <h2 className="mt-1 text-xl font-semibold">Cluster {hotspot.cluster_id}</h2>
          </div>
          <Badge variant="outline" className={riskClass}>{hotspot.risk_level} risk</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Reports" value={hotspot.complaint_count.toString()} />
          <Metric label="Avg. risk" value={hotspot.risk_score.toFixed(2)} />
          <Metric label="Dominant" value={hotspot.dominant_category} />
          <Metric label="Pending" value={`${Math.round(hotspot.pending_ratio * 100)}%`} />
        </div>
        <p className="flex items-start gap-2 text-xs text-muted-foreground"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />{hotspot.center_lat.toFixed(4)}, {hotspot.center_lng.toFixed(4)}</p>
        <Button variant="outline" onClick={onInspect} className="w-full"><Crosshair className="mr-2 h-4 w-4" />Inspect nearby reports</Button>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-muted/60 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 truncate text-sm font-semibold">{value}</p></div>;
}
