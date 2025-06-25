
"use client";

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { competitions as initialCompetitions, drivers as initialDrivers, teams } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Trophy, Award, Medal, ShieldCheck, Fuel, TrendingUp, Gift } from 'lucide-react';
import { isWithinInterval, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const metricInfo = {
  deliveries: { label: "Total de Entregas", icon: TrendingUp },
  safety: { label: "Pontuação de Segurança", icon: ShieldCheck },
  efficiency: { label: "Eficiência", icon: Fuel },
};

const getRankIndicator = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.7)]" />;
    if (rank === 2) return <Award className="h-6 w-6 text-slate-300 drop-shadow-[0_0_5px_rgba(203,213,225,0.7)]" />;
    if (rank === 3) return <Medal className="h-6 w-6 text-orange-400 drop-shadow-[0_0_5px_rgba(251,146,60,0.7)]" />;
    return <span className="text-lg font-bold text-muted-foreground">{rank}</span>;
};

const LeaderboardSkeleton = () => (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <Card key={i}>
          <CardContent className="flex animate-pulse items-center gap-4 p-4">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2 rounded" />
              <Skeleton className="h-3 w-1/4 rounded" />
            </div>
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
);

export default function CompetitionLeaderboardPage() {
    const router = useRouter();
    const params = useParams();
    const competitionId = Number(params.id);

    const competition = useMemo(() => initialCompetitions.find(c => c.id === competitionId), [competitionId]);

    const rankedDrivers = useMemo(() => {
        if (!competition) return [];

        const participatingDrivers = competition.participants === 'all'
            ? initialDrivers
            : initialDrivers.filter(driver => driver.teamId && competition.participants.includes(driver.teamId));

        const driversWithScores = participatingDrivers.map(driver => {
            let score = 0;
            const competitionInterval = {
                start: parseISO(competition.startDate),
                end: parseISO(competition.endDate)
            };

            switch (competition.metric) {
                case 'deliveries':
                    score = driver.dailyDeliveries
                        .filter(d => {
                            const deliveryDate = parseISO(d.date + 'T00:00:00');
                            return isWithinInterval(deliveryDate, competitionInterval);
                        })
                        .reduce((sum, delivery) => sum + delivery.deliveries, 0);
                    break;
                case 'safety':
                    score = driver.safetyScore;
                    break;
                case 'efficiency':
                    score = driver.efficiency;
                    break;
            }
            return { ...driver, score };
        });

        return driversWithScores.sort((a, b) => b.score - a.score);

    }, [competition]);
    
    if (!competition) {
        return (
             <div className="space-y-4">
                <Button variant="ghost" onClick={() => router.back()} className="-ml-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                </Button>
                <Card>
                    <CardContent className="p-10 text-center">
                        <p className="text-muted-foreground">Competição não encontrada.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    const { label: metricLabel, icon: MetricIcon } = metricInfo[competition.metric];
    
    const rewardLabel = competition.rewardType === 'money'
        ? `€${competition.rewardAmount.toFixed(2)}`
        : `${competition.rewardAmount} Pontos`;

    return (
        <div className="space-y-6">
            <div>
                <Button variant="ghost" onClick={() => router.back()} className="-ml-4 mb-2">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para Competições
                </Button>
                <Card className="border-primary/20 shadow-lg shadow-primary/10">
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl text-primary">{competition.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 pt-2">
                            <MetricIcon className="h-5 w-5 text-primary" />
                            <span>Ranking por: {metricLabel}</span>
                        </CardDescription>
                         <CardDescription className="flex items-center gap-2 pt-1 text-base">
                            <Gift className="h-5 w-5 text-amber-400" />
                            <span>Prémio do 1º Lugar: <span className="font-bold text-amber-400">{rewardLabel}</span></span>
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>

            <div className="space-y-3">
                {rankedDrivers.length > 0 ? (
                    rankedDrivers.map((driver, index) => {
                        const rank = index + 1;
                        const team = teams.find(t => t.id === driver.teamId);
                        return (
                            <Card key={driver.id} className="transition-all duration-200 hover:border-primary/50 hover:shadow-md hover:shadow-primary/20">
                                <CardContent className="flex items-center gap-4 p-4">
                                    <div className="flex h-8 w-8 items-center justify-center font-bold">
                                        {getRankIndicator(rank)}
                                    </div>
                                    <Avatar>
                                        <AvatarImage src={`https://placehold.co/40x40.png`} data-ai-hint="person portrait" alt={driver.name} />
                                        <AvatarFallback>{driver.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="font-semibold">{driver.name}</p>
                                        <p className="text-sm text-muted-foreground">{team?.name || 'Sem Equipa'}</p>
                                    </div>
                                    <div className="text-right">
                                         <p className="text-lg font-bold text-primary">{driver.score.toLocaleString()}</p>
                                         <p className="text-xs text-muted-foreground">{competition.metric === 'safety' || competition.metric === 'efficiency' ? '%' : 'Entregas'}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })
                ) : <LeaderboardSkeleton /> }
                 {rankedDrivers.length === 0 && (
                     <Card>
                        <CardContent className="p-10 text-center">
                            <p className="text-muted-foreground">Ainda não há dados para este leaderboard.</p>
                        </CardContent>
                    </Card>
                 )}
            </div>
        </div>
    );
}
