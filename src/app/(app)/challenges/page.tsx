
"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getLoggedInDriver, getAllDrivers, addChallenge, updateChallenge, getChallengesForDriver, getDriver, updateDriver } from '@/lib/data-service';
import { Challenge, Driver, achievements } from '@/lib/data-types';
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
import { formatDistanceToNowStrict, isWithinInterval, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

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

const resolveCompletedChallenges = async (currentChallenges: Challenge[], allDrivers: Driver[]): Promise<{ updated: boolean; challenges: Challenge[] }> => {
    const now = new Date();
    const challengesToUpdate = currentChallenges.filter(c => c.status === 'active' && parseISO(c.endDate) < now);

    if (challengesToUpdate.length === 0) {
        return { updated: false, challenges: currentChallenges };
    }

    const allDriversMap = new Map(allDrivers.map(d => [d.id, d]));
    const updatedChallenges = [...currentChallenges];
    const dbUpdatePromises: Promise<any>[] = [];

    for (const challenge of challengesToUpdate) {
        const challenger = allDriversMap.get(challenge.challengerId);
        const opponent = allDriversMap.get(challenge.opponentId);

        if (!challenger || !opponent || challenger.name === '[VEÍCULO LIVRE]' || opponent.name === '[VEÍCULO LIVRE]') {
            console.warn(`Skipping challenge ${challenge.id} due to missing or invalid participant.`);
            continue;
        }

        const getScore = (driver: Driver) => {
            const challengeInterval = { start: parseISO(challenge.startDate), end: parseISO(challenge.endDate) };
            switch (challenge.metric) {
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

        const challengeResult: Partial<Challenge> = { status: 'completed', winnerId: winner ? winner.id : null };

        const index = updatedChallenges.findIndex(c => c.id === challenge.id);
        if (index > -1) {
            updatedChallenges[index] = { ...updatedChallenges[index], ...challengeResult };
        }
        
        dbUpdatePromises.push(updateChallenge(challenge.id, challengeResult));

        if (winner && loser) {
            const winnerUpdate: Partial<Driver> = { notifications: [...(winner.notifications || [])] };
            const loserUpdate: Partial<Driver> = { notifications: [...(loser.notifications || [])] };

            if (challenge.wagerType === 'points') {
                winnerUpdate.points = (winner.points || 0) + challenge.wagerAmount;
                loserUpdate.points = (loser.points || 0) - challenge.wagerAmount;
            } else {
                winnerUpdate.moneyBalance = (winner.moneyBalance || 0) + challenge.wagerAmount;
                loserUpdate.moneyBalance = (loser.moneyBalance || 0) - challenge.wagerAmount;
            }

            winnerUpdate.notifications?.unshift({
                id: Date.now() + Math.random(), title: `Desafio Vencido!`,
                description: `Ganhou o desafio contra ${loser.name} e recebeu ${challenge.wagerAmount} ${challenge.wagerType === 'points' ? 'pontos' : '€'}.`,
                read: false, date: new Date().toISOString(), link: '/challenges'
            });
             loserUpdate.notifications?.unshift({
                id: Date.now() + Math.random(), title: `Desafio Perdido`,
                description: `Perdeu o desafio contra ${winner.name}.`,
                read: false, date: new Date().toISOString(), link: '/challenges'
            });

            dbUpdatePromises.push(updateDriver(winner.id, winnerUpdate));
            dbUpdatePromises.push(updateDriver(loser.id, loserUpdate));

        } else {
            const challengerUpdate: Partial<Driver> = { notifications: [...(challenger.notifications || [])] };
            const opponentUpdate: Partial<Driver> = { notifications: [...(opponent.notifications || [])] };

            challengerUpdate.notifications?.unshift({
                 id: Date.now() + Math.random(), title: `Desafio Empatado`,
                 description: `O seu desafio contra ${opponent.name} terminou em empate.`,
                 read: false, date: new Date().toISOString(), link: '/challenges'
            });
            opponentUpdate.notifications?.unshift({
                 id: Date.now() + Math.random(), title: `Desafio Empatado`,
                 description: `O seu desafio contra ${challenger.name} terminou em empate.`,
                 read: false, date: new Date().toISOString(), link: '/challenges'
            });
            
            dbUpdatePromises.push(updateDriver(challenger.id, challengerUpdate));
            dbUpdatePromises.push(updateDriver(opponent.id, opponentUpdate));
        }
    }

    await Promise.all(dbUpdatePromises);

    return { updated: true, challenges: updatedChallenges };
};


const ChallengeCard = ({ challenge, currentDriverId, allDrivers, onAction }: { challenge: Challenge, currentDriverId: string, allDrivers: Driver[], onAction: (challengeId: string, action: 'accept' | 'decline') => void }) => {
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

const ChallengeSkeleton = () => (
    <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
            <Card key={i}>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-6 w-24 rounded-full" />
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-around">
                        <div className="flex flex-col items-center gap-2">
                            <Skeleton className="h-16 w-16 rounded-full" />
                            <Skeleton className="h-5 w-20" />
                        </div>
                         <Skeleton className="h-6 w-10" />
                        <div className="flex flex-col items-center gap-2">
                            <Skeleton className="h-16 w-16 rounded-full" />
                            <Skeleton className="h-5 w-20" />
                        </div>
                    </div>
                    <div className="text-center space-y-2">
                        <Skeleton className="h-5 w-32 mx-auto" />
                        <Skeleton className="h-4 w-40 mx-auto" />
                    </div>
                </CardContent>
            </Card>
        ))}
    </div>
);


export default function ChallengesPage() {
    const [loggedInDriver, setLoggedInDriver] = useState<Driver | null>(null);
    const [allDrivers, setAllDrivers] = useState<Driver[]>([]);
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const driver = await getLoggedInDriver();
            
            if (!driver) {
                setLoggedInDriver(null);
                setIsLoading(false);
                return;
            };

            setLoggedInDriver(driver);
            
            const [allDriversData, challengesData] = await Promise.all([
                getAllDrivers(),
                getChallengesForDriver(driver.id)
            ]);

            const challengesToResolve = challengesData.filter(c => c.status === 'active' && parseISO(c.endDate) < new Date());
            
            if (challengesToResolve.length > 0) {
                 const { updated, challenges: resolvedChallenges } = await resolveCompletedChallenges(challengesData, allDriversData);
                 setChallenges(updated ? resolvedChallenges : challengesData);
            } else {
                 setChallenges(challengesData);
            }
           
            setAllDrivers(allDriversData.filter(d => d.name !== '[VEÍCULO LIVRE]'));

        } catch (error) {
            console.error("Erro ao buscar dados dos desafios:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const form = useForm<ChallengeFormValues>({
        resolver: zodResolver(challengeFormSchema),
        defaultValues: {
            wagerType: 'points',
            wagerAmount: 10,
        }
    });

    const onSubmit: SubmitHandler<ChallengeFormValues> = async (values) => {
        if (!loggedInDriver) return;

        const opponent = allDrivers.find(d => d.id === values.opponentId);
        if (!opponent) return;

        const newChallenge: Omit<Challenge, 'id'> = {
            challengerId: loggedInDriver.id,
            opponentId: opponent.id,
            metric: values.metric,
            wagerType: values.wagerType,
            wagerAmount: values.wagerAmount,
            startDate: new Date().toISOString(),
            endDate: new Date(new Date().getTime() + parseInt(values.duration) * 24 * 60 * 60 * 1000).toISOString(),
            status: 'pending',
        };

        await addChallenge(newChallenge);
        
        const opponentToUpdate = await getDriver(opponent.id);
        if(opponentToUpdate) {
            const newNotifications = [...(opponentToUpdate.notifications || [])];
            newNotifications.unshift({
                id: Date.now(), title: "Novo Desafio!",
                description: `${loggedInDriver.name} desafiou-te!`,
                read: false, date: new Date().toISOString(), link: '/challenges'
            });
            await updateDriver(opponent.id, { notifications: newNotifications });
        }
        
        form.reset();
        setIsCreateDialogOpen(false);
        fetchData();
    };

    const handleChallengeAction = async (challengeId: string, action: 'accept' | 'decline') => {
        if (!loggedInDriver) return;

        const challenge = challenges.find(c => c.id === challengeId);
        if(!challenge) return;
        
        const challenger = await getDriver(challenge.challengerId);
        if (!challenger) return;
        
        const updates: Partial<Challenge> = {
            status: action === 'accept' ? 'active' : 'declined'
        };

        if(action === 'accept') {
            const duration = parseISO(challenge.endDate).getTime() - parseISO(challenge.startDate).getTime();
            updates.startDate = new Date().toISOString();
            updates.endDate = new Date(new Date().getTime() + duration).toISOString();
        }
        
        await updateChallenge(challenge.id, updates);

        const newNotifications = [...(challenger.notifications || [])];
        newNotifications.unshift({
            id: Date.now(),
            title: `Desafio ${action === 'accept' ? 'Aceite' : 'Recusado'}`,
            description: `${loggedInDriver.name} ${action === 'accept' ? 'aceitou' : 'recusou'} o teu desafio.`,
            read: false, date: new Date().toISOString(), link: '/challenges'
        });
        await updateDriver(challenger.id, { notifications: newNotifications });

        fetchData();
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

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-10 w-36" />
                </div>
                <Tabs defaultValue="pending" className="w-full">
                     <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="pending">Convites</TabsTrigger>
                        <TabsTrigger value="active">Ativos</TabsTrigger>
                        <TabsTrigger value="history">Histórico</TabsTrigger>
                    </TabsList>
                    <TabsContent value="pending" className="mt-6">
                        <ChallengeSkeleton />
                    </TabsContent>
                </Tabs>
            </div>
        );
    }
    
    if (!loggedInDriver) {
         return (
             <div className="space-y-6 text-center">
                <p className="text-muted-foreground pt-10">Não foi possível carregar os seus dados. Por favor, tente fazer login novamente.</p>
             </div>
        );
    }

    const availableOpponents = allDrivers.filter(d => d.id !== loggedInDriver.id && d.name !== '[VEÍCULO LIVRE]');

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
                                                {availableOpponents.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
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
                        pending.map(c => <ChallengeCard key={c.id} challenge={c} currentDriverId={loggedInDriver.id} allDrivers={allDrivers} onAction={handleChallengeAction}/>)
                    ) : <p className="text-center text-muted-foreground pt-4">Não tem convites pendentes.</p>}
                </TabsContent>
                <TabsContent value="active" className="mt-6 space-y-4">
                    {active.length > 0 ? (
                         active.map(c => <ChallengeCard key={c.id} challenge={c} currentDriverId={loggedInDriver.id} allDrivers={allDrivers} onAction={handleChallengeAction}/>)
                    ) : <p className="text-center text-muted-foreground pt-4">Não tem desafios ativos.</p>}
                </TabsContent>
                <TabsContent value="history" className="mt-6 space-y-4">
                    {history.length > 0 ? (
                        history.map(c => <ChallengeCard key={c.id} challenge={c} currentDriverId={loggedInDriver.id} allDrivers={allDrivers} onAction={handleChallengeAction}/>)
                    ) : <p className="text-center text-muted-foreground pt-4">Ainda não completou nenhum desafio.</p>}
                </TabsContent>
            </Tabs>
        </div>
    )
}
