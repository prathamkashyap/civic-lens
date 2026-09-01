import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter } from 'lucide-react';
import { Report, ReportCategory, ReportStatus } from '@/types';
import { ReportCard } from '@/components/ReportCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS: ReportStatus[] = ['Pending', 'Completed', 'Cancelled'];
const CATEGORY_OPTIONS: ReportCategory[] = [
  'Waste',
  'Pothole',
  'Streetlight',
  'Drainage',
  'Water Supply',
];

interface ReportListProps {
  reports: Report[];
  viewMode?: 'compact' | 'full';
  className?: string;
}

export function ReportList({ reports, viewMode = 'full', className }: ReportListProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReportStatus[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<ReportCategory[]>([]);

  const handleReportClick = (reportId: string) => {
    navigate(`/reports/${reportId}`);
  };

  const handleStatusToggle = (status: ReportStatus) => {
    setStatusFilter(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const handleCategoryToggle = (category: ReportCategory) => {
    setCategoryFilter(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const search = searchTerm.toLowerCase();

  const priorityOrder = {
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };

  const sortedReports = [...reports].sort((a, b) => {
    const priorityDiff =
      (priorityOrder[b.priority] || 0) -
      (priorityOrder[a.priority] || 0);

    if (priorityDiff !== 0) return priorityDiff;

    return new Date(b.timestamp).getTime() -
          new Date(a.timestamp).getTime();
  });

  const filteredReports = sortedReports.filter(report => {
  const matchesSearch =
    search === '' ||
    (report.description || '').toLowerCase().includes(search) ||
    (report.address || report.location?.address || '').toLowerCase().includes(search) ||
    (report.category || '').toLowerCase().includes(search) ||
    (report.status || '').toLowerCase().includes(search);

  const matchesStatus =
    statusFilter.length === 0 ||
    (report.status && statusFilter.includes(report.status));

  const matchesCategory =
    categoryFilter.length === 0 ||
    categoryFilter.includes(report.category);

  return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Status</DropdownMenuLabel>
            {STATUS_OPTIONS.map(status => (
              <DropdownMenuCheckboxItem
                key={status}
                checked={statusFilter.includes(status)}
                onCheckedChange={() => handleStatusToggle(status)}
              >
                {status}
              </DropdownMenuCheckboxItem>
            ))}

            <DropdownMenuSeparator />

            <DropdownMenuLabel>Category</DropdownMenuLabel>
            {CATEGORY_OPTIONS.map(category => (
              <DropdownMenuCheckboxItem
                key={category}
                checked={categoryFilter.includes(category)}
                onCheckedChange={() => handleCategoryToggle(category)}
              >
                {category}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Display filtered results */}
      {filteredReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-1">No reports found</h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search or filter criteria
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredReports.map(report => (
            <ReportCard
              key={report.id}
              report={report}
              viewMode={viewMode}
              onClick={() => handleReportClick(report.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
