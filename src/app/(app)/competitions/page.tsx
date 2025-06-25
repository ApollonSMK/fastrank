
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { competitions as initialCompetitions, teams, Competition } from '@/lib/mock-data';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Swords, Calendar, Users, Trophy } from 'lucide-react';

export default function CompetitionsPage() {
    const [competitions, setCompetitions] = useState<Competition[]>(initialCompetitions);

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

    const getParticipantNames = (participants: 'all' | number[]) => {
        if (participants === 'all') {
            return 'Todas as Equipas';
        }
        return participants.map(id => teams.find(t => t.id === id)?.name).filter(Boolean).join(', ');
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Trophy className="h-8 w-8 text-primary" />
                <h2 className="font-headline text-2xl font-bold text-glow">Competições</h2>
            </div>

            {competitions.length > 0 ? (
                <div className="grid gap-6">
                    {competitions.map(comp => {
                        const { status, color } = getCompetitionStatus(comp);
                        return (
                            <Card key={comp.id} className="border-primary/20 shadow-lg shadow-primary/10 hover:border-primary/50 transition-all">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="font-headline text-xl text-primary">{comp.name}</CardTitle>
                                            <CardDescription className="mt-1">{comp.description}</CardDescription>
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
                                            <Swords className="h-4 w-4 text-primary" />
                                            <span className="font-semibold">Métrica:</span>
                                        </div>
                                        <span>{metricLabels[comp.metric]}</span>
                                    </div>
                                     <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Users className="h-4 w-4 text-primary" />
                                            <span className="font-semibold">Participantes:</span>
                                        </div>
                                        <span>{getParticipantNames(comp.participants)}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Calendar className="h-4 w-4 text-primary" />
                                            <span className="font-semibold">Período:</span>
                                        </div>
                                        <span>
                                            {format(new Date(comp.startDate), "dd/MM/yy")} - {format(new Date(comp.endDate), "dd/MM/yy")}
                                        </span>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full" disabled={status === 'Próxima'}>
                                        <Trophy className="mr-2 h-4 w-4" />
                                        Ver Leaderboard
                                    </Button>
                                </CardFooter>
                            </Card>
                        )
                    })}
                </div>
            ) : (
                <Card>
                    <CardContent className="p-10 text-center">
                        <p className="text-muted-foreground">De momento, não há competições ativas.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
