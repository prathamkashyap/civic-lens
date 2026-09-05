import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  ExternalLink,
  MapPin,
  Calendar,
  CheckCircle,
  Loader,
  XCircle,
} from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { PriorityLevel, Report, ReportCategory, ReportStatus } from '@/types';
import { format } from 'date-fns';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebaseConfig';

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

const ReportDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchReport = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const docRef = doc(db, 'reports', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setReport({
            id: docSnap.id,
            userId: data.userId || 'unknown',
            userEmail: data.userEmail || 'unknown',
            category: normalizeCategory(data.category),
            priority: normalizePriority(data.priority),
            location: {
              lat: data.location?.lat || 0,
              lng: data.location?.lng || 0,
              address: data.location?.address || data.address || '',
            },
            photo: data.photoUrl || data.photo || '',
            description: data.description || '',
            status: normalizeStatus(data.status),
            address: data.address || '',
            timestamp: data.timestamp?.toDate?.() || new Date(data.timestamp || Date.now()),
            updatedAt: data.updatedAt?.toDate?.() || null,
            assignedTo: data.assignedTo || '',
          });
        } else {
          setReport(null);
        }
      } catch (err) {
        console.error('Error fetching report:', err);
        setReport(null);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Clock className="h-5 w-5 text-amber-500" />;
      case 'Completed':
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case 'Cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'status-pending';
      case 'Completed':
        return 'status-completed';
      case 'Cancelled':
        return 'bg-destructive/10 text-destructive border border-destructive/20';
      default:
        return '';
    }
  };

  return (
    <MainLayout>
      <main className="mx-auto max-w-6xl">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate('/reports')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Reports
        </Button>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center">
              <Loader className="mb-4 h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading report details...</p>
            </div>
          </div>
        ) : report ? (
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-col md:flex-row gap-6 mb-8">
              <div className="w-full md:w-1/2">
                <Card className="overflow-hidden">
                  <div className="relative aspect-video bg-muted">
                    <img
                      src={report.photo || '/placeholder.svg'}
                      alt={`${report.category} issue`}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </Card>
              </div>

              <div className="w-full md:w-1/2">
                <div className="mb-4">
                  <h1 className="text-3xl font-bold">{report.category} Issue</h1>
                  <div className="flex items-center mt-2">
                    <Badge className={`${getStatusClass(report.status)} flex items-center gap-1`}>
                      {getStatusIcon(report.status)}
                      <span>{report.status || 'Unknown'}</span>
                    </Badge>
                    <span className="text-sm text-muted-foreground ml-3">
                      Report #{report.id}
                    </span>
                  </div>
                </div>

                <Card className="mb-6 space-y-4 border-border/70 bg-card/75 p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">Submitted</div>
                      <div className="text-sm text-muted-foreground">
                        {report.timestamp
                          ? format(new Date(report.timestamp), 'PPP')
                          : 'Unknown'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">Location</div>
                      <div className="text-sm text-muted-foreground">
                        {report.location?.address || 'No address provided'}
                      </div>
                      {report.location?.lat && report.location?.lng && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Coordinates: {report.location.lat.toFixed(6)}, {report.location.lng.toFixed(6)}
                        </div>
                      )}
                    </div>
                  </div>

                  {report.assignedTo && (
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                        A
                      </div>
                      <div>
                        <div className="text-sm font-medium">Assigned To</div>
                        <div className="text-sm text-muted-foreground">
                          City Maintenance Team
                        </div>
                      </div>
                    </div>
                  )}
                </Card>

                {/* Updated View on Map button with query parameters */}
                {report.location?.lat && report.location?.lng && (
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() =>
                      navigate(
                        `/report/${report.id}/map?lat=${report.location.lat}&lng=${report.location.lng}&address=${encodeURIComponent(
                          report.location.address || ''
                        )}&category=${encodeURIComponent(report.category)}`
                      )
                    }
                  >
                    <ExternalLink className="h-4 w-4" />
                    View on Map
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-xl font-semibold">Description</h3>
                <Card className="border-border/70 bg-card/75 p-5 shadow-sm">
                  <p className="text-muted-foreground">
                    {report.description || 'No description provided.'}
                  </p>
                </Card>
              </div>

              <div>
                <h3 className="mb-2 text-xl font-semibold">Status updates</h3>
                <Card className="divide-y divide-border border-border/70 bg-card/75 shadow-sm">
                  <StatusUpdate
                    status="Submitted"
                    date={report.timestamp}
                    description="Report has been submitted successfully."
                  />

                  {report.status === 'Completed' && (
                    <StatusUpdate
                      status="Completed"
                      date={report.updatedAt || report.timestamp}
                      description="The issue has been marked as completed."
                    />
                  )}

                  {report.status === 'Cancelled' && (
                    <StatusUpdate
                      status="Cancelled"
                      date={report.updatedAt || report.timestamp}
                      description="The report has been cancelled or closed without action."
                    />
                  )}
                </Card>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-2">Report Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The report you're looking for doesn't exist or may have been removed.
            </p>
            <Button onClick={() => navigate('/reports')}>View All Reports</Button>
          </div>
        )}
      </main>
    </MainLayout>
  );
};

interface StatusUpdateProps {
  status: string;
  date: Date | string | null | undefined;
  description: string;
}

function StatusUpdate({ status, date, description }: StatusUpdateProps) {
  let formattedDate = 'Unknown';
  try {
    const d = date instanceof Date ? date : new Date(date);
    formattedDate = isNaN(d.getTime()) ? 'Unknown' : format(d, 'MMM d, yyyy');
  } catch {
    formattedDate = 'Unknown';
  }

  return (
    <div className="py-4 px-4">
      <div className="flex justify-between items-start mb-2">
        <span className="font-medium">{status}</span>
        <span className="text-xs text-muted-foreground">{formattedDate}</span>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export default ReportDetail;
