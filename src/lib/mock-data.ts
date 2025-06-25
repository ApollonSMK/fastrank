
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
};

export type Driver = {
  id: number;
  name: string;
  avatar: string;
  rank: number;
  points: number;
  trips: number;
  safetyScore: number;
  efficiency: number;
  teamId?: number;
  licensePlate: string;
  vehicleModel: string;
  driverLoginId: string;
  password?: string;
  dailyDeliveries: DailyDelivery[];
  achievementIds: string[];
  notifications: Notification[];
};

export type Team = {
  id: number;
  name: string;
};

export type RankHistory = {
  month: string;
  rank: number;
};

export const achievements: Achievements = {
  'delivery-50': { name: 'Entrega Rápida', description: 'Complete 50 entregas no total.', icon: 'Rocket' },
  'delivery-150': { name: 'Mestre das Entregas', description: 'Complete 150 entregas no total.', icon: 'Award' },
  'safety-champ': { name: 'Campeão da Segurança', description: 'Mantenha uma pontuação de segurança de 98% ou mais.', icon: 'ShieldCheck' },
  'top-3': { name: 'Top 3', description: 'Fique no top 3 do ranking.', icon: 'Trophy' },
  'consistent-performer': { name: 'Desempenho Consistente', description: 'Registe entregas por 5 dias seguidos.', icon: 'CalendarDays' },
};

// Helper to generate dates
const d = (day: number) => `2024-06-${25 - day}`;

