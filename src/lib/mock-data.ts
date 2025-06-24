
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
};

export type Team = {
  id: number;
  name: string;
};

export type RankHistory = {
  month: string;
  rank: number;
};

export const drivers: Driver[] = [
  { id: 1, name: "Ana Silva", avatar: "/avatars/01.png", rank: 1, points: 4980, trips: 52, safetyScore: 98, efficiency: 95, teamId: 1, licensePlate: "AA-11-BB", vehicleModel: "Renault Clio", driverLoginId: "ana.silva", password: "password123" },
  { id: 2, name: "Bruno Costa", avatar: "/avatars/02.png", rank: 2, points: 4950, trips: 55, safetyScore: 97, efficiency: 94, teamId: 1, licensePlate: "CC-22-DD", vehicleModel: "Peugeot 208", driverLoginId: "bruno.costa", password: "password123" },
  { id: 3, name: "Carlos Souza", avatar: "/avatars/03.png", rank: 3, points: 4890, trips: 50, safetyScore: 99, efficiency: 92, teamId: 2, licensePlate: "EE-33-FF", vehicleModel: "Fiat 500", driverLoginId: "carlos.souza", password: "password123" },
  { id: 4, name: "Daniela Lima", avatar: "/avatars/04.png", rank: 4, points: 4850, trips: 51, safetyScore: 95, efficiency: 96, teamId: 3, licensePlate: "GG-44-HH", vehicleModel: "VW Polo", driverLoginId: "daniela.lima", password: "password123" },
  { id: 5, name: "Eduardo Rocha", avatar: "/avatars/05.png", rank: 5, points: 4820, trips: 48, safetyScore: 96, efficiency: 93, teamId: 3, licensePlate: "II-55-JJ", vehicleModel: "Seat Ibiza", driverLoginId: "eduardo.rocha", password: "password123" },
  { id: 6, name: "Fernanda Dias", avatar: "/avatars/06.png", rank: 6, points: 4790, trips: 53, safetyScore: 94, efficiency: 91, teamId: 4, licensePlate: "KK-66-LL", vehicleModel: "Toyota Yaris", driverLoginId: "fernanda.dias", password: "password123" },
  { id: 7, name: "Gustavo Martins", avatar: "/avatars/07.png", rank: 7, points: 4750, trips: 49, safetyScore: 93, efficiency: 90, teamId: 1, licensePlate: "MM-77-NN", vehicleModel: "Ford Fiesta", driverLoginId: "gustavo.martins", password: "password123" },
  { id: 8, name: "Helena Santos", avatar: "/avatars/08.png", rank: 8, points: 4710, trips: 47, safetyScore: 92, efficiency: 89, teamId: 2, licensePlate: "OO-88-PP", vehicleModel: "Opel Corsa", driverLoginId: "helena.santos", password: "password123" },
  { id: 9, name: "Igor Almeida", avatar: "/avatars/09.png", rank: 9, points: 4680, trips: 46, safetyScore: 91, efficiency: 88, teamId: 4, licensePlate: "QQ-99-RR", vehicleModel: "Hyundai i20", driverLoginId: "igor.almeida", password: "password123" },
  { id: 10, name: "Juliana Pereira", avatar: "/avatars/10.png", rank: 10, points: 4650, trips: 45, safetyScore: 90, efficiency: 87, teamId: 1, licensePlate: "SS-00-TT", vehicleModel: "Skoda Fabia", driverLoginId: "juliana.pereira", password: "password123" },
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

export const notifications = [
    {
        title: "Rank Up!",
        description: "You've climbed to rank #4. Keep it up!",
    },
    {
        title: "New Weekly Report",
        description: "Your performance summary is available.",
    },
    {
        title: "Safety Bonus Achieved",
        description: "Congratulations on your perfect safety score this month!",
    },
];
