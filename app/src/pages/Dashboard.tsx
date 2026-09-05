import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

import { db } from "@/firebaseConfig";
import { PriorityLevel, Report, ReportCategory, ReportStatus } from "@/types";

import { Button } from "@/components/ui/button";
import { AdminDashboard } from "@/components/AdminDashboard";

import MainLayout from "@/layouts/MainLayout";

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

const Dashboard = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "reports"),
      (snapshot) => {
        const fetchedReports: Report[] = snapshot.docs.map((doc) => {
          const data = doc.data();

          return {
            id: doc.id,

            userId: data.userId || "unknown",
            userEmail: data.userEmail || "unknown",

            category: normalizeCategory(data.category),

            location: {
              lat: data.location?.lat || 0,
              lng: data.location?.lng || 0,
              address:
                data.location?.address || "No address provided",
            },

            photo: data.photoUrl || data.photo || "",

            status: normalizeStatus(data.status),

            description: data.description || "",

            address: data.address || "",

            priority: normalizePriority(data.priority),

            timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp || Date.now()),

            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : null,

            assignedTo: data.assignedTo || "",
          };
        });

        setReports(fetchedReports);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="flex flex-col gap-6 rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur-xl md:flex-row md:items-center md:justify-between md:p-8">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Civic Intelligence Platform
            </p>

            <h1 className="text-4xl font-bold tracking-tight">
              Public Dashboard
            </h1>

            <p className="mt-3 max-w-2xl text-muted-foreground">
              Analyze, monitor, and manage urban civic issues using
              AI-powered insights, geospatial analytics, and real-time
              reporting.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => navigate("/map")}
              className="rounded-lg px-6 py-6 text-sm font-medium transition-all"
            >
              Open Map View
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate("/report")}
              className="rounded-lg px-6 py-6 text-sm font-medium"
            >
              Report an Issue
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-border/70 bg-card/75 p-6 shadow-sm backdrop-blur-xl">
            <p className="text-sm text-muted-foreground">Total Reports</p>

            <h2 className="mt-3 text-4xl font-bold text-foreground">
              {reports.length}
            </h2>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/75 p-6 shadow-sm backdrop-blur-xl">
            <p className="text-sm text-muted-foreground">Pending Issues</p>

            <h2 className="mt-3 text-4xl font-bold text-amber-500 dark:text-amber-400">
              {
                reports.filter(
                  (report) => report.status === "Pending"
                ).length
              }
            </h2>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/75 p-6 shadow-sm backdrop-blur-xl">
            <p className="text-sm text-muted-foreground">Completed Cases</p>

            <h2 className="mt-3 text-4xl font-bold text-emerald-600 dark:text-emerald-400">
              {
                reports.filter(
                  (report) => report.status === "Completed"
                ).length
              }
            </h2>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/75 p-6 shadow-sm backdrop-blur-xl">
            <p className="text-sm text-muted-foreground">High Priority</p>

            <h2 className="mt-3 text-4xl font-bold text-destructive">
              {
                reports.filter(
                  (report) =>
                    report.priority === "HIGH" ||
                    report.priority === "High"
                ).length
              }
            </h2>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="rounded-2xl border border-border/70 bg-card/75 p-4 shadow-sm backdrop-blur-xl md:p-6">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <p className="text-muted-foreground">
                Loading civic reports...
              </p>
            </div>
          ) : (
            <AdminDashboard reports={reports} />
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
