export type Driver = {
  id: number;
  name: string;
  avatar: string;
  rank: number;
  points: number;
  trips: number;
  safetyScore: number;
  efficiency: number;
};

export type RankHistory = {
  month: string;
  rank: number;
};

export const drivers: Driver[] = [
  { id: 1, name: "Ana Silva", avatar: "/avatars/01.png", rank: 1, points: 4980, trips: 52, safetyScore: 98, efficiency: 95 },
  { id: 2, name: "Bruno Costa", avatar: "/avatars/02.png", rank: 2, points: 4950, trips: 55, safetyScore: 97, efficiency: 94 },
  { id: 3, name: "Carlos Souza", avatar: "/avatars/03.png", rank: 3, points: 4890, trips: 50, safetyScore: 99, efficiency: 92 },
  { id: 4, name: "Daniela Lima", avatar: "/avatars/04.png", rank: 4, points: 4850, trips: 51, safetyScore: 95, efficiency: 96 },
  { id: 5, name: "Eduardo Rocha", avatar: "/avatars/05.png", rank: 5, points: 4820, trips: 48, safetyScore: 96, efficiency: 93 },
  { id: 6, name: "Fernanda Dias", avatar: "/avatars/06.png", rank: 6, points: 4790, trips: 53, safetyScore: 94, efficiency: 91 },
  { id: 7, name: "Gustavo Martins", avatar: "/avatars/07.png", rank: 7, points: 4750, trips: 49, safetyScore: 93, efficiency: 90 },
  { id: 8, name: "Helena Santos", avatar: "/avatars/08.png", rank: 8, points: 4710, trips: 47, safetyScore: 92, efficiency: 89 },
  { id: 9, name: "Igor Almeida", avatar: "/avatars/09.png", rank: 9, points: 4680, trips: 46, safetyScore: 91, efficiency: 88 },
  { id: 10, name: "Juliana Pereira", avatar: "/avatars/10.png", rank: 10, points: 4650, trips: 45, safetyScore: 90, efficiency: 87 },
];

export const loggedInDriver = drivers[3]; // Simulate Daniela Lima is logged in

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
