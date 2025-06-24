"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { drivers, Driver } from "@/lib/mock-data";
import { TrendingUp, Route, ShieldCheck, Fuel, ArrowLeft, Calendar as CalendarIcon } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { DateRange } from "react-day-picker";
import { addDays, format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const chartConfig = {
  deliveries: {
    label: "Entregas",
    color: "hsl(var(--primary))",
  },
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

export default function DriverProfilePage() {
  const router = useRouter();
  const params = useParams();
  const [driver, setDriver] = useState<Driver | null | undefined>(undefined);
  const [date, setDate] = useState<DateRange | undefined>();

  useEffect(() => {
    if (params.id) {
        const driverId = Number(params.id);
        const foundDriver = drivers.find(d => d.id === driverId);
        setDriver(foundDriver || null);
    }
  }, [params.id]);

  useEffect(() => {
    setDate({
      from: addDays(new Date(), -6),
      to: new Date(),
    });
  }, []);

  if (driver === undefined) {
    return <ProfileSkeleton />;
  }

  if (driver === null) {
    return (
        <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Motorista não encontrado</h2>
            <Button onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
            </Button>
        </div>
    );
  }

  const { name, rank, trips, safetyScore, efficiency, dailyDeliveries } = driver;
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
       <Button variant="ghost" onClick={() => router.back()} className="mb-4 -ml-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Ranking
        </Button>
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
    </div>
  );
}
