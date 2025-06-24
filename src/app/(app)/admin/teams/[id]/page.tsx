"use client";

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { teams, drivers as initialDrivers, Driver, DailyDelivery } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, ArrowLeft, MoreVertical, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const FormSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  licensePlate: z.string().regex(/^[A-Z]{2}-\d{2}-[A-Z]{2}$/, { message: 'Formato de matrícula inválido (ex: AA-11-BB).' }),
  vehicleModel: z.string().min(2, { message: 'O modelo deve ter pelo menos 2 caracteres.' }),
  driverLoginId: z.string().min(3, { message: 'O ID de login deve ter pelo menos 3 caracteres.' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
});

type FormValues = z.infer<typeof FormSchema>;

const deliveryFormSchema = z.object({
  date: z.date({ required_error: "A data é obrigatória." }),
  deliveries: z.coerce.number().min(0, "O número de entregas não pode ser negativo."),
});
type DeliveryFormValues = z.infer<typeof deliveryFormSchema>;


export default function TeamDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const teamId = Number(params.id);
  
  const team = teams.find(t => t.id === teamId);
  
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [targetTeamId, setTargetTeamId] = useState<string>('');
  
  const [isDeliveriesDialogOpen, setIsDeliveriesDialogOpen] = useState(false);
  const [selectedDriverForDeliveries, setSelectedDriverForDeliveries] = useState<Driver | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      licensePlate: "",
      vehicleModel: "",
      driverLoginId: "",
      password: "",
    },
  });

  const deliveryForm = useForm<DeliveryFormValues>({
    resolver: zodResolver(deliveryFormSchema),
    defaultValues: {
      deliveries: 0,
    },
  });

  if (!team) {
    return <div>Equipa não encontrada</div>;
  }
  
  const teamMembers = drivers.filter(d => d.teamId === teamId);
  const driverForDeliveries = drivers.find(d => d.id === selectedDriverForDeliveries?.id);


  const onSubmit: SubmitHandler<FormValues> = (data) => {
    const newDriverId = drivers.length > 0 ? Math.max(...drivers.map(d => d.id)) + 1 : 1;
    
    const newDriver: Driver = {
      id: newDriverId,
      name: data.name,
      licensePlate: data.licensePlate.toUpperCase(),
      vehicleModel: data.vehicleModel,
      teamId: team.id,
      driverLoginId: data.driverLoginId,
      password: data.password,
      avatar: '/avatars/default.png',
      rank: drivers.length + 1,
      points: 0,
      trips: 0,
      safetyScore: 100,
      efficiency: 100,
      dailyDeliveries: [],
    };

    const updatedDrivers = [...drivers, newDriver];
    setDrivers(updatedDrivers);
    initialDrivers.push(newDriver);
    form.reset();
  };

  const openDeleteDialog = (driver: Driver) => {
    setSelectedDriver(driver);
    setIsDeleteDialogOpen(true);
  };

  const openTransferDialog = (driver: Driver) => {
    setSelectedDriver(driver);
    setIsTransferDialogOpen(true);
  };

  const openDeliveriesDialog = (driver: Driver) => {
    setSelectedDriverForDeliveries(driver);
    setIsDeliveriesDialogOpen(true);
  };

  const handleDeleteDriver = () => {
    if (!selectedDriver) return;

    const updatedDrivers = drivers.filter(d => d.id !== selectedDriver.id);
    setDrivers(updatedDrivers);
    
    const index = initialDrivers.findIndex(d => d.id === selectedDriver.id);
    if (index > -1) {
      initialDrivers.splice(index, 1);
    }
    
    setIsDeleteDialogOpen(false);
    setSelectedDriver(null);
  };
  
  const handleTransferDriver = () => {
    if (!selectedDriver || !targetTeamId) return;

    const newTeamId = parseInt(targetTeamId, 10);

    setDrivers(prevDrivers => prevDrivers.map(d => 
      d.id === selectedDriver.id ? { ...d, teamId: newTeamId } : d
    ));

    const driverInMock = initialDrivers.find(d => d.id === selectedDriver.id);
    if (driverInMock) {
      driverInMock.teamId = newTeamId;
    }

    setIsTransferDialogOpen(false);
    setSelectedDriver(null);
    setTargetTeamId('');
  };

  const handleAddDelivery: SubmitHandler<DeliveryFormValues> = (data) => {
    if (!driverForDeliveries) return;

    const newDelivery: DailyDelivery = {
      date: format(data.date, 'yyyy-MM-dd'),
      deliveries: data.deliveries,
    };

    const updateDriverDeliveries = (driver: Driver) => {
        const existingDates = new Set(driver.dailyDeliveries.map(d => d.date));
        if (existingDates.has(newDelivery.date)) {
            // In a real app, a toast notification would be better.
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


  return (
    <>
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
                <FormField
                  control={form.control}
                  name="driverLoginId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID de Login</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: joao.silva" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
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
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.length > 0 ? (
                  teamMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>{member.licensePlate}</TableCell>
                      <TableCell>{member.vehicleModel}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openDeliveriesDialog(member)}>
                              Gerir Entregas
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openTransferDialog(member)}>
                              Transferir
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openDeleteDialog(member)} className="text-destructive">
                              Remover
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Esta equipa ainda não tem membros.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem a certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isto irá remover permanentemente o motorista
              e os seus dados da aplicação.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedDriver(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDriver}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Dialog open={isTransferDialogOpen} onOpenChange={(isOpen) => {
          setIsTransferDialogOpen(isOpen);
          if (!isOpen) {
            setSelectedDriver(null);
            setTargetTeamId('');
          }
        }}>
        <DialogContent>
            <DialogHeader>
              <DialogTitle>Transferir {selectedDriver?.name}</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-2">
              <Label>Transferir para a equipa:</Label>
               <Select onValueChange={setTargetTeamId} value={targetTeamId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma equipa" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams
                      .filter(t => t.id !== teamId)
                      .map(t => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.name}
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsTransferDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleTransferDriver} disabled={!targetTeamId}>Transferir</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
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
