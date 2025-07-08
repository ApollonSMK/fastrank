
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getLoggedInDriver, signOutUser, claimDailyReward } from "@/lib/data-service";
import { Driver, achievements } from "@/lib/data-types";
import { TrendingUp, Route, ShieldCheck, Fuel, Calendar as CalendarIcon, Rocket, Award, Trophy, CalendarDays, Wallet, Star, LogOut, Gift } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { DateRange } from "react-day-picker";
import { addDays, format, isWithinInterval, startOfDay, parseISO } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tooltip as UiTooltip, TooltipContent as UiTooltipContent, TooltipProvider, TooltipTrigger as UiTooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";


const chartConfig = {
  deliveries: {
    label: "Entregas",
    color: "hsl(var(--primary))",
  },
};

const iconMap: { [key: string]: React.ElementType } = {
  Rocket,
  Award,
  ShieldCheck,
  Trophy,
  CalendarDays,
  Landmark: Wallet,
};

function ProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col items-center space-y-4">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="text-center space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-6 w-52" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
       <Skeleton className="h-[200px] w-full" />
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [date, setDate] = useState<DateRange | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDriver = async () => {
        setIsLoading(true);
        const loggedInDriver = await getLoggedInDriver();
        setDriver(loggedInDriver);
        const today = new Date();
        setDate({
          from: addDays(today, -6),
          to: today,
        });
        setIsLoading(false);
    }
    fetchDriver();
  }, []);

  const handleLogout = async () => {
    await signOutUser();
    router.push('/');
  };

  const handleClaimReward = async () => {
    if (!driver) return;
    setIsClaiming(true);
    try {
        await claimDailyReward(driver.id);
        toast({
            title: "Recompensa Resgatada!",
            description: "Ganhou 5 pontos. Volte amanhã!",
        });
        // refetch driver data to update points and button state
        const updatedDriver = await getLoggedInDriver();
        setDriver(updatedDriver);
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Erro",
            description: error.message || "Não foi possível resgatar a recompensa.",
        });
    } finally {
        setIsClaiming(false);
    }
  };


  if (isLoading) {
    return <ProfileSkeleton />;
  }
  
  if (!driver) {
     return (
        <div className="flex flex-col items-center justify-center text-center h-64">
            <Card className="p-6">
                <CardTitle>Perfil não encontrado</CardTitle>
                <CardDescription className="mt-2">
                    Não foi possível carregar os dados do seu perfil de motorista.
                    Isto pode acontecer se a sua conta foi desativada ou se os dados estão inconsistentes.
                    Por favor, contacte um administrador.
                </CardDescription>
                 <Button onClick={handleLogout} className="mt-4">
                    <LogOut className="mr-2 h-4 w-4" />
                    Terminar Sessão
                </Button>
            </Card>
        </div>
    );
  }

  const { name, rank, trips, safetyScore, efficiency, dailyDeliveries, achievementIds, points, moneyBalance, lastDailyRewardClaimed } = driver;
  const totalDeliveries = dailyDeliveries.reduce((sum, day) => sum + (day.deliveriesUber || 0) + (day.deliveriesWedely || 0) + (day.deliveriesSushishop || 0) + (day.deliveriesShipday || 0), 0);

  const stats = [
    { label: "Total de Entregas", value: totalDeliveries.toLocaleString(), icon: TrendingUp },
    { label: "Viagens Concluídas", value: trips, icon: Route },
    { label: "Pontuação de Segurança", value: `${safetyScore}%`, icon: ShieldCheck },
    { label: "Eficiência", value: `${efficiency}%`, icon: Fuel },
  ];

  const chartData = dailyDeliveries
    .map(d => ({ ...d, dateObj: parseISO(d.date) }))
    .filter(d => {
        if (!date?.from) return true;
        const from = date.from;
        const to = date.to ?? from;
        return isWithinInterval(d.dateObj, { start: startOfDay(from), end: startOfDay(to) });
    })
    .map(d => ({
      date: d.dateObj.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }),
      deliveries: (d.deliveriesUber || 0) + (d.deliveriesWedely || 0) + (d.deliveriesSushishop || 0) + (d.deliveriesShipday || 0),
    }));
  
  const today = new Date().toISOString().split('T')[0];
  const canClaim = lastDailyRewardClaimed !== today;


  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center space-y-4">
        <Avatar className="h-24 w-24 border-4 border-primary/50">
          <AvatarImage src={`https://placehold.co/96x96.png`} data-ai-hint="person portrait" alt={name} />
          <AvatarFallback className="text-3xl">{name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="text-center">
          <h2 className="font-headline text-2xl font-bold">{name}</h2>
          <p className="text-lg text-muted-foreground">Posição no Ranking: <span className="font-bold text-primary">#{rank}</span></p>
        </div>
      </div>
      
      <Card>
        <CardHeader className='pb-4'>
            <CardTitle>Conquistas</CardTitle>
        </CardHeader>
        <CardContent>
            <TooltipProvider>
                {achievementIds.length > 0 ? (
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
                ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma conquista ainda.</p>
                )}
            </TooltipProvider>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
      
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Gift className="h-5 w-5 text-primary"/>Recompensa Diária</CardTitle>
            <CardDescription>Volte todos os dias para resgatar 5 pontos de bónus.</CardDescription>
        </CardHeader>
        <CardContent>
            <Button className="w-full" onClick={handleClaimReward} disabled={!canClaim || isClaiming}>
                {isClaiming ? 'Aguarde...' : canClaim ? 'Resgatar 5 Pontos' : 'Recompensa já resgatada hoje'}
            </Button>
        </CardContent>
      </Card>

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

      <Button variant="outline" onClick={handleLogout} className="w-full">
        <LogOut className="mr-2 h-4 w-4" />
        Terminar Sessão
      </Button>
    </div>
  );
}
