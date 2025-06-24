import Link from 'next/link';
import { drivers } from '@/lib/mock-data';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Award, Medal } from 'lucide-react';

export default function DashboardPage() {
  const sortedDrivers = [...drivers].sort((a, b) => a.rank - b.rank);

  const getRankIndicator = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Award className="h-5 w-5 text-slate-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-orange-400" />;
    return <span className="text-sm font-bold text-muted-foreground">{rank}</span>;
  };

  return (
    <div className="space-y-4">
      <h2 className="font-headline text-2xl font-bold">Ranking de Motoristas</h2>
      <div className="space-y-3">
        {sortedDrivers.map((driver) => (
          <Link href={`/profile/${driver.id}`} key={driver.id} className="block cursor-pointer">
            <Card className="transition-transform duration-200 hover:scale-[1.02] hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-8 w-8 items-center justify-center font-bold">
                  {getRankIndicator(driver.rank)}
                </div>
                <Avatar>
                  <AvatarImage src={`https://placehold.co/40x40.png`} data-ai-hint="person portrait" alt={driver.name} />
                  <AvatarFallback>{driver.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">{driver.name}</p>
                  <p className="text-sm text-muted-foreground">{driver.points.toLocaleString()} pontos</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
