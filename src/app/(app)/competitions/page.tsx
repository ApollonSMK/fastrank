
"use client";

import { useMemo, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getAllCompetitions, getAllTeams } from '@/lib/data-service';
import { Competition, Team } from '@/lib/data-types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Swords, Calendar, Users, Trophy, Gift } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';


const CompetitionCard = ({ competition, teams }: { competition: Competition, teams: Team[] }) => {
    const getCompetitionStatus = (comp: Competition): { status: 'Ativa' | 'Próxima' | 'Terminada'; color: string } => {
        const now = new Date();
        const start = new Date(comp.startDate);
        const end = new Date(comp.endDate);
        if (now < start) return { status: 'Próxima', color: 'bg-blue-500' };
        if (now > end) return { status: 'Terminada', color: 'bg-muted-foreground' };
        return { status: 'Ativa', color: 'bg-primary' };
    };

    const metricLabels = {
        deliveries: "Total de Entregas",
        safety: "Pontuação de Segurança",
        efficiency: "Eficiência",
    };

    const getParticipantNames = (participants: 'all' | string[]) => {
        if (participants === 'all') {
            return 'Todas as Equipas';
        }
        return participants.map(id => teams.find(t => t.id === id)?.name).filter(Boolean).join(', ');
    };
    
    const { status, color } = getCompetitionStatus(competition);

    const rewardLabel = competition.rewardType === 'money'
        ? `€${competition.rewardAmount.toFixed(2)}`
        : `${competition.rewardAmount} Pontos`;

    return (
        <Card className="border-primary/20 shadow-lg shadow-primary/10 hover:border-primary/50 transition-all">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="font-headline text-xl text-primary">{competition.name}</CardTitle>
                        <CardDescription className="mt-1">{competition.description}</CardDescription>
                    </div>
                    <Badge variant="outline" className="flex items-center gap-2 shrink-0">
                        <span className={cn("h-2 w-2 rounded-full", color)}></span>
                        {status}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Trophy className="h-4 w-4 text-primary" />
                        <span className="font-semibold">Prémio:</span>
                    </div>
                    <span className="font-bold text-amber-400">{rewardLabel}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Swords className="h-4 w-4 text-primary" />
                        <span className="font-semibold">Métrica:</span>
                    </div>
                    <span>{metricLabels[competition.metric]}</span>
                </div>
                 <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="font-semibold">Participantes:</span>
                    </div>
                    <span>{getParticipantNames(competition.participants)}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="font-semibold">Período:</span>
                    </div>
                    <span>
                        {format(new Date(competition.startDate), "dd/MM/yy")} - {format(new Date(competition.endDate), "dd/MM/yy")}
                    </span>
                </div>
            </CardContent>
            <CardFooter>
                 <Link href={`/competitions/${competition.id}`} className={`w-full ${status === 'Próxima' ? 'pointer-events-none' : ''}`}>
                    <Button className="w-full" disabled={status === 'Próxima'}>
                        <Trophy className="mr-2 h-4 w-4" />
                        Ver Leaderboard
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    );
};

const CompetitionSkeleton = () => (
    <div className="grid gap-6">
        {[...Array(2)].map((_, i) => (
             <Card key={i} className="animate-pulse">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <Skeleton className="h-6 w-48 rounded" />
                            <Skeleton className="h-4 w-64 mt-2 rounded" />
                        </div>
                        <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-5 w-40 rounded" />
                    <Skeleton className="h-5 w-48 rounded" />
                    <Skeleton className="h-5 w-44 rounded" />
                    <Skeleton className="h-5 w-52 rounded" />
                </CardContent>
                <CardFooter>
                    <Skeleton className="h-10 w-full rounded-md" />
                </CardFooter>
            </Card>
        ))}
    </div>
);


export default function CompetitionsPage() {
    const [competitions, setCompetitions] = useState<Competition[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        const [compsData, teamsData] = await Promise.all([getAllCompetitions(), getAllTeams()]);
        setCompetitions(compsData);
        setTeams(teamsData);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const { onGoing, finished } = useMemo(() => {
        const now = new Date();
        const onGoingComps: Competition[] = [];
        const finishedComps: Competition[] = [];

        competitions.forEach(comp => {
            const end = new Date(comp.endDate);
            if (now > end) {
                finishedComps.push(comp);
            } else {
                onGoingComps.push(comp);
            }
        });

        onGoingComps.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        finishedComps.sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());

        return { onGoing: onGoingComps, finished: finishedComps };
    }, [competitions]);


    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Trophy className="h-8 w-8 text-primary" />
                <h2 className="font-headline text-2xl font-bold text-glow">Competições</h2>
            </div>
            
            <Tabs defaultValue="ongoing" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="ongoing">Em Andamento</TabsTrigger>
                    <TabsTrigger value="history">Histórico</TabsTrigger>
                </TabsList>
                <TabsContent value="ongoing" className="mt-6">
                    {isLoading ? <CompetitionSkeleton /> :
                     onGoing.length > 0 ? (
                        <div className="grid gap-6">
                            {onGoing.map(comp => <CompetitionCard key={comp.id} competition={comp} teams={teams} />)}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="p-10 text-center">
                                <p className="text-muted-foreground">De momento, não há competições ativas ou futuras.</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
                <TabsContent value="history" className="mt-6">
                    {isLoading ? <CompetitionSkeleton /> :
                     finished.length > 0 ? (
                        <div className="grid gap-6">
                            {finished.map(comp => <CompetitionCard key={comp.id} competition={comp} teams={teams} />)}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="p-10 text-center">
                                <p className="text-muted-foreground">Nenhuma competição foi finalizada ainda.</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
