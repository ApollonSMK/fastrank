
"use client";

import { useMemo, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getAllCompetitions, getAllTeams, getLoggedInDriver, enrollInCompetition } from '@/lib/data-service';
import { Competition, Team, Driver } from '@/lib/data-types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Swords, Calendar, Users, Trophy, Gift, PlusCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";


const CompetitionCard = ({ competition, teams, loggedInDriver, onEnroll }: { competition: Competition, teams: Team[], loggedInDriver: Driver | null, onEnroll: () => void }) => {
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

    const isEnrollmentOpen = new Date() < new Date(competition.startDate);
    const isEnrolled = loggedInDriver ? competition.enrolledDriverIds?.includes(loggedInDriver.id) : false;

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
                        <span className="font-semibold">Equipas Elegíveis:</span>
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
                 {isEnrolled ? (
                    <Link href={`/competitions/${competition.id}`} className="w-full">
                        <Button className="w-full">
                            <Trophy className="mr-2 h-4 w-4" />
                            Ver Leaderboard
                        </Button>
                    </Link>
                ) : isEnrollmentOpen ? (
                    <Button className="w-full" onClick={onEnroll}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Inscrever-se
                    </Button>
                ) : (
                    <Button className="w-full" disabled>
                        {status === 'Ativa' ? 'Inscrições Encerradas' : 'Competição Terminada'}
                    </Button>
                )}
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
    const [loggedInDriver, setLoggedInDriver] = useState<Driver | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        const [compsData, teamsData, driverData] = await Promise.all([
            getAllCompetitions(), 
            getAllTeams(),
            getLoggedInDriver()
        ]);
        setCompetitions(compsData);
        setTeams(teamsData);
        setLoggedInDriver(driverData);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleEnroll = async (competitionId: string, competitionName: string) => {
        if (!loggedInDriver) return;
        try {
            await enrollInCompetition(competitionId, loggedInDriver.id);
            toast({
                title: "Inscrição com Sucesso!",
                description: `Está agora inscrito na competição "${competitionName}". Boa sorte!`,
            });
            fetchData();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro na Inscrição",
                description: "Não foi possível concluir a sua inscrição. Tente novamente.",
            });
            console.error("Enrollment failed:", error);
        }
    };

    const { onGoing, finished } = useMemo(() => {
        if (!loggedInDriver) return { onGoing: [], finished: [] };

        const eligibleCompetitions = competitions.filter(comp => {
            if (comp.participants === 'all') {
                return true;
            }
            if (Array.isArray(comp.participants) && loggedInDriver.teamId && comp.participants.includes(loggedInDriver.teamId)) {
                return true;
            }
            return false;
        });
        
        const now = new Date();
        const onGoingComps: Competition[] = [];
        const finishedComps: Competition[] = [];

        eligibleCompetitions.forEach(comp => {
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
    }, [competitions, loggedInDriver]);


    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Trophy className="h-8 w-8 text-primary" />
                <h2 className="font-headline text-2xl font-bold text-glow">Competições</h2>
            </div>
            
            <Tabs defaultValue="ongoing" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="ongoing">Em Andamento & Futuras</TabsTrigger>
                    <TabsTrigger value="history">Histórico</TabsTrigger>
                </TabsList>
                <TabsContent value="ongoing" className="mt-6">
                    {isLoading ? <CompetitionSkeleton /> :
                     onGoing.length > 0 ? (
                        <div className="grid gap-6">
                            {onGoing.map(comp => 
                                <CompetitionCard 
                                    key={comp.id} 
                                    competition={comp} 
                                    teams={teams} 
                                    loggedInDriver={loggedInDriver}
                                    onEnroll={() => handleEnroll(comp.id, comp.name)}
                                />
                            )}
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
                             {finished.map(comp => 
                                <CompetitionCard 
                                    key={comp.id} 
                                    competition={comp} 
                                    teams={teams} 
                                    loggedInDriver={loggedInDriver}
                                    onEnroll={() => handleEnroll(comp.id, comp.name)}
                                />
                            )}
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
