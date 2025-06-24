"use client";

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { teams, drivers as initialDrivers, Driver } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, ArrowLeft } from 'lucide-react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const FormSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  licensePlate: z.string().regex(/^[A-Z]{2}-\d{2}-[A-Z]{2}$/, { message: 'Formato de matrícula inválido (ex: AA-11-BB).' }),
  vehicleModel: z.string().min(2, { message: 'O modelo deve ter pelo menos 2 caracteres.' }),
});

type FormValues = z.infer<typeof FormSchema>;

export default function TeamDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const teamId = Number(params.id);
  
  const team = teams.find(t => t.id === teamId);
  
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      licensePlate: "",
      vehicleModel: "",
    },
  });

  if (!team) {
    return <div>Equipa não encontrada</div>;
  }
  
  const teamMembers = drivers.filter(d => d.teamId === teamId);

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    const newDriverId = Math.max(...drivers.map(d => d.id)) + 1;
    const newDriverLoginId = `${data.name.split(' ')[0].toLowerCase()}${newDriverId}`;
    
    const newDriver: Driver = {
      id: newDriverId,
      name: data.name,
      licensePlate: data.licensePlate.toUpperCase(),
      vehicleModel: data.vehicleModel,
      teamId: team.id,
      driverLoginId: newDriverLoginId,
      avatar: '/avatars/default.png',
      rank: drivers.length + 1,
      points: 0,
      trips: 0,
      safetyScore: 100,
      efficiency: 100,
    };

    setDrivers(prevDrivers => [...prevDrivers, newDriver]);
    form.reset();
  };

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Equipas
        </Button>
        <h2 className="font-headline text-2xl font-bold">{team.name}</h2>
        <p className="text-muted-foreground">Gerir membros da equipa.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Adicionar Novo Membro</CardTitle>
          <CardDescription>Crie um novo motorista e adicione-o a esta equipa.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo do motorista" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="licensePlate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Matrícula</FormLabel>
                    <FormControl>
                      <Input placeholder="AA-11-BB" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="vehicleModel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo do Veículo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Renault Clio" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={form.formState.isSubmitting}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Membro
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Membros da Equipa</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Matrícula</TableHead>
                <TableHead>Modelo do Veículo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.length > 0 ? (
                teamMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.licensePlate}</TableCell>
                    <TableCell>{member.vehicleModel}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    Esta equipa ainda não tem membros.
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
