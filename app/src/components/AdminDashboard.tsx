import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  XCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { Report } from '@/types';
import { ReportList } from '@/components/ReportList';
import { MapView } from '@/components/MapView';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

import AnalyticsDashboard from './AnalyticsDashboard';

interface AdminDashboardProps {
  reports: Report[];
}

export function AdminDashboard({ reports }: AdminDashboardProps) {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const totalReports = reports.length;
  const pendingReports = reports.filter((r) => r.status === 'Pending').length;
  const completedReports = reports.filter((r) => r.status === 'Completed').length;
  const cancelledReports = reports.filter((r) => r.status === 'Cancelled').length;

  const calculatePercentage = (value: number) => {
    return totalReports > 0 ? Math.round((value / totalReports) * 100) : 0;
  };

  const reportsByCategory = reports.reduce(
    (acc, report) => {
      const { category } = report;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(report);
      return acc;
    },
    {} as Record<string, Report[]>
  );

  const categoryData = Object.entries(reportsByCategory).map(([category, items]) => ({
    category,
    count: items.length,
    percentage: calculatePercentage(items.length),
  }));

  const recentReports = [...reports]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);


  const downloadCSV = () => {
    const headers = ["ID", "Category", "Status", "Latitude", "Longitude"];

    const rows = reports.map((r) => [
      r.id || "",
      r.category || "",
      r.status || "",
      r.location?.lat || "",
      r.location?.lng || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "urban_civic_reports.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className="space-y-6">

      {/* ----------------------------------------------------
          📥 DOWNLOAD CSV BUTTON (INSERTED HERE)
      ---------------------------------------------------- */}
      <div className="flex justify-end">
        <button
          onClick={downloadCSV}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md shadow-md"
        >
          Download CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Reports"
          value={totalReports}
          trend={{ value: 12, direction: 'up' }}
        />
        <StatCard
          title="Pending"
          value={pendingReports}
          iconColor="text-urban-warning"
          icon={<Clock className="h-4 w-4" />}
          trend={{ value: 5, direction: 'up' }}
        />
        <StatCard
          title="Completed"
          value={completedReports}
          iconColor="text-urban-info"
          icon={<CheckCircle className="h-4 w-4" />}
          trend={{ value: 8, direction: 'up' }}
        />
        <StatCard
          title="Cancelled"
          value={cancelledReports}
          iconColor="text-urban-success"
          icon={<XCircle className="h-4 w-4" />}
          trend={{ value: 3, direction: 'up' }}
        />
      </div>

      <Tabs defaultValue="map" className="space-y-4">
        <TabsList>
          <TabsTrigger value="map">Map View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="space-y-4">
          <MapView
            reports={reports}
            selectedReport={selectedReport}
            onReportSelect={setSelectedReport}
          />
          {selectedReport && (
            <div className="bg-muted/40 p-3 rounded-md animate-fade-in">
              <h3 className="font-medium">
                {selectedReport.category} Issue at {selectedReport.location.address}
              </h3>
              <div className="text-sm text-muted-foreground mt-1">
                Status: {selectedReport.status} | Reported:{' '}
                {format(new Date(selectedReport.timestamp), 'PP')}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="list">
          <ReportList reports={reports} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-5">
          <AnalyticsDashboard reports={reports} />
        </TabsContent>

      </Tabs>
    </div>
  );
}


// --------------------------------------------
// Stat Card Component
// --------------------------------------------
interface StatCardProps {
  title: string;
  value: number;
  iconColor?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
}

function StatCard({ title, value, iconColor, icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h2 className="text-3xl font-bold mt-2">{value}</h2>
          </div>
          {icon && (
            <div className={`p-2 rounded-full bg-muted/60 ${iconColor}`}>
              {icon}
            </div>
          )}
        </div>
        {trend && (
          <div className="mt-4 flex items-center text-xs">
            {trend.direction === 'up' ? (
              <ChevronUp className="h-3 w-3 text-urban-success mr-1" />
            ) : (
              <ChevronDown className="h-3 w-3 text-urban-danger mr-1" />
            )}
            <span className={trend.direction === 'up' ? 'text-urban-success' : 'text-urban-danger'}>
              {trend.value}%
            </span>
            <span className="text-muted-foreground ml-1">from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
