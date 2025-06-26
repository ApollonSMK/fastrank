
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getLoggedInDriver, drivers as allDrivers, challenges as initialChallenges, Challenge, Driver } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Swords, PlusCircle, Check, X, Crown } from 'lucide-react';
import { format, formatDistanceToNowStrict, isWithinInterval, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const challengeFormSchema = z.object({
  opponentId: z.string().min(1, "É obrigatório selecionar um oponente."),
  metric: z.enum(['deliveries', 'safety', 'efficiency'], { required_error: "A métrica é obrigatória." }),
  duration: z.enum(['1', '3', '7'], { required_error: "A duração é obrigatória." }),
  wagerType: z.enum(['points', 'money'], { required_error: "O tipo de aposta é obrigatório." }),
  wagerAmount: z.coerce.number().min(1, "O valor da aposta deve ser no mínimo 1."),
});

type ChallengeFormValues = z.infer<typeof challengeFormSchema>;

const metricLabels = {
  deliveries: "Nº de Entregas",
  safety: "Pontuação de Segurança",
  efficiency: "Eficiência",
};

const ChallengeCard = ({ challenge, currentDriverId, onAction }: { challenge: Challenge, currentDriverId: number, onAction: (challengeId: number, action: 'accept' | 'decline') => void }) => {
    const challenger = allDrivers.find(d => d.id === challenge.challengerId);
    const opponent = allDrivers.find(d => d.id === challenge.opponentId);

    if (!challenger || !opponent) return null;

    const isCurrentUserOpponent = challenge.opponentId === currentDriverId;
    const isCompleted = challenge.status === 'completed';
    const winner = isCompleted ? allDrivers.find(d => d.id === challenge.winnerId) : null;

    const wagerLabel = challenge.wagerType === 'points' ? `${challenge.wagerAmount} pontos` : `€${challenge.wagerAmount.toFixed(2)}`;
    
    let durationLabel = '';
    if (challenge.status === 'active' || challenge.status === 'pending') {
        const endDate = parseISO(challenge.endDate);
        if (endDate > new Date()) {
            durationLabel = `Termina em ${formatDistanceToNowStrict(endDate, { locale: pt, addSuffix: false })}`;
        } else {
            durationLabel = 'A finalizar...';
        }
    }

    const getStatusInfo = (): { text: string; color: string } => {        
        switch (challenge.status) {
            case 'pending': return { text: 'Pendente', color: 'bg-yellow-500' };
            case 'active': return { text: 'Ativo', color: 'bg-green-500' };
            case 'completed': return { text: 'Terminado', color: 'bg-blue-500' };
            case 'declined': return { text: 'Recusado', color: 'bg-red-500' };
            default: return { text: 'Desconhecido', color: 'bg-muted-foreground' };
        }
    };
    const statusInfo = getStatusInfo();


    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                    <span>Desafio {statusInfo.text}</span>
                    <Badge variant="outline" className="flex items-center gap-2">
                         <span className={cn("h-2 w-2 rounded-full", statusInfo.color)}></span>
                         {metricLabels[challenge.metric]}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-around text-center">
                    <div className="relative flex flex-col items-center gap-2">
                        {winner?.id === challenger.id && <Crown className="absolute -top-4 h-6 w-6 text-yellow-400" />}
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={`https://placehold.co/64x64.png`} data-ai-hint="person portrait" alt={challenger.name} />
                            <AvatarFallback>{challenger.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-semibold">{challenger.name}</span>
                    </div>
                    <div className="text-2xl font-bold text-primary">VS</div>
                     <div className="relative flex flex-col items-center gap-2">
                        {winner?.id === opponent.id && <Crown className="absolute -top-4 h-6 w-6 text-yellow-400" />}
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={`https://placehold.co/64x64.png`} data-ai-hint="person portrait" alt={opponent.name} />
                            <AvatarFallback>{opponent.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-semibold">{opponent.name}</span>
                    </div>
                </div>
                 <div className="text-center space-y-2">
                    <p>Aposta: <span className="font-bold text-primary">{wagerLabel}</span></p>
                    {durationLabel && <p className="text-sm font-bold text-muted-foreground">{durationLabel}</p>}
                    {isCompleted && winner && <p className="font-bold text-lg">Vencedor: <span className="text-primary">{winner.name}</span></p>}
                    {isCompleted && !winner && <p className="font-bold text-lg text-muted-foreground">Empate!</p>}

                 </div>
                {challenge.status === 'pending' && isCurrentUserOpponent && (
                    <div className="flex justify-center gap-4 pt-2">
                        <Button onClick={() => onAction(challenge.id, 'accept')}><Check className="mr-2"/> Aceitar</Button>
                        <Button variant="destructive" onClick={() => onAction(challenge.id, 'decline')}><X className="mr-2"/> Recusar</Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}


export default function ChallengesPage() {
    const [loggedInDriver, setLoggedInDriver] = useState<Driver | undefined>(undefined);
    const [challenges, setChallenges] = useState<Challenge[]>(initialChallenges);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    useEffect(() => {
        const driver = getLoggedInDriver();
        setLoggedInDriver(driver);
        
        if (driver) {
            resolveCompletedChallenges();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const resolveCompletedChallenges = () => {
        const now = new Date();
        let challengesUpdated = false;

        const updatedChallenges = initialChallenges.map(c => {
            if (c.status === 'active' && parseISO(c.endDate) < now) {
                challengesUpdated = true;
                const challenger = allDrivers.find(d => d.id === c.challengerId);
                const opponent = allDrivers.find(d => d.id === c.opponentId);

                if (!challenger || !opponent) return c; // Skip if drivers not found

                const getScore = (driver: Driver) => {
                    const challengeInterval = { start: parseISO(c.startDate), end: parseISO(c.endDate) };
                    switch (c.metric) {
                        case 'deliveries':
                            return driver.dailyDeliveries
                                .filter(d => isWithinInterval(parseISO(d.date), challengeInterval))
                                .reduce((sum, delivery) => sum + delivery.deliveries, 0);
                        case 'safety': return driver.safetyScore;
                        case 'efficiency': return driver.efficiency;
                        default: return 0;
                    }
                };

                const challengerScore = getScore(challenger);
                const opponentScore = getScore(opponent);

                let winner: Driver | null = null;
                let loser: Driver | null = null;

                if (challengerScore > opponentScore) {
                    winner = challenger;
                    loser = opponent;
                } else if (opponentScore > challengerScore) {
                    winner = opponent;
                    loser = challenger;
                }

                if (winner && loser) {
                    if (c.wagerType === 'points') {
                        winner.points += c.wagerAmount;
                        loser.points -= c.wagerAmount;
                    } else { // money
                        winner.moneyBalance += c.wagerAmount;
                        loser.moneyBalance -= c.wagerAmount;
                    }

                    winner.notifications.unshift({
                        id: Date.now() + winner.id,
                        title: `Desafio Vencido!`,
                        description: `Ganhou o desafio contra ${loser.name} e recebeu ${c.wagerAmount} ${c.wagerType === 'points' ? 'pontos' : '€'}.`,
                        read: false, date: new Date().toISOString(), link: '/challenges'
                    });
                     loser.notifications.unshift({
                        id: Date.now() + loser.id,
                        title: `Desafio Perdido`,
                        description: `Perdeu o desafio contra ${winner.name}.`,
                        read: false, date: new Date().toISOString(), link: '/challenges'
                    });

                    return { ...c, status: 'completed', winnerId: winner.id };
                } else {
                    // It's a draw
                    challenger.notifications.unshift({
                         id: Date.now() + challenger.id,
                         title: `Desafio Empatado`,
                         description: `O seu desafio contra ${opponent.name} terminou em empate.`,
                         read: false, date: new Date().toISOString(), link: '/challenges'
                    });
                    opponent.notifications.unshift({
                         id: Date.now() + opponent.id,
                         title: `Desafio Empatado`,
                         description: `O seu desafio contra ${challenger.name} terminou em empate.`,
                         read: false, date: new Date().toISOString(), link: '/challenges'
                    });
                    return { ...c, status: 'completed', winnerId: null };
                }
            }
            return c;
        });

        if (challengesUpdated) {
            setChallenges([...updatedChallenges]);
        }
    };


    const form = useForm<ChallengeFormValues>({
        resolver: zodResolver(challengeFormSchema),
        defaultValues: {
            wagerType: 'points',
            wagerAmount: 10,
        }
    });

    const onSubmit: SubmitHandler<ChallengeFormValues> = (values) => {
        if (!loggedInDriver) return;

        const opponent = allDrivers.find(d => d.id === parseInt(values.opponentId, 10));
        if (!opponent) return;

        const newChallenge: Challenge = {
            id: challenges.length + 1,
            challengerId: loggedInDriver.id,
            opponentId: opponent.id,
            metric: values.metric,
            wagerType: values.wagerType,
            wagerAmount: values.wagerAmount,
            startDate: new Date().toISOString(),
            endDate: new Date(new Date().getTime() + parseInt(values.duration) * 24 * 60 * 60 * 1000).toISOString(),
            status: 'pending',
        };

        initialChallenges.push(newChallenge);
        setChallenges([...initialChallenges]);

        opponent.notifications.unshift({
            id: Date.now(),
            title: "Novo Desafio!",
            description: `${loggedInDriver.name} desafiou-te!`,
            read: false,
            date: new Date().toISOString(),
            link: '/challenges'
        });

        form.reset();
        setIsCreateDialogOpen(false);
    };

    const handleChallengeAction = (challengeId: number, action: 'accept' | 'decline') => {
        const challengeIndex = initialChallenges.findIndex(c => c.id === challengeId);
        if (challengeIndex === -1 || !loggedInDriver) return;

        const challenge = initialChallenges[challengeIndex];
        const challenger = allDrivers.find(d => d.id === challenge.challengerId);
        
        if (!challenger) return;
        
        challenge.status = action === 'accept' ? 'active' : 'declined';
        
        if(action === 'accept') {
            challenge.startDate = new Date().toISOString(); // Reset start date on accept
            challenge.endDate = new Date(new Date().getTime() + (parseISO(challenge.endDate).getTime() - parseISO(challenge.startDate).getTime())).toISOString();
        }
        
        challenger.notifications.unshift({
            id: Date.now(),
            title: `Desafio ${action === 'accept' ? 'Aceite' : 'Recusado'}`,
            description: `${loggedInDriver.name} ${action === 'accept' ? 'aceitou' : 'recusou'} o teu desafio.`,
            read: false,
            date: new Date().toISOString(),
            link: '/challenges'
        });

        setChallenges([...initialChallenges]);
    }
    
    const { pending, active, history } = useMemo(() => {
        if (!loggedInDriver) return { pending: [], active: [], history: [] };

        const pending: Challenge[] = [];
        const active: Challenge[] = [];
        const history: Challenge[] = [];

        challenges.forEach(c => {
            if (c.challengerId === loggedInDriver.id || c.opponentId === loggedInDriver.id) {
                if (c.status === 'pending') pending.push(c);
                else if (c.status === 'active') active.push(c);
                else history.push(c);
            }
        });
        
        history.sort((a,b) => parseISO(b.endDate).getTime() - parseISO(a.endDate).getTime());

        return { pending, active, history };
    }, [challenges, loggedInDriver]);

    if (!loggedInDriver) {
        return <div>A carregar...</div>;
    }

    const availableOpponents = allDrivers.filter(d => d.id !== loggedInDriver.id);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <Swords className="h-8 w-8 text-primary" />
                    <h2 className="font-headline text-2xl font-bold text-glow">Desafios 1v1</h2>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2"/>
                            Criar Desafio
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Criar Novo Desafio</DialogTitle>
                            <DialogDescription>Desafie outro motorista para uma competição frente a frente.</DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                                <FormField control={form.control} name="opponentId" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Oponente</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Selecione um motorista" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {availableOpponents.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage/>
                                    </FormItem>
                                )}/>
                                 <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="metric" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Métrica</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="deliveries">Entregas</SelectItem>
                                                    <SelectItem value="safety">Segurança</SelectItem>
                                                    <SelectItem value="efficiency">Eficiência</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                     <FormField control={form.control} name="duration" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Duração</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="1">1 Dia</SelectItem>
                                                    <SelectItem value="3">3 Dias</SelectItem>
                                                    <SelectItem value="7">1 Semana</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                                <FormField control={form.control} name="wagerType" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo de Aposta</FormLabel>
                                        <FormControl>
                                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4 pt-2">
                                                <FormItem className="flex items-center space-x-2 space-y-0">
                                                    <FormControl><RadioGroupItem value="points" /></FormControl>
                                                    <FormLabel className="font-normal">Pontos</FormLabel>
                                                </FormItem>
                                                <FormItem className="flex items-center space-x-2 space-y-0">
                                                    <FormControl><RadioGroupItem value="money" /></FormControl>
                                                    <FormLabel className="font-normal">Dinheiro</FormLabel>
                                                </FormItem>
                                            </RadioGroup>
                                        </FormControl>
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="wagerAmount" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Valor da Aposta</FormLabel>
                                        <FormControl><Input type="number" placeholder="Ex: 10" {...field} /></FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}/>
                                <DialogFooter>
                                    <Button variant="outline" type="button" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
                                    <Button type="submit">Lançar Desafio</Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>
            
            <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="pending">Convites</TabsTrigger>
                    <TabsTrigger value="active">Ativos</TabsTrigger>
                    <TabsTrigger value="history">Histórico</TabsTrigger>
                </TabsList>
                <TabsContent value="pending" className="mt-6 space-y-4">
                    {pending.length > 0 ? (
                        pending.map(c => <ChallengeCard key={c.id} challenge={c} currentDriverId={loggedInDriver.id} onAction={handleChallengeAction}/>)
                    ) : <p className="text-center text-muted-foreground pt-4">Não tem convites pendentes.</p>}
                </TabsContent>
                <TabsContent value="active" className="mt-6 space-y-4">
                    {active.length > 0 ? (
                         active.map(c => <ChallengeCard key={c.id} challenge={c} currentDriverId={loggedInDriver.id} onAction={handleChallengeAction}/>)
                    ) : <p className="text-center text-muted-foreground pt-4">Não tem desafios ativos.</p>}
                </TabsContent>
                <TabsContent value="history" className="mt-6 space-y-4">
                    {history.length > 0 ? (
                        history.map(c => <ChallengeCard key={c.id} challenge={c} currentDriverId={loggedInDriver.id} onAction={handleChallengeAction}/>)
                    ) : <p className="text-center text-muted-foreground pt-4">Ainda não completou nenhum desafio.</p>}
                </TabsContent>
            </Tabs>
        </div>
    )
}
