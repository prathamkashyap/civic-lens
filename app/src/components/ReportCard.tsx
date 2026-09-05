import { format } from 'date-fns';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Droplets,
  LampFloor,
  MapPin,
  Trash2,
  Waves,
  XCircle,
} from 'lucide-react';

import { Report, ReportCategory, ReportStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

interface ReportCardProps {
  report: Report;
  viewMode?: 'compact' | 'full';
  onClick?: () => void;
}

const getCategoryIcon = (category: ReportCategory) => {
  switch (category) {
    case 'Waste':
      return <Trash2 className="h-5 w-5" />;
    case 'Pothole':
      return <AlertCircle className="h-5 w-5" />;
    case 'Streetlight':
      return <LampFloor className="h-5 w-5" />;
    case 'Drainage':
      return <Waves className="h-5 w-5" />;
    case 'Water Supply':
      return <Droplets className="h-5 w-5" />;
    default:
      return <AlertCircle className="h-5 w-5" />;
  }
};

const getStatusBadge = (status: ReportStatus) => {
  switch (status) {
    case 'Pending':
      return (
        <Badge className="status-pending flex gap-1">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );
    case 'Completed':
      return (
        <Badge className="status-completed flex gap-1">
          <CheckCircle className="h-3 w-3" />
          Completed
        </Badge>
      );
    case 'Cancelled':
      return (
        <Badge className="flex gap-1 bg-red-600 text-white">
          <XCircle className="h-3 w-3" />
          Cancelled
        </Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
};

const getPriorityBadge = (priority: Report['priority']) => {
  const className =
    priority === 'HIGH'
      ? 'bg-red-600 text-white'
      : priority === 'MEDIUM'
        ? 'bg-amber-500 text-black'
        : 'bg-green-600 text-white';

  return <Badge className={className}>{priority}</Badge>;
};

const getFormattedDate = (value: Date | string | null | undefined): string => {
  if (!value) return 'Unknown';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown' : format(date, 'MMM d, yyyy');
};

export function ReportCard({ report, viewMode = 'full', onClick }: ReportCardProps) {
  const locationText =
    report.location?.address ||
    report.address ||
    `${report.location.lat.toFixed(4)}, ${report.location.lng.toFixed(4)}`;

  return (
    <Card
      className={`overflow-hidden transition-all duration-300 ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
      onClick={onClick}
      onKeyDown={(event) => {
        if (onClick && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onClick();
        }
      }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `Open ${report.category} report` : undefined}
    >
      <div className="flex flex-col sm:flex-row">
        {viewMode === 'full' && (
          <div className="relative min-h-[10rem] w-full bg-muted sm:w-1/3">
            <img
              src={report.photo || '/placeholder.svg'}
              alt={`${report.category} issue`}
              loading="lazy"
              className="h-full w-full object-cover"
            />
            <div className="absolute left-2 top-2">{getStatusBadge(report.status)}</div>
          </div>
        )}

        <div className="flex flex-1 flex-col">
          <CardHeader className="flex flex-row items-start justify-between gap-3 p-4">
            <div className="flex items-center space-x-2">
              <div className="rounded-full bg-muted/80 p-1">{getCategoryIcon(report.category)}</div>
              <div>
                <h4 className="text-base font-medium">{report.category} Issue</h4>
                <div className="mt-1 flex flex-wrap gap-2">
                  {viewMode === 'compact' && getStatusBadge(report.status)}
                  {getPriorityBadge(report.priority)}
                </div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">{getFormattedDate(report.timestamp)}</div>
          </CardHeader>

          <CardContent className="p-4 pt-0">
            {report.description && viewMode === 'full' && (
              <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                {report.description}
              </p>
            )}

            <div className="flex items-center text-xs text-muted-foreground">
              <MapPin className="mr-1 h-3 w-3" />
              <span className="truncate">{locationText}</span>
            </div>
          </CardContent>

          {viewMode === 'full' && (
            <CardFooter className="flex flex-wrap items-center justify-between gap-3 p-4 pt-0">
              <div className="text-xs text-muted-foreground">
                Updated: {getFormattedDate(report.updatedAt || report.timestamp)}
              </div>
            </CardFooter>
          )}
        </div>
      </div>
    </Card>
  );
}
