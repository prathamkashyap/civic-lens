import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, Layers3, MapPinned } from 'lucide-react';

import { db } from '@/firebaseConfig';
import MainLayout from '@/layouts/MainLayout';
import ReportMap from '@/components/ReportMap';
import { HotspotPreviewCard } from '@/components/map/HotspotPreviewCard';
import { MapControls } from '@/components/map/MapControls';
import { MapLegend } from '@/components/map/MapLegend';
import { MapPreviewCard } from '@/components/map/MapPreviewCard';
import { Button } from '@/components/ui/button';
import { Report, ReportCategory, ReportStatus, PriorityLevel } from '@/types';
import { HotspotSummary } from '@/types/map';

const CATEGORY_VALUES: ReportCategory[] = ['Waste', 'Pothole', 'Streetlight', 'Drainage', 'Water Supply'];
const PRIORITY_VALUES: PriorityLevel[] = ['LOW', 'MEDIUM', 'HIGH'];

const normalizeCategory = (value: unknown): ReportCategory => CATEGORY_VALUES.includes(value as ReportCategory) ? value as ReportCategory : 'Waste';
const normalizeStatus = (value: unknown): ReportStatus => value === 'Completed' || value === 'Fixed' || value === 'Resolved' ? 'Completed' : value === 'Cancelled' ? 'Cancelled' : 'Pending';
const normalizePriority = (value: unknown): PriorityLevel => {
  const normalized = String(value || '').toUpperCase() as PriorityLevel;
  return PRIORITY_VALUES.includes(normalized) ? normalized : 'LOW';
};

