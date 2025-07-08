
"use client";

import { useMemo, useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCompetition, getAllDrivers, getAllTeams, getLoggedInDriver, updateCompetition, updateDriver } from '@/lib/data-service';
import { Competition, Driver, Team } from '@/lib/data-types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Trophy, Award, Medal, ShieldCheck, Fuel, TrendingUp, Gift } from 'lucide-react';
import { isWithinInterval, parseISO, startOfDay } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";

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
    const competitionId = params.id as string;

    const [competition, setCompetition] = useState<Competition | null>(null);
    const [allDrivers, setAllDrivers] = useState<Driver[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isPayingOut, setIsPayingOut] = useState(false);
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        if (!competitionId) return;
        setIsLoading(true);
        const [compData, driversData, teamsData, loggedInDriver] = await Promise.all([
            getCompetition(competitionId),
            getAllDrivers(),
            getAllTeams(),
            getLoggedInDriver()
        ]);
        setCompetition(compData);
        setAllDrivers(driversData.filter(d => d.email !== 'info@fastrack.lu'));
        setTeams(teamsData);
        if (loggedInDriver && loggedInDriver.email === 'info@fastrack.lu') {
            setIsAdmin(true);
        }
        setIsLoading(false);
    }, [competitionId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const rankedDrivers = useMemo(() => {
        if (!competition || !competition.enrolledDriverIds) return [];

        const participatingDrivers = allDrivers.filter(driver =>
            competition.enrolledDriverIds?.includes(driver.id)
        );

        const driversWithScores = participatingDrivers.map(driver => {
            let score = 0;
            const competitionInterval = {
                start: startOfDay(parseISO(competition.startDate)),
                end: startOfDay(parseISO(competition.endDate))
            };

            switch (competition.metric) {
                case 'deliveries':
                    score = driver.dailyDeliveries
                        .filter(d => {
                            const deliveryDate = startOfDay(parseISO(d.date));
                            return isWithinInterval(deliveryDate, competitionInterval);
                        })
                        .reduce((sum, delivery) => sum + (delivery.deliveriesUber || 0) + (delivery.deliveriesWedely || 0) + (delivery.deliveriesSushishop || 0) + (delivery.deliveriesShipday || 0), 0);
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

    }, [competition, allDrivers]);
    
    const handlePayout = async () => {
        if (!competition || !rankedDrivers.length || !isAdmin || competition.isPaidOut) {
            return;
        }
        const winner = rankedDrivers[0];
        if (!winner) {
            toast({
                variant: "destructive",
                title: "Sem Vencedor",
                description: "Não há um vencedor claro para distribuir o prémio.",
            });
            return;
        }

        setIsPayingOut(true);
        try {
            const winnerUpdate: Partial<Driver> = {
                notifications: [
                    ...(winner.notifications || []),
                    {
                        id: Date.now(),
                        title: `Prémio Recebido!`,
                        description: `Ganhou a competição "${competition.name}" e recebeu ${competition.rewardAmount} ${competition.rewardType === 'points' ? 'pontos' : '€'}. Parabéns!`,
                        read: false,
                        date: new Date().toISOString(),
                        link: `/competitions/${competition.id}`
                    }
                ]
            };

            if (competition.rewardType === 'points') {
                winnerUpdate.points = (winner.points || 0) + competition.rewardAmount;
            } else {
                winnerUpdate.moneyBalance = (winner.moneyBalance || 0) + competition.rewardAmount;
            }

            await updateDriver(winner.id, winnerUpdate);
            await updateCompetition(competition.id, { isPaidOut: true });

            toast({
                title: "Prémio distribuído!",
                description: `${winner.name} recebeu o prémio da competição.`,
            });
            fetchData();
        } catch (error) {
            console.error("Error paying out prize:", error);
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Não foi possível distribuir o prémio.",
            });
        } finally {
            setIsPayingOut(false);
        }
    };
    
    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-48 mb-2" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-5 w-52 mt-2" />
                        <Skeleton className="h-5 w-60 mt-1" />
                    </CardHeader>
                </Card>
                <LeaderboardSkeleton />
            </div>
        );
    }

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
                                         <p className="text-xs text-muted-foreground">{competition.metric === 'deliveries' ? 'Entregas' : '%'}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })
                ) : (
                     <Card>
                        <CardContent className="p-10 text-center">
                            <p className="text-muted-foreground">Ainda não há dados para este leaderboard.</p>
                        </CardContent>
                    </Card>
                 )}
            </div>
            
            {isAdmin && new Date() > new Date(competition.endDate) && (
                <Card className="mt-6 border-amber-500/50">
                    <CardHeader>
                        <CardTitle>Ações de Administrador</CardTitle>
                        <CardDescription>Gerir o estado final desta competição.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {competition.isPaidOut ? (
                            <p className="text-muted-foreground">O prémio para esta competição já foi distribuído.</p>
                        ) : (
                            <div className="space-y-2">
                                <p>A competição terminou. Clique abaixo para distribuir o prémio ao vencedor.</p>
                                <Button onClick={handlePayout} disabled={isPayingOut || rankedDrivers.length === 0}>
                                    {isPayingOut ? 'A distribuir...' : `Distribuir Prémio para ${rankedDrivers[0]?.name || 'Vencedor'}`}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
