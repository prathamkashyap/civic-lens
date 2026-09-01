export type ReportStatus = 'Pending' | 'Completed' | 'Cancelled';

export type ReportCategory =
  | 'Waste'
  | 'Pothole'
  | 'Streetlight'
  | 'Drainage'
  | 'Water Supply';

export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Report {
  id: string;
  userId: string;
  userEmail: string;

  category: ReportCategory;
  priority: PriorityLevel;

  location: {
    lat: number;
    lng: number;
    address?: string;
  };

  photo: string;
  description?: string;

  status: ReportStatus;

  address?: string;

  timestamp: Date;
  updatedAt?: Date | null;
  assignedTo?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}
