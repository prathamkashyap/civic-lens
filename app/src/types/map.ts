import { ReportCategory } from './index';

export interface HotspotSummary {
  cluster_id: number;
  complaint_count: number;
  avg_density_score: number;
  pending_ratio: number;
  dominant_category: ReportCategory | string;
  high_priority_ratio: number;
  center_lat: number;
  center_lng: number;
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | string;
}
