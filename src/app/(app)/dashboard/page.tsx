
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Driver, DailyDelivery, Team, achievements } from '@/lib/data-types';
import { getAllDrivers, getAllTeams, getDriver, updateDriver } from '@/lib/data-service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Award, Medal, TrendingUp, Route, ShieldCheck, Fuel, Calendar as CalendarIcon, PlusCircle, Trash2, Rocket, CalendarDays, Wallet, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { DateRange } from "react-day-picker";
import { addDays, format, isWithinInterval, startOfDay, parseISO } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip as UiTooltip, TooltipContent as UiTooltipContent, TooltipProvider, TooltipTrigger as UiTooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';


const chartConfig = {
  deliveries: {
    label: "Entregas",
    color: "hsl(var(--primary))",
  },
};

const deliveryFormSchema = z.object({
  date: z.date({ required_error: "A data é obrigatória." }),
  deliveriesUber: z.coerce.number().min(0, "O número de entregas não pode ser negativo.").default(0),
  deliveriesWedely: z.coerce.number().min(0, "O número de entregas não pode ser negativo.").default(0),
}).refine(data => data.deliveriesUber > 0 || data.deliveriesWedely > 0, {
  message: "Deve registar pelo menos uma entrega.",
  path: ["deliveriesUber"],
});
type DeliveryFormValues = z.infer<typeof deliveryFormSchema>;

const iconMap: { [key: string]: React.ElementType } = {
  Rocket,
  Award,
  ShieldCheck,
  Trophy,
  CalendarDays,
  Landmark: Wallet,
};

