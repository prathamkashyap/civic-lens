import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';

import { db } from '@/firebaseConfig';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import ReportMap from '@/components/ReportMap';
import { PriorityLevel, Report, ReportCategory, ReportStatus } from '@/types';

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

export default function ReportMapView() {
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    const fetchReports = async () => {
      const snapshot = await getDocs(collection(db, 'reports'));

      const data: Report[] = snapshot.docs.map((doc) => {
        const d = doc.data();

        return {
          id: doc.id,
          userId: d.userId || 'unknown',
          userEmail: d.userEmail || 'unknown',
          category: normalizeCategory(d.category),
          priority: normalizePriority(d.priority),
          location: {
            lat: d.location?.lat || 0,
            lng: d.location?.lng || 0,
            address: d.location?.address || d.address || '',
          },
          photo: d.photoUrl || d.photo || '',
          description: d.description || '',
          status: normalizeStatus(d.status),
          address: d.address || '',
          timestamp: d.timestamp?.toDate?.() || new Date(d.timestamp || Date.now()),
          updatedAt: d.updatedAt?.toDate?.() || null,
          assignedTo: d.assignedTo || '',
        };
      });

      setReports(data);
    };

    fetchReports();
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="container mx-auto flex-grow px-4 py-8">
        <h1 className="mb-4 text-2xl font-bold">Civic Issues Map</h1>
        <ReportMap reports={reports} />
      </main>

      <Footer />
    </div>
  );
}
