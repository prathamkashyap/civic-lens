import { RotateCcw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ReportCategory, ReportStatus, PriorityLevel } from '@/types';

interface MapControlsProps {
  search: string;
  category: ReportCategory | 'ALL';
  priority: PriorityLevel | 'ALL';
  status: ReportStatus | 'ALL';
  dateRange: 'ALL' | '7' | '30' | '90';
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: ReportCategory | 'ALL') => void;
  onPriorityChange: (value: PriorityLevel | 'ALL') => void;
  onStatusChange: (value: ReportStatus | 'ALL') => void;
  onDateRangeChange: (value: 'ALL' | '7' | '30' | '90') => void;
  onReset: () => void;
}

const selectClassName = 'h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring';

export function MapControls({
  search,
  category,
  priority,
  status,
  dateRange,
  onSearchChange,
  onCategoryChange,
  onPriorityChange,
  onStatusChange,
  onDateRangeChange,
  onReset,
}: MapControlsProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/80 p-3 shadow-sm backdrop-blur-xl xl:flex-row xl:items-center">
      <div className="relative min-w-0 flex-1 xl:min-w-56">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search reports or locations"
          className="h-10 pl-9"
          aria-label="Search map reports"
        />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:flex xl:flex-1">
        <select value={category} onChange={(event) => onCategoryChange(event.target.value as ReportCategory | 'ALL')} className={selectClassName} aria-label="Filter by category">
          <option value="ALL">All categories</option>
          <option value="Waste">Waste</option>
          <option value="Pothole">Pothole</option>
          <option value="Streetlight">Streetlight</option>
          <option value="Drainage">Drainage</option>
          <option value="Water Supply">Water supply</option>
        </select>
        <select value={priority} onChange={(event) => onPriorityChange(event.target.value as PriorityLevel | 'ALL')} className={selectClassName} aria-label="Filter by priority">
          <option value="ALL">All priorities</option>
          <option value="HIGH">High priority</option>
          <option value="MEDIUM">Medium priority</option>
          <option value="LOW">Low priority</option>
        </select>
        <select value={status} onChange={(event) => onStatusChange(event.target.value as ReportStatus | 'ALL')} className={selectClassName} aria-label="Filter by status">
          <option value="ALL">All statuses</option>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <select value={dateRange} onChange={(event) => onDateRangeChange(event.target.value as 'ALL' | '7' | '30' | '90')} className={selectClassName} aria-label="Filter by date">
          <option value="ALL">Any time</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>
      <Button type="button" variant="ghost" onClick={onReset} className="h-10 justify-center xl:w-auto" title="Clear map filters">
        <RotateCcw className="mr-2 h-4 w-4" />
        Reset
      </Button>
    </div>
  );
}
