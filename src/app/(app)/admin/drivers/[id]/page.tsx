
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getDriver } from '@/lib/data-service';
import { Driver } from '@/lib/data-types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Car, History } from 'lucide-react';
import { format } from "date-fns";
import { Skeleton } from '@/components/ui/skeleton';

const DriverHistorySkeleton = () => {
    return (
        <div className="space-y-6">
            <div className="flex justify-start">
                <Skeleton className="h-10 w-32" />
            </div>
            <div className="flex flex-col gap-2">
                 <Skeleton className="h-8 w-48" />
                 <Skeleton className="h-5 w-64" />
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-52 mt-1" />
                </CardHeader>
                <CardContent>
                   <Skeleton className="h-40 w-full" />
                </CardContent>
            </Card>
        </div>
    );
};

export default function DriverHistoryPage() {
    const router = useRouter();
    const params = useParams();
    const driverId = params.id as string;

    const [driver, setDriver] = useState<Driver | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!driverId) return;
        setIsLoading(true);
        const driverData = await getDriver(driverId);
        setDriver(driverData);
        setIsLoading(false);
    }, [driverId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (isLoading) {
        return <DriverHistorySkeleton />;
    }

    if (!driver) {
        return (
            <div className="space-y-6">
                <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                </Button>
                <div>Motorista não encontrado</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <Button variant="ghost" onClick={() => router.back()} className="mb-4 -ml-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                </Button>
                <h2 className="font-headline text-2xl font-bold">{driver.name}</h2>
                <p className="text-muted-foreground">Histórico de veículos e matrículas.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Histórico de Veículos
                    </CardTitle>
                    <CardDescription>
                        Registo de todos os veículos associados a este motorista.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Modelo do Veículo</TableHead>
                                <TableHead>Matrícula</TableHead>
                                <TableHead>Data de Atribuição</TableHead>
                                <TableHead>Data de Fim</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {driver.licensePlateHistory && driver.licensePlateHistory.length > 0 ? (
                                driver.licensePlateHistory
                                .sort((a, b) => new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime())
                                .map((entry, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{entry.vehicleModel}</TableCell>
                                        <TableCell>{entry.licensePlate}</TableCell>
                                        <TableCell>{format(new Date(entry.assignedDate), "dd/MM/yyyy HH:mm")}</TableCell>
                                        <TableCell>
                                            {entry.unassignedDate ? format(new Date(entry.unassignedDate), "dd/MM/yyyy HH:mm") : 'Atual'}
                                        </TableCell>
                                    </TableRow>
                                ))
                             ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                                        Nenhum histórico de veículos encontrado.
                                    </TableCell>
                                </TableRow>
                             )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
