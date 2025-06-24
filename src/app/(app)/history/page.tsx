import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import RankingHistoryChart from "@/components/RankingHistoryChart";

export default function HistoryPage() {
  return (
    <div className="space-y-4">
      <h2 className="font-headline text-2xl font-bold">Histórico de Ranking</h2>
      <Card>
        <CardHeader>
          <CardTitle>Sua Evolução</CardTitle>
          <CardDescription>Veja sua posição no ranking nos últimos 6 meses.</CardDescription>
        </CardHeader>
        <CardContent>
          <RankingHistoryChart />
        </CardContent>
      </Card>
    </div>
  );
}
