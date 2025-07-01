
export type DailyDelivery = {
  date: string;
  deliveries: number;
};

export type Achievement = {
  name: string;
  description: string;
  icon: string; 
};

export type Achievements = {
  [key: string]: Achievement;
};

export type Notification = {
  id: number;
  title: string;
  description: string;
  read: boolean;
  date: string;
  link?: string;
};

export type Challenge = {
  id: string; // Firestore ID
  challengerId: string;
  opponentId: string;
  metric: 'deliveries' | 'safety' | 'efficiency';
  wagerType: 'points' | 'money';
  wagerAmount: number;
  startDate: string; // ISO
  endDate: string; // ISO
  status: 'pending' | 'active' | 'declined' | 'completed';
  winnerId?: string | null;
};

export type VehicleHistoryEntry = {
  licensePlate: string;
  vehicleModel: string;
  assignedDate: string; // ISO
  unassignedDate: string | null; // ISO
};

export type SubstituteVehicle = {
  licensePlate: string;
  vehicleModel: string;
};

export type Driver = {
  id: string; // Firestore ID
  authUid: string | null; // Firebase Auth User ID
  name: string;
  email: string;
  avatar: string;
  rank: number;
  points: number;
  moneyBalance: number;
  trips: number;
  safetyScore: number;
  efficiency: number;
  teamId?: string;
  licensePlate: string;
  vehicleModel: string;
  // password is not stored on the client type
  dailyDeliveries: DailyDelivery[];
  achievementIds: string[];
  notifications: Notification[];
  licensePlateHistory: VehicleHistoryEntry[];
  substituteVehicle?: SubstituteVehicle | null;
  lastDailyRewardClaimed?: string;
};

export type Team = {
  id: string; // Firestore ID
  name: string;
};

export type RankHistory = {
  id: string; // Firestore ID
  month: string;
  rank: number;
};

export type Competition = {
  id: string; // Firestore ID
  name: string;
  description: string;
  metric: 'deliveries' | 'safety' | 'efficiency';
  participants: 'all' | string[]; // 'all' or array of team IDs that are ALLOWED to enroll
  enrolledDriverIds?: string[]; // array of driver IDs that HAVE enrolled
  startDate: string; // ISO string
  endDate: string; // ISO string
  rewardType: 'points' | 'money';
  rewardAmount: number;
  enrollmentCost: number;
};

export type FleetChangeLog = {
  id: string; // Firestore ID
  date: string; // ISO
  driverId: string;
  driverName: string;
  changeDescription: string;
};


// This is static data, so we can keep it here.
export const achievements: Achievements = {
  'delivery-50': { name: 'Entrega Rápida', description: 'Complete 50 entregas no total.', icon: 'Rocket' },
  'delivery-150': { name: 'Mestre das Entregas', description: 'Complete 150 entregas no total.', icon: 'Award' },
  'safety-champ': { name: 'Campeão da Segurança', description: 'Mantenha uma pontuação de segurança de 98% ou mais.', icon: 'ShieldCheck' },
  'top-3': { name: 'Top 3', description: 'Fique no top 3 do ranking.', icon: 'Trophy' },
  'consistent-performer': { name: 'Desempenho Consistente', description: 'Registe entregas por 5 dias seguidos.', icon: 'CalendarDays' },
  'money-winner': { name: 'Prémio Monetário', description: 'Ganhe uma competição com prémio em dinheiro.', icon: 'Landmark' },
};

    
