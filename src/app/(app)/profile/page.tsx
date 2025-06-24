import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { loggedInDriver } from "@/lib/mock-data";
import { TrendingUp, Route, ShieldCheck, Fuel } from "lucide-react";

export default function ProfilePage() {
  const { name, avatar, rank, points, trips, safetyScore, efficiency } = loggedInDriver;

  const stats = [
    { label: "Total de Pontos", value: points.toLocaleString(), icon: TrendingUp },
    { label: "Viagens Concluídas", value: trips, icon: Route },
    { label: "Pontuação de Segurança", value: `${safetyScore}%`, icon: ShieldCheck },
    { label: "Eficiência", value: `${efficiency}%`, icon: Fuel },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center space-y-4">
        <Avatar className="h-24 w-24 border-4 border-primary/50">
          <AvatarImage src={`https://placehold.co/96x96.png`} data-ai-hint="person portrait" alt={name} />
          <AvatarFallback className="text-3xl">{name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="text-center">
          <h2 className="font-headline text-2xl font-bold">{name}</h2>
          <p className="text-lg text-muted-foreground">Posição no Ranking: <span className="font-bold text-primary">#{rank}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
