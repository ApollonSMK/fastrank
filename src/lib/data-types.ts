
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

export type Driver = {
  id: string; // Firestore ID
  name: string;
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
  driverLoginId: string;
  // password is not stored on the client type
  dailyDeliveries: DailyDelivery[];
  achievementIds: string[];
  notifications: Notification[];
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
  participants: 'all' | string[]; // 'all' or array of team IDs
  startDate: string; // ISO string
  endDate: string; // ISO string
  rewardType: 'points' | 'money';
  rewardAmount: number;
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
