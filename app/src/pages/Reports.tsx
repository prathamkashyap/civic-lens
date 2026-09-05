import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ClipboardList, CircleCheck, Clock3, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReportList } from '@/components/ReportList';
import MainLayout from '@/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { PriorityLevel, Report, ReportCategory, ReportStatus } from '@/types';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { getAuth } from 'firebase/auth';

const CATEGORY_VALUES: ReportCategory[] = [
  'Waste',
  'Pothole',
  'Streetlight',
  'Drainage',
  'Water Supply',
];

const PRIORITY_VALUES: PriorityLevel[] = ['LOW', 'MEDIUM', 'HIGH'];

const normalizeCategory = (value: unknown): ReportCategory => {
  return CATEGORY_VALUES.includes(value as ReportCategory)
    ? (value as ReportCategory)
    : 'Waste';
};

const normalizeStatus = (value: unknown): ReportStatus => {
  if (value === 'Completed' || value === 'Fixed' || value === 'Resolved') return 'Completed';
  if (value === 'Cancelled') return 'Cancelled';
  return 'Pending';
};

const normalizePriority = (value: unknown): PriorityLevel => {
  const normalized = String(value || '').toUpperCase() as PriorityLevel;
  return PRIORITY_VALUES.includes(normalized) ? normalized : 'LOW';
};

const Reports = () => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.warn('User not logged in');
      setLoading(false);
      return;
    }

    // Query reports where userId matches current user
    const reportsRef = collection(db, 'reports');
    const q = query(reportsRef, where('userId', '==', currentUser.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const userReports = snapshot.docs.map((doc) => {
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
              address: data.location?.address || 'No address provided',
            },
            photo: data.photoUrl || data.photo || '',
            status: normalizeStatus(data.status),
            description: data.description || '',
            address: data.address || '',
            timestamp: data.timestamp?.toDate?.() || new Date(data.timestamp || Date.now()),
            updatedAt: data.updatedAt?.toDate?.() || null,
            assignedTo: data.assignedTo || '',
          };
        }) as Report[];

        setAllReports(userReports);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching user reports:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const reports = {
    all: allReports,
    pending: allReports.filter(report => report.status === 'Pending'),
    completed: allReports.filter(report => report.status === 'Completed'),
    cancelled: allReports.filter(report => report.status === 'Cancelled'),
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Community activity
            </p>
            <h1 className="text-4xl font-bold tracking-tight">My reports</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Follow every issue you have submitted, from the first location pin to resolution.
            </p>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link to="/report">
              <Plus className="mr-2 h-4 w-4" />
              Report an issue
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <ReportSummary icon={ClipboardList} label="All reports" value={reports.all.length} />
          <ReportSummary icon={Clock3} label="Awaiting action" value={reports.pending.length} tone="warning" />
          <ReportSummary icon={CircleCheck} label="Resolved" value={reports.completed.length} tone="success" />
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center rounded-2xl border border-border/70 bg-card/70">
            <p className="text-muted-foreground">Loading your reports...</p>
          </div>
        ) : (
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              defaultValue="all"
              className="space-y-6"
            >
              <div className="flex flex-col gap-4 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
                  <TabsTrigger value="all">
                    All Reports
                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                      {reports.all.length}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="pending">
                    Pending
                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                      {reports.pending.length}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="completed">
                    Completed
                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                      {reports.completed.length}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="cancelled">
                    Cancelled
                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                      {reports.cancelled.length}
                    </span>
                  </TabsTrigger>
                </TabsList>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{reports.all.length} total</span>
                  <ArrowRight className="h-4 w-4" />
                  <span>Sorted by priority</span>
                </p>
              </div>

              <TabsContent value="all">
                <ReportList reports={reports.all} />
              </TabsContent>

              <TabsContent value="pending">
                <ReportList reports={reports.pending} />
              </TabsContent>

              <TabsContent value="completed">
                <ReportList reports={reports.completed} />
              </TabsContent>

              <TabsContent value="cancelled">
                <ReportList reports={reports.cancelled} />
              </TabsContent>
            </Tabs>
            )}
      </div>
    </MainLayout>
  );
};

function ReportSummary({
  icon: Icon,
  label,
  value,
  tone = 'default',
}: {
  icon: typeof ClipboardList;
  label: string;
  value: number;
  tone?: 'default' | 'warning' | 'success';
}) {
  const toneClass = tone === 'warning'
    ? 'text-amber-500 dark:text-amber-400'
    : tone === 'success'
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-primary';

  return (
    <div className="rounded-2xl border border-border/70 bg-card/75 p-5 shadow-sm backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className={`h-4 w-4 ${toneClass}`} />
      </div>
      <p className={`mt-3 text-3xl font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}

export default Reports;