export const drivers: Driver[] = [
  { id: 1, name: "Ana Silva", avatar: "/avatars/01.png", rank: 1, points: 158, trips: 158, safetyScore: 98, efficiency: 95, teamId: 1, licensePlate: "AA-11-BB", vehicleModel: "Renault Clio", driverLoginId: "ana.silva", password: "password123", dailyDeliveries: [ { date: d(6), deliveries: 20 }, { date: d(5), deliveries: 25 }, { date: d(4), deliveries: 22 }, { date: d(3), deliveries: 30 }, { date: d(2), deliveries: 28 }, { date: d(1), deliveries: 33 } ], achievementIds: ['delivery-150', 'safety-champ', 'top-3', 'consistent-performer'], notifications: [] },
  { id: 2, name: "Bruno Costa", avatar: "/avatars/02.png", rank: 2, points: 155, trips: 155, safetyScore: 97, efficiency: 94, teamId: 1, licensePlate: "CC-22-DD", vehicleModel: "Peugeot 208", driverLoginId: "bruno.costa", password: "password123", dailyDeliveries: [ { date: d(6), deliveries: 22 }, { date: d(5), deliveries: 24 }, { date: d(4), deliveries: 21 }, { date: d(3), deliveries: 28 }, { date: d(2), deliveries: 30 }, { date: d(1), deliveries: 30 } ], achievementIds: ['delivery-150', 'top-3', 'consistent-performer'], notifications: [] },
  { id: 3, name: "Carlos Souza", avatar: "/avatars/03.png", rank: 3, points: 150, trips: 150, safetyScore: 99, efficiency: 92, teamId: 2, licensePlate: "EE-33-FF", vehicleModel: "Fiat 500", driverLoginId: "carlos.souza", password: "password123", dailyDeliveries: [ { date: d(6), deliveries: 18 }, { date: d(5), deliveries: 22 }, { date: d(4), deliveries: 25 }, { date: d(3), deliveries: 27 }, { date: d(2), deliveries: 29 }, { date: d(1), deliveries: 29 } ], achievementIds: ['delivery-150', 'safety-champ', 'top-3'], notifications: [] },
  { id: 4, name: "Daniela Lima", avatar: "/avatars/04.png", rank: 4, points: 148, trips: 148, safetyScore: 95, efficiency: 96, teamId: 3, licensePlate: "GG-44-HH", vehicleModel: "VW Polo", driverLoginId: "daniela.lima", password: "password123", dailyDeliveries: [ { date: d(6), deliveries: 25 }, { date: d(5), deliveries: 21 }, { date: d(4), deliveries: 23 }, { date: d(3), deliveries: 26 }, { date: d(2), deliveries: 25 }, { date: d(1), deliveries: 28 } ], achievementIds: ['delivery-50', 'consistent-performer'], notifications: [
      { id: 1, title: 'Bem-vinda, Daniela!', description: 'O seu relatório semanal está pronto.', read: true, date: '2024-06-24T10:00:00Z' },
      { id: 2, title: 'Nova Conquista!', description: 'Parabéns, alcançou "Desempenho Consistente"!', read: false, date: '2024-06-25T09:00:00Z' }
  ] },
  { id: 5, name: "Eduardo Rocha", avatar: "/avatars/05.png", rank: 5, points: 142, trips: 142, safetyScore: 96, efficiency: 93, teamId: 3, licensePlate: "II-55-JJ", vehicleModel: "Seat Ibiza", driverLoginId: "eduardo.rocha", password: "password123", dailyDeliveries: [ { date: d(6), deliveries: 21 }, { date: d(5), deliveries: 20 }, { date: d(4), deliveries: 24 }, { date: d(3), deliveries: 25 }, { date: d(2), deliveries: 26 }, { date: d(1), deliveries: 26 } ], achievementIds: ['delivery-50'], notifications: [] },
  { id: 6, name: "Fernanda Dias", avatar: "/avatars/06.png", rank: 6, points: 139, trips: 139, safetyScore: 94, efficiency: 91, teamId: 4, licensePlate: "KK-66-LL", vehicleModel: "Toyota Yaris", driverLoginId: "fernanda.dias", password: "password123", dailyDeliveries: [ { date: d(6), deliveries: 19 }, { date: d(5), deliveries: 18 }, { date: d(4), deliveries: 22 }, { date: d(3), deliveries: 24 }, { date: d(2), deliveries: 27 }, { date: d(1), deliveries: 29 } ], achievementIds: ['delivery-50'], notifications: [] },
  { id: 7, name: "Gustavo Martins", avatar: "/avatars/07.png", rank: 7, points: 135, trips: 135, safetyScore: 93, efficiency: 90, teamId: 1, licensePlate: "MM-77-NN", vehicleModel: "Ford Fiesta", driverLoginId: "gustavo.martins", password: "password123", dailyDeliveries: [ { date: d(6), deliveries: 15 }, { date: d(5), deliveries: 19 }, { date: d(4), deliveries: 21 }, { date: d(3), deliveries: 23 }, { date: d(2), deliveries: 28 }, { date: d(1), deliveries: 29 } ], achievementIds: ['delivery-50'], notifications: [] },
  { id: 8, name: "Helena Santos", avatar: "/avatars/08.png", rank: 8, points: 131, trips: 131, safetyScore: 92, efficiency: 89, teamId: 2, licensePlate: "OO-88-PP", vehicleModel: "Opel Corsa", driverLoginId: "helena.santos", password: "password123", dailyDeliveries: [ { date: d(6), deliveries: 16 }, { date: d(5), deliveries: 17 }, { date: d(4), deliveries: 20 }, { date: d(3), deliveries: 22 }, { date: d(2), deliveries: 26 }, { date: d(1), deliveries: 30 } ], achievementIds: ['delivery-50'], notifications: [] },
  { id: 9, name: "Igor Almeida", avatar: "/avatars/09.png", rank: 9, points: 128, trips: 128, safetyScore: 91, efficiency: 88, teamId: 4, licensePlate: "QQ-99-RR", vehicleModel: "Hyundai i20", driverLoginId: "igor.almeida", password: "password123", dailyDeliveries: [ { date: d(6), deliveries: 14 }, { date: d(5), deliveries: 16 }, { date: d(4), deliveries: 19 }, { date: d(3), deliveries: 21 }, { date: d(2), deliveries: 28 }, { date: d(1), deliveries: 30 } ], achievementIds: [], notifications: [] },
  { id: 10, name: "Juliana Pereira", avatar: "/avatars/10.png", rank: 10, points: 125, trips: 125, safetyScore: 90, efficiency: 87, teamId: 1, licensePlate: "SS-00-TT", vehicleModel: "Skoda Fabia", driverLoginId: "juliana.pereira", password: "password123", dailyDeliveries: [ { date: d(6), deliveries: 12 }, { date: d(5), deliveries: 15 }, { date: d(4), deliveries: 18 }, { date: d(3), deliveries: 20 }, { date: d(2), deliveries: 28 }, { date: d(1), deliveries: 32 } ], achievementIds: [], notifications: [] },
];

export const teams: Team[] = [
  { id: 1, name: "Team Heliomar" },
  { id: 2, name: "Team Rui" },
  { id: 3, name: "Team Ivan Sushi Kirchberg" },
  { id: 4, name: "Sushi Villa" },
];

export const getLoggedInDriver = () => {
  if (typeof window !== 'undefined') {
    const loggedInDriverId = localStorage.getItem('loggedInDriverId');
    if (loggedInDriverId) {
        const driver = drivers.find(d => d.driverLoginId === loggedInDriverId);
        if (driver) return driver;
    }
  }
  // Fallback for SSR or if no user is logged in/found
  return drivers.find(d => d.driverLoginId === "daniela.lima");
};

export const rankingHistory: RankHistory[] = [
  { month: "Jan", rank: 8 },
  { month: "Feb", rank: 7 },
  { month: "Mar", rank: 7 },
  { month: "Apr", rank: 5 },
  { month: "May", rank: 6 },
  { month: "Jun", rank: 4 },
];
