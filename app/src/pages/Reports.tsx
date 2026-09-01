import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReportList } from '@/components/ReportList';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
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
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">My Reports</h1>

          {loading ? (
            <p className="text-center">Loading reports...</p>
          ) : (
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              defaultValue="all"
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <TabsList>
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
      </main>

      <Footer />
    </div>
  );
};

export default Reports;