export default function ReportMapView() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [hotspots, setHotspots] = useState<HotspotSummary[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<HotspotSummary | null>(null);
  const [hotspotScope, setHotspotScope] = useState<HotspotSummary | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ReportCategory | 'ALL'>('ALL');
  const [priority, setPriority] = useState<PriorityLevel | 'ALL'>('ALL');
  const [status, setStatus] = useState<ReportStatus | 'ALL'>('ALL');
  const [dateRange, setDateRange] = useState<'ALL' | '7' | '30' | '90'>('ALL');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const loadMapData = async () => {
      try {
        const [snapshot, hotspotResponse] = await Promise.all([
          getDocs(collection(db, 'reports')),
          fetch('/hotspot_summary.json'),
        ]);

        const mappedReports: Report[] = snapshot.docs.map((doc) => {
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
              address: data.location?.address || data.address || '',
            },
            photo: data.photoUrl || data.photo || '',
            description: data.description || '',
            status: normalizeStatus(data.status),
            address: data.address || '',
            timestamp: data.timestamp?.toDate?.() || new Date(data.timestamp || Date.now()),
            updatedAt: data.updatedAt?.toDate?.() || null,
            assignedTo: data.assignedTo || '',
          };
        });

        const mappedHotspots = hotspotResponse.ok ? await hotspotResponse.json() as HotspotSummary[] : [];
        setReports(mappedReports);
        setHotspots(mappedHotspots.filter((hotspot) => Number.isFinite(hotspot.center_lat) && Number.isFinite(hotspot.center_lng)));
        if (id) setSelectedReport(mappedReports.find((report) => report.id === id) || null);
      } catch (error) {
        console.error('Error loading map data:', error);
        setLoadError('Map data could not be loaded. Try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    loadMapData();
  }, [id]);

  const cutoff = dateRange === 'ALL' ? null : Date.now() - Number(dateRange) * 24 * 60 * 60 * 1000;
  const normalizedSearch = search.trim().toLowerCase();
  const filteredReports = reports.filter((report) => {
    const location = report.location.address || report.address || '';
    const matchesSearch = !normalizedSearch || `${report.category} ${report.description} ${location}`.toLowerCase().includes(normalizedSearch);
    const matchesCategory = category === 'ALL' || report.category === category;
    const matchesPriority = priority === 'ALL' || report.priority === priority;
    const matchesStatus = status === 'ALL' || report.status === status;
    const matchesDate = !cutoff || new Date(report.timestamp).getTime() >= cutoff;
    const isInHotspotScope = !hotspotScope || Math.hypot(
      report.location.lat - hotspotScope.center_lat,
      report.location.lng - hotspotScope.center_lng,
    ) <= 0.002;
    return matchesSearch && matchesCategory && matchesPriority && matchesStatus && matchesDate && isInHotspotScope && report.location.lat !== 0 && report.location.lng !== 0;
  });

  const resetFilters = () => {
    setSearch('');
    setCategory('ALL');
    setPriority('ALL');
    setStatus('ALL');
    setDateRange('ALL');
    setSelectedReport(null);
    setSelectedHotspot(null);
    setHotspotScope(null);
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-[1600px] space-y-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Spatial intelligence</p>
            <h1 className="text-4xl font-bold tracking-tight">Civic issues map</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">Explore live report locations alongside exported DBSCAN hotspot analysis.</p>
          </div>
          <Button asChild variant="outline"><Link to="/report"><MapPinned className="mr-2 h-4 w-4" />Add report</Link></Button>
        </div>

        <MapControls
          search={search}
          category={category}
          priority={priority}
          status={status}
          dateRange={dateRange}
          onSearchChange={setSearch}
          onCategoryChange={setCategory}
          onPriorityChange={setPriority}
          onStatusChange={setStatus}
          onDateRangeChange={setDateRange}
          onReset={resetFilters}
        />

        {loadError && <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{loadError}</div>}
        {loading ? (
          <div className="flex min-h-[32rem] items-center justify-center rounded-2xl border border-border/70 bg-card/70 text-muted-foreground">Loading civic map data...</div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <section className="relative h-[min(70vh,48rem)] min-h-[32rem] overflow-hidden rounded-2xl border border-border/70 bg-muted/30 shadow-sm">
              <ReportMap
                reports={filteredReports}
                hotspots={hotspots}
                selectedReport={selectedReport}
                selectedHotspot={selectedHotspot}
                onReportSelect={(report) => { setSelectedReport(report); setSelectedHotspot(null); }}
                onHotspotSelect={(hotspot) => { setSelectedHotspot(hotspot); setSelectedReport(null); }}
              />
              <div className="absolute bottom-4 left-4 right-4 z-[400] flex items-end justify-between gap-3">
                <MapLegend />
                <div className="hidden rounded-lg border border-border/70 bg-card/90 px-3 py-2 text-xs text-muted-foreground shadow-sm backdrop-blur-md sm:block">
                  {filteredReports.length} visible reports · {hotspots.filter((hotspot) => hotspot.cluster_id !== -1).length} hotspots
                </div>
              </div>
            </section>

            <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
              {selectedReport ? (
                <MapPreviewCard report={selectedReport} onView={() => navigate(`/reports/${selectedReport.id}`)} />
              ) : selectedHotspot ? (
                <HotspotPreviewCard hotspot={selectedHotspot} onInspect={() => setHotspotScope(selectedHotspot)} />
              ) : (
                <div className="rounded-2xl border border-border/70 bg-card/75 p-5 shadow-sm backdrop-blur-xl">
                  <div className="flex items-start gap-3">
                    <Layers3 className="mt-1 h-5 w-5 text-primary" />
                    <div>
                      <h2 className="font-semibold">Map intelligence</h2>
                      <p className="mt-1 text-sm text-muted-foreground">Select a report marker or hotspot to inspect its details here.</p>
                    </div>
                  </div>
                  <div className="mt-5 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Visible layer</p>
                    <p className="text-2xl font-bold text-primary">{filteredReports.length}</p>
                    <p className="text-sm text-muted-foreground">reports match the current filters</p>
                  </div>
                  {hotspots.filter((hotspot) => hotspot.cluster_id !== -1).slice(0, 3).map((hotspot) => (
                    <button key={hotspot.cluster_id} type="button" onClick={() => setSelectedHotspot(hotspot)} className="mt-4 flex w-full items-center justify-between rounded-lg bg-muted/60 p-3 text-left transition-colors hover:bg-muted">
                      <span><span className="block text-sm font-medium">Cluster {hotspot.cluster_id}</span><span className="text-xs text-muted-foreground">{hotspot.complaint_count} reports · {hotspot.dominant_category}</span></span>
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    </button>
                  ))}
                </div>
              )}
            </aside>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