const DriverProfileContent = ({ driver, rank }: { driver: Driver, rank: number }) => {
  const { name, trips, safetyScore, efficiency, dailyDeliveries, achievementIds, points, moneyBalance } = driver;

  const [date, setDate] = React.useState<DateRange | undefined>();

  useEffect(() => {
    const today = new Date();
    setDate({
      from: addDays(today, -6),
      to: today,
    });
  }, []);

  const totalDeliveries = dailyDeliveries.reduce((sum, day) => sum + (day.deliveriesUber || 0) + (day.deliveriesWedely || 0), 0);

  const stats = [
    { label: "Total de Entregas", value: totalDeliveries.toLocaleString(), icon: TrendingUp },
    { label: "Viagens Concluídas", value: trips, icon: Route },
    { label: "Pontuação de Segurança", value: `${safetyScore}%`, icon: ShieldCheck },
    { label: "Eficiência", value: `${efficiency}%`, icon: Fuel },
  ];

  const chartData = React.useMemo(() => {
    if (!date?.from) return [];
    
    return dailyDeliveries
      .map(d => ({ ...d, dateObj: parseISO(d.date) }))
      .filter(d => {
          const from = date.from!;
          const to = date.to ?? from;
          return isWithinInterval(d.dateObj, { start: startOfDay(from), end: startOfDay(to) });
      })
      .map(d => ({
        date: d.dateObj.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }),
        deliveries: (d.deliveriesUber || 0) + (d.deliveriesWedely || 0),
      }));
  }, [dailyDeliveries, date]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center space-y-4 pt-4">
        <Avatar className="h-24 w-24 border-4 border-primary/50">
          <AvatarImage src={`https://placehold.co/96x96.png`} data-ai-hint="person portrait" alt={name} />
          <AvatarFallback className="text-3xl">{name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="text-center">
          <h2 className="font-headline text-2xl font-bold text-glow">{name}</h2>
          <p className="text-lg text-muted-foreground">Posição no Ranking: <span className="font-bold text-primary">#{rank}</span></p>
        </div>
      </div>
      
       <Card>
        <CardHeader className='pb-4'>
            <CardTitle>Conquistas</CardTitle>
        </CardHeader>
        <CardContent>
            <TooltipProvider>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-6">
                    {achievementIds.map(id => {
                    const achievement = achievements[id];
                    if (!achievement) return null;
                    const Icon = iconMap[achievement.icon];
                    return (
                        <UiTooltip key={id}>
                            <UiTooltipTrigger asChild>
                                <div className="flex flex-col items-center gap-2 w-16 text-center">
                                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-accent/10 border-2 border-accent text-accent-foreground shrink-0">
                                        <Icon className="h-6 w-6 text-accent drop-shadow-[0_0_5px_hsl(var(--accent))]" />
                                    </div>
                                    <span className="text-xs font-medium leading-tight">{achievement.name}</span>
                                </div>
                            </UiTooltipTrigger>
                            <UiTooltipContent>
                                <p>{achievement.description}</p>
                            </UiTooltipContent>
                        </UiTooltip>
                    );
                    })}
                </div>
                
            </TooltipProvider>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pontos</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{points}</div>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{moneyBalance.toFixed(2)}</div>
            </CardContent>
          </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="text-base">Entregas Diárias</CardTitle>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-full sm:w-[260px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "dd/MM/y")} - {format(date.to, "dd/MM/y")}
                      </>
                    ) : (
                      format(date.from, "dd/MM/y")
                    )
                  ) : (
                    <span>Escolha um período</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={1}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    content={<ChartTooltipContent 
                      formatter={(value) => `${value} entregas`}
                      indicator="line" 
                    />}
                  />
                  <Bar dataKey="deliveries" radius={4} fill="var(--color-deliveries)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};


function RankingSkeleton() {
  return (
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
            <Skeleton className="h-10 w-10" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}


export default function DashboardPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [sortedDrivers, setSortedDrivers] = useState<(Driver & { totalDeliveries: number })[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all');
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const [driversData, teamsData] = await Promise.all([getAllDrivers(), getAllTeams()]);
    setDrivers(driversData);
    setTeams(teamsData);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const activeDrivers = drivers.filter(d => d.name !== '[VEÍCULO LIVRE]' && d.email !== 'info@fastrack.lu');
    
    const teamFilteredDrivers =
      selectedTeamId === 'all'
        ? activeDrivers
        : activeDrivers.filter((driver) => driver.teamId === selectedTeamId);

    const driversWithDeliveries = teamFilteredDrivers.map((driver) => {
      const totalDeliveries = driver.dailyDeliveries
        .filter((delivery) => {
          if (!date?.from) {
            return true;
          }
          const deliveryDate = parseISO(delivery.date);
          
          const interval = {
            start: startOfDay(date.from),
            end: date.to ? startOfDay(date.to) : startOfDay(date.from),
          };
          return isWithinInterval(deliveryDate, interval);
        })
        .reduce((sum, d) => sum + (d.deliveriesUber || 0) + (d.deliveriesWedely || 0), 0);

      return {
        ...driver,
        totalDeliveries,
      };
    });

    setSortedDrivers(driversWithDeliveries.sort((a, b) => b.totalDeliveries - a.totalDeliveries));
  }, [drivers, selectedTeamId, date]);

  const [isDeliveriesDialogOpen, setIsDeliveriesDialogOpen] = useState(false);
  const [selectedDriverForDeliveries, setSelectedDriverForDeliveries] = useState<Driver | null>(null);

  const deliveryForm = useForm<DeliveryFormValues>({
    resolver: zodResolver(deliveryFormSchema),
    defaultValues: {
      date: new Date(),
      deliveriesUber: 0,
      deliveriesWedely: 0,
    },
  });

  const handleAddDelivery: SubmitHandler<DeliveryFormValues> = async (data) => {
    if (!selectedDriverForDeliveries) return;

    const driverToUpdate = await getDriver(selectedDriverForDeliveries.id);
    if (!driverToUpdate) return;
    
    const totalDeliveriesToday = data.deliveriesUber + data.deliveriesWedely;
    
    const newDelivery: DailyDelivery = {
      date: format(data.date, 'yyyy-MM-dd'),
      deliveriesUber: data.deliveriesUber,
      deliveriesWedely: data.deliveriesWedely,
    };

    const existingDates = new Set(driverToUpdate.dailyDeliveries.map(d => d.date));
    if (existingDates.has(newDelivery.date)) {
        deliveryForm.setError("date", { type: "manual", message: "Já existe um registo para esta data." });
        return;
    }

    const updatedDeliveries = [...driverToUpdate.dailyDeliveries, newDelivery].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const newNotifications = [...driverToUpdate.notifications];
    newNotifications.unshift({
        id: Date.now(),
        title: "Entregas Atualizadas",
        description: `O seu registo de ${totalDeliveriesToday} entregas para ${format(data.date, 'dd/MM/yyyy')} foi adicionado.`,
        read: false,
        date: new Date().toISOString(),
    });

    const totalDeliveries = updatedDeliveries.reduce((sum, d) => sum + (d.deliveriesUber || 0) + (d.deliveriesWedely || 0), 0);
    const newAchievementIds = [...driverToUpdate.achievementIds];

    if (totalDeliveries >= 150 && !newAchievementIds.includes('delivery-150')) {
        newAchievementIds.push('delivery-150');
        newNotifications.unshift({
            id: Date.now() + 1,
            title: "Nova Conquista!",
            description: `Parabéns! Desbloqueou: "${achievements['delivery-150'].name}"`,
            read: false,
            date: new Date().toISOString()
        });
    } else if (totalDeliveries >= 50 && !newAchievementIds.includes('delivery-50')) {
        newAchievementIds.push('delivery-50');
        newNotifications.unshift({
            id: Date.now() + 1,
            title: "Nova Conquista!",
            description: `Parabéns! Desbloqueou: "${achievements['delivery-50'].name}"`,
            read: false,
            date: new Date().toISOString()
        });
    }
    
    const updates: Partial<Driver> = { 
        dailyDeliveries: updatedDeliveries,
        achievementIds: newAchievementIds,
    };
    
    if (totalDeliveriesToday >= 20) {
        updates.points = (driverToUpdate.points || 0) + 10;
        newNotifications.unshift({
            id: Date.now() + 2,
            title: "Bónus de Entregas!",
            description: `Parabéns! Ganhou 10 pontos por fazer ${totalDeliveriesToday} entregas.`,
            read: false,
            date: new Date().toISOString(),
        });
    }
    
    updates.notifications = newNotifications;

    await updateDriver(driverToUpdate.id, updates);

    deliveryForm.reset({
        date: new Date(),
        deliveriesUber: 0,
        deliveriesWedely: 0,
    });
    fetchData(); // Refresh data

    const updatedDriverForDialog = await getDriver(selectedDriverForDeliveries.id);
    if(updatedDriverForDialog) setSelectedDriverForDeliveries(updatedDriverForDialog);
  };
  
  const handleRemoveDelivery = async (dateToRemove: string) => {
    if (!selectedDriverForDeliveries) return;
    
    const driverToUpdate = await getDriver(selectedDriverForDeliveries.id);
    if (!driverToUpdate) return;
    
    const updatedDeliveries = driverToUpdate.dailyDeliveries.filter(d => d.date !== dateToRemove);

    await updateDriver(driverToUpdate.id, { dailyDeliveries: updatedDeliveries });

    fetchData(); // Refresh data
    const updatedDriverForDialog = await getDriver(selectedDriverForDeliveries.id);
    if(updatedDriverForDialog) setSelectedDriverForDeliveries(updatedDriverForDialog);
  };

  const openDeliveriesDialog = (e: React.MouseEvent, driver: Driver) => {
    e.stopPropagation();
    setSelectedDriverForDeliveries(driver);
    deliveryForm.reset({
        date: new Date(),
        deliveriesUber: 0,
        deliveriesWedely: 0,
    });
    setIsDeliveriesDialogOpen(true);
  };

  const getRankIndicator = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.7)]" />;
    if (rank === 2) return <Award className="h-5 w-5 text-slate-300 drop-shadow-[0_0_5px_rgba(203,213,225,0.7)]" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-orange-400 drop-shadow-[0_0_5px_rgba(251,146,60,0.7)]" />;
    return <span className="text-sm font-bold text-muted-foreground">{rank}</span>;
  };

  return (
    <>
      <div className="space-y-4">
        <h2 className="font-headline text-2xl font-bold text-glow">Ranking de Motoristas</h2>
        
        <Card className="mb-4">
            <CardHeader>
                <CardTitle className="text-lg">Filtros</CardTitle>
                <CardDescription>Filtre o ranking por equipa ou período.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-2">
                    <Label htmlFor="team-filter">Equipa</Label>
                    <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                        <SelectTrigger id="team-filter" className="w-full">
                            <SelectValue placeholder="Selecionar Equipa" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas as Equipas</SelectItem>
                            {teams.map(team => (
                                <SelectItem key={team.id} value={team.id}>
                                    {team.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex-1 space-y-2">
                    <Label htmlFor="date-filter">Período de Entregas</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="date-filter"
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date?.from ? (
                                    date.to ? (
                                        <>
                                            {format(date.from, "dd/MM/y")} - {format(date.to, "dd/MM/y")}
                                        </>
                                    ) : (
                                        format(date.from, "dd/MM/y")
                                    )
                                ) : (
                                    <span>Todo o período</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={setDate}
                                numberOfMonths={1}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </CardContent>
        </Card>

        <div className="space-y-3">
          {isLoading ? (
            <RankingSkeleton />
          ) : (
            sortedDrivers.map((driver, index) => {
              const rank = index + 1;
              const weeklyGoal = 200;

              const today = startOfDay(new Date());
              const sevenDaysAgo = addDays(today, -6);
              
              const weeklyDeliveries = driver.dailyDeliveries
                .filter(d => {
                  const deliveryDate = parseISO(d.date);
                  return isWithinInterval(deliveryDate, { start: sevenDaysAgo, end: today });
                })
                .reduce((sum, d) => sum + (d.deliveriesUber || 0) + (d.deliveriesWedely || 0), 0);
              
              const weeklyProgress = (weeklyDeliveries / weeklyGoal) * 100;

              return (
                <Dialog key={driver.id}>
                  <DialogTrigger asChild>
                    <Card className="transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20 cursor-pointer">
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
                          <p className="text-sm text-muted-foreground">
                            {driver.totalDeliveries.toLocaleString()} entregas {date ? '(período)' : '(geral)'}
                          </p>
                          <div className="mt-2 space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Progresso Semanal</span>
                              <span className="font-semibold text-primary">{weeklyDeliveries} / {weeklyGoal}</span>
                            </div>
                            <Progress value={weeklyProgress} className="h-2" />
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="shrink-0" onClick={(e) => openDeliveriesDialog(e, driver as Driver)}>
                            <PlusCircle className="h-5 w-5" />
                        </Button>
                      </CardContent>
                    </Card>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] sm:max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto rounded-lg">
                     <DialogHeader className="sr-only">
                        <DialogTitle>Perfil de {driver.name}</DialogTitle>
                        <DialogDescription>
                            Ver detalhes e estatísticas do motorista {driver.name}.
                        </DialogDescription>
                     </DialogHeader>
                    <DriverProfileContent driver={driver as Driver} rank={rank} />
                  </DialogContent>
                </Dialog>
              )
            })
          )}
        </div>
      </div>

      <Dialog modal={false} open={isDeliveriesDialogOpen} onOpenChange={(isOpen) => {
        setIsDeliveriesDialogOpen(isOpen);
        if (!isOpen) {
          setSelectedDriverForDeliveries(null);
          deliveryForm.reset();
        }
      }}>
        <DialogContent className="w-[95vw] sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Gerir Entregas de {selectedDriverForDeliveries?.name}</DialogTitle>
            <DialogDescription>Adicione ou remova registos de entregas diárias.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <Card>
              <CardHeader>
                  <CardTitle className="text-lg">Adicionar Novo Registo</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...deliveryForm}>
                  <form onSubmit={deliveryForm.handleSubmit(handleAddDelivery)} className="space-y-4">
                    <FormField
                      control={deliveryForm.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col flex-grow">
                          <FormLabel>Data</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Escolha uma data</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date > new Date() || date < new Date("2000-01-01") || (selectedDriverForDeliveries?.dailyDeliveries.some(d => d.date === format(date, 'yyyy-MM-dd')) ?? false)
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex flex-col sm:flex-row gap-4">
                        <FormField
                            control={deliveryForm.control}
                            name="deliveriesUber"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                <FormLabel>Nº de Entregas Uber</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={deliveryForm.control}
                            name="deliveriesWedely"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                <FormLabel>Nº de Entregas Wedely</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <Button type="submit" className="w-full sm:w-auto">Adicionar</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Histórico de Entregas</CardTitle>
                </CardHeader>
                <CardContent className="max-h-64 overflow-y-auto">
                    {selectedDriverForDeliveries && selectedDriverForDeliveries.dailyDeliveries.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data</TableHead>
                                    <TableHead className="text-center">Uber</TableHead>
                                    <TableHead className="text-center">Wedely</TableHead>
                                    <TableHead className="text-center">Total</TableHead>
                                    <TableHead className="text-right">Ação</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {selectedDriverForDeliveries.dailyDeliveries.map(delivery => {
                                    const total = (delivery.deliveriesUber || 0) + (delivery.deliveriesWedely || 0);
                                    return (
                                        <TableRow key={delivery.date}>
                                            <TableCell>{format(parseISO(delivery.date), "dd/MM/yyyy")}</TableCell>
                                            <TableCell className="text-center">{delivery.deliveriesUber || 0}</TableCell>
                                            <TableCell className="text-center">{delivery.deliveriesWedely || 0}</TableCell>
                                            <TableCell className="text-center font-bold">{total}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => handleRemoveDelivery(delivery.date)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-center text-sm text-muted-foreground py-4">Sem registos de entregas.</p>
                    )}
                </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeliveriesDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
