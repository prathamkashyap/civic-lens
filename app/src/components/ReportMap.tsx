import { Circle, CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Fragment, useEffect } from 'react';
import { Report } from '@/types';
import { HotspotSummary } from '@/types/map';

interface ReportMapProps {
  reports: Report[];
  hotspots: HotspotSummary[];
  selectedReport?: Report | null;
  selectedHotspot?: HotspotSummary | null;
  onReportSelect: (report: Report) => void;
  onHotspotSelect: (hotspot: HotspotSummary) => void;
}

function ZoomToSelection({ report, hotspot }: { report?: Report | null; hotspot?: HotspotSummary | null }) {
  const map = useMap();

  useEffect(() => {
    if (report) {
      map.setView([report.location.lat, report.location.lng], 15, { animate: true });
    } else if (hotspot) {
      map.setView([hotspot.center_lat, hotspot.center_lng], 14, { animate: true });
    }
  }, [hotspot, map, report]);

  return null;
}

function FitMapBounds({ reports, hotspots }: { reports: Report[]; hotspots: HotspotSummary[] }) {
  const map = useMap();

  useEffect(() => {
    const points = [
      ...reports.map((report) => [report.location.lat, report.location.lng] as [number, number]),
      ...hotspots.map((hotspot) => [hotspot.center_lat, hotspot.center_lng] as [number, number]),
    ];

    if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points), { padding: [42, 42] });
    } else if (points.length === 1) {
      map.setView(points[0], 13);
    }
  }, [hotspots, map, reports]);

  return null;
}

function createReportIcon(priority: Report['priority'], status: Report['status']) {
  return L.divIcon({
    className: 'civic-map-marker',
    html: `<span class="civic-map-marker__dot civic-map-marker__dot--${priority.toLowerCase()} ${status === 'Completed' ? 'civic-map-marker__dot--resolved' : ''}"></span>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

export default function ReportMap({
  reports,
  hotspots,
  selectedReport,
  selectedHotspot,
  onReportSelect,
  onHotspotSelect,
}: ReportMapProps) {
  const center: [number, number] = reports.length
    ? [reports[0].location.lat, reports[0].location.lng]
    : [23.2599, 77.4125];

  return (
    <MapContainer center={center} zoom={12} scrollWheelZoom className="h-full min-h-[30rem] w-full">
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitMapBounds reports={reports} hotspots={hotspots} />
      <ZoomToSelection report={selectedReport} hotspot={selectedHotspot} />

      {hotspots.map((hotspot) => {
        if (hotspot.cluster_id === -1) return null;
        const riskColor = hotspot.risk_level === 'HIGH'
          ? '#ef4444'
          : hotspot.risk_level === 'MEDIUM'
            ? '#f59e0b'
            : '#0ea5e9';
        const radius = Math.max(80, Math.min(220, 80 + hotspot.risk_score * 140));

        return (
          <Fragment key={`hotspot-${hotspot.cluster_id}`}>
            <Circle
              center={[hotspot.center_lat, hotspot.center_lng]}
              radius={radius}
              pathOptions={{ color: riskColor, fillColor: riskColor, fillOpacity: 0.12, weight: 2 }}
              eventHandlers={{ click: () => onHotspotSelect(hotspot) }}
            />
            <CircleMarker
              center={[hotspot.center_lat, hotspot.center_lng]}
              radius={8}
              pathOptions={{ color: riskColor, fillColor: riskColor, fillOpacity: 0.85, weight: 2 }}
              eventHandlers={{ click: () => onHotspotSelect(hotspot) }}
            >
              <Popup>
                <strong>DBSCAN hotspot {hotspot.cluster_id}</strong>
                <br />
                {hotspot.complaint_count} reports · {hotspot.risk_level} risk
              </Popup>
            </CircleMarker>
          </Fragment>
        );
      })}

      {reports.map((report) => (
        <Marker
          key={report.id}
          position={[report.location.lat, report.location.lng]}
          icon={createReportIcon(report.priority, report.status)}
          eventHandlers={{ click: () => onReportSelect(report) }}
        >
          <Popup>
            <strong>{report.category} issue</strong>
            <br />
            {report.status} · {report.priority} priority
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
