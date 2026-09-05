import { Circle } from 'lucide-react';

export function MapLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-border/70 bg-card/90 px-3 py-2 text-xs text-muted-foreground shadow-sm backdrop-blur-md">
      <span className="font-semibold text-foreground">Map key</span>
      <span className="inline-flex items-center gap-1.5"><Circle className="h-3 w-3 fill-sky-500 text-sky-500" /> Report</span>
      <span className="inline-flex items-center gap-1.5"><Circle className="h-3 w-3 fill-red-500 text-red-500" /> High priority</span>
      <span className="inline-flex items-center gap-1.5"><Circle className="h-3 w-3 fill-amber-400 text-amber-500" /> Hotspot</span>
      <span className="inline-flex items-center gap-1.5"><Circle className="h-3 w-3 fill-emerald-500 text-emerald-500" /> Resolved</span>
    </div>
  );
}
