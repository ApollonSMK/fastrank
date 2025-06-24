"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { drivers, Driver } from "@/lib/mock-data";
import { TrendingUp, Route, ShieldCheck, Fuel, ArrowLeft } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

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
    </div>
  );
}

export default function DriverProfilePage() {
  const router = useRouter();
  const params = useParams();
  const [driver, setDriver] = useState<Driver | null | undefined>(undefined);

  useEffect(() => {
    if (params.id) {
        const driverId = Number(params.id);
        const foundDriver = drivers.find(d => d.id === driverId);
        setDriver(foundDriver || null);
    }
  }, [params.id]);

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

  const { name, avatar, rank, points, trips, safetyScore, efficiency } = driver;

  const stats = [
    { label: "Total de Pontos", value: points.toLocaleString(), icon: TrendingUp },
    { label: "Viagens Concluídas", value: trips, icon: Route },
    { label: "Pontuação de Segurança", value: `${safetyScore}%`, icon: ShieldCheck },
    { label: "Eficiência", value: `${efficiency}%`, icon: Fuel },
  ];

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
    </div>
  );
}
