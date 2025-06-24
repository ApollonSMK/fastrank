"use client";

import React, { useEffect, useState } from 'react';
import { drivers as initialDrivers, teams, Driver, DailyDelivery, achievements } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Award, Medal, TrendingUp, Route, ShieldCheck, Fuel, Calendar as CalendarIcon, PlusCircle, Trash2, Rocket, CalendarDays } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { DateRange } from "react-day-picker";
import { addDays, format, isWithinInterval, startOfDay } from "date-fns";
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


const chartConfig = {
  deliveries: {
    label: "Entregas",
    color: "hsl(var(--primary))",
  },
};

const deliveryFormSchema = z.object({
  date: z.date({ required_error: "A data é obrigatória." }),
  deliveries: z.coerce.number().min(0, "O número de entregas não pode ser negativo."),
});
type DeliveryFormValues = z.infer<typeof deliveryFormSchema>;

const iconMap: { [key: string]: React.ElementType } = {
  Rocket,
  Award,
  ShieldCheck,
  Trophy,
  CalendarDays,
};

const DriverProfileContent = ({ driver, rank }: { driver: Driver, rank: number }) => {
  const { name, trips, safetyScore, efficiency, dailyDeliveries, achievementIds } = driver;

  const [date, setDate] = React.useState<DateRange | undefined>();

  React.useEffect(() => {
    setDate({
      from: addDays(new Date(), -6),
      to: new Date(),
    });
  }, []);

  const totalDeliveries = dailyDeliveries.reduce((sum, day) => sum + day.deliveries, 0);

  const stats = [
    { label: "Total de Entregas", value: totalDeliveries.toLocaleString(), icon: TrendingUp },
    { label: "Viagens Concluídas", value: trips, icon: Route },
    { label: "Pontuação de Segurança", value: `${safetyScore}%`, icon: ShieldCheck },
    { label: "Eficiência", value: `${efficiency}%`, icon: Fuel },
  ];

  const chartData = dailyDeliveries
    .map(d => {
        const [year, month, day] = d.date.split('-').map(Number);
        return { ...d, dateObj: new Date(year, month - 1, day) };
    })
    .filter(d => {
        if (!date?.from) return true;
        const from = date.from;
        const to = date.to ?? from;
        return d.dateObj >= from && d.dateObj <= to;
    })
    .map(d => ({
      date: d.dateObj.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }),
      deliveries: d.deliveries,
    }));

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

      <div className="grid grid-cols-2 gap-4">
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
      
      <Card>
        <CardHeader>
            <CardTitle>Conquistas</CardTitle>
        </CardHeader>
        <CardContent>
            <TooltipProvider>
                {achievementIds.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 text-center">
                    {achievementIds.map(id => {
                    const achievement = achievements[id];
                    if (!achievement) return null;
                    const Icon = iconMap[achievement.icon];
                    return (
                        <UiTooltip key={id}>
                            <UiTooltipTrigger asChild>
                                <div className="flex flex-col items-center gap-2">
                                    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-accent/10 border-2 border-accent text-accent-foreground">
                                        <Icon className="h-8 w-8 text-accent drop-shadow-[0_0_5px_hsl(var(--accent))]" />
                                    </div>
                                    <span className="text-xs font-medium">{achievement.name}</span>
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
    </div>
  );
};


export default function DashboardPage() {
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all');
  const [date, setDate] = useState<DateRange | undefined>(undefined);

  const sortedDrivers = React.useMemo(() => {
    const teamFilteredDrivers =
      selectedTeamId === 'all'
        ? [...drivers]
        : drivers.filter((driver) => driver.teamId === parseInt(selectedTeamId, 10));

    const driversWithDeliveries = teamFilteredDrivers.map((driver) => {
      const totalDeliveries = driver.dailyDeliveries
        .filter((delivery) => {
          if (!date?.from) {
            return true;
          }
          const deliveryDate = new Date(delivery.date);
          const interval = {
            start: startOfDay(date.from),
            end: date.to ? startOfDay(date.to) : startOfDay(date.from),
          };
          return isWithinInterval(deliveryDate, interval);
        })
        .reduce((sum, d) => sum + d.deliveries, 0);

      return {
        ...driver,
        totalDeliveries,
      };
    });

    return driversWithDeliveries.sort((a, b) => b.totalDeliveries - a.totalDeliveries);
  }, [drivers, selectedTeamId, date]);

  const [isDeliveriesDialogOpen, setIsDeliveriesDialogOpen] = useState(false);
  const [selectedDriverForDeliveries, setSelectedDriverForDeliveries] = useState<Driver | null>(null);

  const deliveryForm = useForm<DeliveryFormValues>({
    resolver: zodResolver(deliveryFormSchema),
    defaultValues: {
      deliveries: 0,
    },
  });

  const driverForDeliveries = drivers.find(d => d.id === selectedDriverForDeliveries?.id);

  const handleAddDelivery: SubmitHandler<DeliveryFormValues> = (data) => {
    if (!driverForDeliveries) return;

    const newDelivery: DailyDelivery = {
      date: format(data.date, 'yyyy-MM-dd'),
      deliveries: data.deliveries,
    };

    const updateDriverDeliveries = (driver: Driver) => {
        const existingDates = new Set(driver.dailyDeliveries.map(d => d.date));
        if (existingDates.has(newDelivery.date)) {
            console.error("A delivery record for this date already exists.");
            return driver.dailyDeliveries;
        }
        const updatedDeliveries = [...driver.dailyDeliveries, newDelivery];
        return updatedDeliveries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    const newDriversState = drivers.map(d => 
      d.id === driverForDeliveries.id 
        ? { ...d, dailyDeliveries: updateDriverDeliveries(d) }
        : d
    );
    setDrivers(newDriversState);
    
    const driverInMock = initialDrivers.find(d => d.id === driverForDeliveries.id);
    if (driverInMock) {
      driverInMock.dailyDeliveries = updateDriverDeliveries(driverInMock);
    }
    
    deliveryForm.reset();
  };
  
  const handleRemoveDelivery = (dateToRemove: string) => {
    if (!driverForDeliveries) return;

    const updateDriverDeliveries = (driver: Driver) => {
        return driver.dailyDeliveries.filter(d => d.date !== dateToRemove);
    };

    const newDriversState = drivers.map(d => 
      d.id === driverForDeliveries.id
        ? { ...d, dailyDeliveries: updateDriverDeliveries(d) }
        : d
    );
    setDrivers(newDriversState);

    const driverInMock = initialDrivers.find(d => d.id === driverForDeliveries.id);
    if (driverInMock) {
        driverInMock.dailyDeliveries = updateDriverDeliveries(driverInMock);
    }
  };

  const openDeliveriesDialog = (e: React.MouseEvent, driver: Driver) => {
    e.stopPropagation();
    setSelectedDriverForDeliveries(driver);
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
                                <SelectItem key={team.id} value={String(team.id)}>
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
                                    <span>Escolha um período</span>
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
          {sortedDrivers.map((driver, index) => {
            const rank = index + 1;
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
                        <p className="text-sm text-muted-foreground">{driver.totalDeliveries.toLocaleString()} entregas</p>
                      </div>
                      <Button variant="ghost" size="icon" className="shrink-0" onClick={(e) => openDeliveriesDialog(e, driver as Driver)}>
                          <PlusCircle className="h-5 w-5" />
                      </Button>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
                  <DriverProfileContent driver={driver as Driver} rank={rank} />
                </DialogContent>
              </Dialog>
            )
          })}
        </div>
      </div>

      <Dialog open={isDeliveriesDialogOpen} onOpenChange={(isOpen) => {
        setIsDeliveriesDialogOpen(isOpen);
        if (!isOpen) {
          setSelectedDriverForDeliveries(null);
          deliveryForm.reset();
        }
      }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Gerir Entregas de {driverForDeliveries?.name}</DialogTitle>
            <DialogDescription>Adicione ou remova registos de entregas diárias.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <Card>
              <CardHeader>
                  <CardTitle className="text-lg">Adicionar Novo Registo</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...deliveryForm}>
                  <form onSubmit={deliveryForm.handleSubmit(handleAddDelivery)} className="flex items-end gap-4">
                    <FormField
                      control={deliveryForm.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Data</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-[240px] pl-3 text-left font-normal",
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
                                  date > new Date() || date < new Date("2000-01-01") || (driverForDeliveries?.dailyDeliveries.some(d => d.date === format(date, 'yyyy-MM-dd')) ?? false)
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={deliveryForm.control}
                      name="deliveries"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nº de Entregas</FormLabel>
                          <FormControl>
                            <Input type="number" className="w-32" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit">Adicionar</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Histórico de Entregas</CardTitle>
                </CardHeader>
                <CardContent className="max-h-64 overflow-y-auto">
                    {driverForDeliveries && driverForDeliveries.dailyDeliveries.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Entregas</TableHead>
                                    <TableHead className="text-right">Ação</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {driverForDeliveries.dailyDeliveries.map(delivery => (
                                    <TableRow key={delivery.date}>
                                        <TableCell>{format(new Date(delivery.date), "dd/MM/yyyy")}</TableCell>
                                        <TableCell>{delivery.deliveries}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveDelivery(delivery.date)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
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
