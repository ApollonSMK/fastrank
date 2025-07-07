
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Driver, DailyDelivery, Team, achievements, VehicleHistoryEntry } from '@/lib/data-types';
import { getTeam, getAllTeams, getDriversByTeam, assignDriverToVehicle, updateDriver, deleteDriver, getDriver, addFleetChangeLog, getAllDrivers } from '@/lib/data-service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, ArrowLeft, MoreVertical, Trash2, Calendar as CalendarIcon, Edit, History } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';

const addFormSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  emailUsername: z.string().min(1, { message: 'O nome de utilizador do email é obrigatório.' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
  vehicleId: z.string().min(1, { message: 'É obrigatório selecionar um veículo.' }),
});
type AddFormValues = z.infer<typeof addFormSchema>;

const editFormSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  licensePlate: z.string().min(1, { message: "A matrícula é obrigatória." }),
  vehicleModel: z.string().min(2, { message: 'O modelo deve ter pelo menos 2 caracteres.' }),
});
type EditFormValues = z.infer<typeof editFormSchema>;

const deliveryFormSchema = z.object({
  date: z.date({ required_error: "A data é obrigatória." }),
  deliveriesUber: z.coerce.number().min(0, "O número de entregas não pode ser negativo.").default(0),
  deliveriesWedely: z.coerce.number().min(0, "O número de entregas não pode ser negativo.").default(0),
}).refine(data => data.deliveriesUber > 0 || data.deliveriesWedely > 0, {
  message: "Deve registar pelo menos uma entrega.",
  path: ["deliveriesUber"],
});
type DeliveryFormValues = z.infer<typeof deliveryFormSchema>;


export default function TeamDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const teamId = params.id as string;
  
  const [team, setTeam] = useState<Team | null>(null);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [allDrivers, setAllDrivers] = useState<Driver[]>([]);
  const [freeVehicles, setFreeVehicles] = useState<Driver[]>([]);
  const [teamMembers, setTeamMembers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [targetTeamId, setTargetTeamId] = useState<string>('');
  
  const [isDeliveriesDialogOpen, setIsDeliveriesDialogOpen] = useState(false);
  const [selectedDriverForDeliveries, setSelectedDriverForDeliveries] = useState<Driver | null>(null);

  const [driverToEdit, setDriverToEdit] = useState<Driver | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!teamId) return;
    setIsLoading(true);
    const [teamData, membersData, allTeamsData, allDriversData] = await Promise.all([
        getTeam(teamId),
        getDriversByTeam(teamId),
        getAllTeams(),
        getAllDrivers()
    ]);
    setTeam(teamData);
    setTeamMembers(membersData.filter(m => m.email !== 'info@fastrack.lu'));
    setAllTeams(allTeamsData);
    setAllDrivers(allDriversData.filter(d => d.email !== 'info@fastrack.lu'));
    setFreeVehicles(allDriversData.filter(d => d.name === '[VEÍCULO LIVRE]'));
    setIsLoading(false);
  }, [teamId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addForm = useForm<AddFormValues>({
    resolver: zodResolver(addFormSchema),
    defaultValues: {
      name: "",
      emailUsername: "",
      password: "",
      vehicleId: "",
    },
  });

  const editForm = useForm<EditFormValues>({
    resolver: zodResolver(editFormSchema),
  });

  const deliveryForm = useForm<DeliveryFormValues>({
    resolver: zodResolver(deliveryFormSchema),
    defaultValues: {
      deliveriesUber: 0,
      deliveriesWedely: 0,
    },
  });

  if (isLoading) {
      return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-8 w-64" />
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-64 mt-1" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-32" />
                </CardContent>
            </Card>
            <Card>
                 <CardHeader>
                    <Skeleton className="h-6 w-40" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-20 w-full" />
                </CardContent>
            </Card>
        </div>
      );
  }

  if (!team) {
    return <div>Equipa não encontrada</div>;
  }

  const onAddSubmit: SubmitHandler<AddFormValues> = async (data) => {
    const newDriverData = {
      name: data.name,
      email: `${data.emailUsername}@fastrack.lu`,
      teamId: team.id,
    };
    
    try {
        await assignDriverToVehicle(data.vehicleId, newDriverData, data.password);
        addForm.reset();
        fetchData();
    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            addForm.setError('emailUsername', {
                type: 'manual',
                message: 'Este email já está registado.'
            });
        } else {
            console.error("Error creating user:", error);
            // Optionally, show a generic error toast
        }
    }
  };

  const onUpdateSubmit: SubmitHandler<EditFormValues> = async (data) => {
    if (!driverToEdit) return;

    const newPlate = data.licensePlate.toUpperCase();
    if (newPlate !== driverToEdit.licensePlate.toUpperCase()) {
        const plateExists = allDrivers.some(driver =>
            driver.id !== driverToEdit.id &&
            driver.licensePlate.toUpperCase() === newPlate
        );
        if (plateExists) {
            editForm.setError("licensePlate", {
                type: "manual",
                message: "Esta matrícula já está a ser utilizada por outro motorista."
            });
            return;
        }
    }

    const currentDriver = await getDriver(driverToEdit.id);
    if (!currentDriver) return;

    const nameChanged = currentDriver.name !== data.name;
    const plateChanged = currentDriver.licensePlate.toUpperCase() !== data.licensePlate.toUpperCase();
    const modelChanged = currentDriver.vehicleModel !== data.vehicleModel;

    // No changes, just close the dialog
    if (!nameChanged && !plateChanged && !modelChanged) {
        setIsEditDialogOpen(false);
        setDriverToEdit(null);
        return;
    }

    const updates: Partial<Driver> = {
      name: data.name,
      licensePlate: data.licensePlate.toUpperCase(),
      vehicleModel: data.vehicleModel,
    };
    
    const changeDescriptions: string[] = [];

    // Handle vehicle history update if plate or model changed
    if (plateChanged || modelChanged) {
        const updatedHistory = [...(currentDriver.licensePlateHistory || [])];
        const lastEntry = updatedHistory.find(entry => entry.unassignedDate === null);
        
        if (lastEntry) {
            lastEntry.unassignedDate = new Date().toISOString();
        }

        updatedHistory.push({
            licensePlate: data.licensePlate.toUpperCase(),
            vehicleModel: data.vehicleModel,
            assignedDate: new Date().toISOString(),
            unassignedDate: null,
        });
        updates.licensePlateHistory = updatedHistory;
    }
    
    if (nameChanged) {
        changeDescriptions.push(`Nome alterado de "${currentDriver.name}" para "${data.name}".`);
    }
    if (plateChanged) {
        changeDescriptions.push(`Matrícula alterada de "${currentDriver.licensePlate}" para "${data.licensePlate.toUpperCase()}".`);
    }
    if (modelChanged) {
        changeDescriptions.push(`Modelo do veículo alterado de "${currentDriver.vehicleModel}" para "${data.vehicleModel}".`);
    }

    // Update the driver document in Firestore
    await updateDriver(driverToEdit.id, updates);

    // Add a detailed log entry
    if (changeDescriptions.length > 0) {
        await addFleetChangeLog({
            driverId: driverToEdit.id,
            driverName: data.name, // Use new name for consistency
            changeDescription: changeDescriptions.join(' ')
        });
    }

    setIsEditDialogOpen(false);
    setDriverToEdit(null);
    fetchData();
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
    deliveryForm.reset();
    setIsDeliveriesDialogOpen(true);
  };
  
  const openEditDialog = (driver: Driver) => {
    setDriverToEdit(driver);
    editForm.reset({
        name: driver.name,
        licensePlate: driver.licensePlate,
        vehicleModel: driver.vehicleModel,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteDriver = async () => {
    if (!selectedDriver) return;
    await deleteDriver(selectedDriver.id);
    setIsDeleteDialogOpen(false);
    setSelectedDriver(null);
    fetchData();
  };
  
  const handleTransferDriver = async () => {
    if (!selectedDriver || !targetTeamId) return;

    const currentTeam = allTeams.find(t => t.id === selectedDriver?.teamId);
    const targetTeam = allTeams.find(t => t.id === targetTeamId);

    if (!targetTeam) return;

    await updateDriver(selectedDriver.id, { teamId: targetTeamId });

    await addFleetChangeLog({
        driverId: selectedDriver.id,
        driverName: selectedDriver.name,
        changeDescription: `Motorista ${selectedDriver.name} transferido da equipa ${currentTeam?.name || 'N/A'} para ${targetTeam.name}.`
    });

    setIsTransferDialogOpen(false);
    setSelectedDriver(null);
    setTargetTeamId('');
    fetchData();
  };

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

    const existingDeliveryIndex = driverToUpdate.dailyDeliveries.findIndex(d => d.date === newDelivery.date);
    
    if (existingDeliveryIndex > -1) {
      deliveryForm.setError("date", { type: "manual", message: "Já existe um registo para esta data."});
      return;
    } 
    
    const updatedDeliveries = [...driverToUpdate.dailyDeliveries, newDelivery]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const newNotifications = [...driverToUpdate.notifications];
    newNotifications.unshift({
        id: Date.now(),
        title: "Entregas Atualizadas",
        description: `Registo de ${totalDeliveriesToday} entregas para ${format(data.date, 'dd/MM/yyyy')} foi adicionado por um administrador.`,
        read: false,
        date: new Date().toISOString(),
    });

    const totalDeliveries = updatedDeliveries.reduce((sum, d) => sum + (d.deliveriesUber || 0) + (d.deliveriesWedely || 0), 0);
    const newAchievementIds = [...driverToUpdate.achievementIds];
    
    if (totalDeliveries >= 150 && !driverToUpdate.achievementIds.includes('delivery-150')) {
        newAchievementIds.push('delivery-150');
        newNotifications.unshift({
            id: Date.now() + 1,
            title: "Nova Conquista!",
            description: `Parabéns! Desbloqueou: "${achievements['delivery-150'].name}"`,
            read: false, date: new Date().toISOString()
        });
    } else if (totalDeliveries >= 50 && !driverToUpdate.achievementIds.includes('delivery-50')) {
        newAchievementIds.push('delivery-50');
        newNotifications.unshift({
            id: Date.now() + 1,
            title: "Nova Conquista!",
            description: `Parabéns! Desbloqueou: "${achievements['delivery-50'].name}"`,
            read: false, date: new Date().toISOString()
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
    
    deliveryForm.reset();
    fetchData();
    // Re-fetch driver for the dialog to show updated deliveries
    const updatedDriver = await getDriver(selectedDriverForDeliveries.id);
    if (updatedDriver) setSelectedDriverForDeliveries(updatedDriver);
  };
  
  const handleRemoveDelivery = async (dateToRemove: string) => {
    if (!selectedDriverForDeliveries) return;
    
    const driverToUpdate = await getDriver(selectedDriverForDeliveries.id);
    if (!driverToUpdate) return;
    
    const updatedDeliveries = driverToUpdate.dailyDeliveries.filter(d => d.date !== dateToRemove);
    
    await updateDriver(driverToUpdate.id, { dailyDeliveries: updatedDeliveries });

    fetchData();
     // Re-fetch driver for the dialog to show updated deliveries
    const updatedDriver = await getDriver(selectedDriverForDeliveries.id);
    if (updatedDriver) setSelectedDriverForDeliveries(updatedDriver);
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
            <CardDescription>Crie um novo motorista e associe-o a um veículo livre.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...addForm}>
              <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
                <FormField
                  control={addForm.control}
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
                  control={addForm.control}
                  name="vehicleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Veículo Livre</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione um veículo livre" /></SelectTrigger></FormControl>
                        <SelectContent>
                            {freeVehicles.length > 0 ? (
                                freeVehicles.map(v => (
                                    <SelectItem key={v.id} value={v.id}>
                                        {v.licensePlate} - {v.vehicleModel}
                                    </SelectItem>
                                ))
                            ) : (
                                <SelectItem value="none" disabled>Não há veículos livres</SelectItem>
                            )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="emailUsername"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                       <FormControl>
                        <div className="flex items-center gap-2">
                          <Input placeholder="joao.silva" {...field} />
                          <span className="text-muted-foreground">@fastrack.lu</span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
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
                <Button type="submit" disabled={addForm.formState.isSubmitting || freeVehicles.length === 0}>
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
                             <DropdownMenuItem onClick={() => router.push(`/admin/drivers/${member.id}`)}>
                                <History className="mr-2 h-4 w-4" />
                                Ver Histórico
                             </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(member)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openDeliveriesDialog(member)}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              Gerir Entregas
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openTransferDialog(member)}>
                              <ArrowLeft className="mr-2 h-4 w-4" />
                              Transferir
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openDeleteDialog(member)} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
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
              Esta ação irá remover o motorista "{selectedDriver?.name}". O veículo associado ficará livre.
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
                    {allTeams
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
      
       <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => {
        setIsEditDialogOpen(isOpen);
        if (!isOpen) setDriverToEdit(null);
      }}>
        <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Membro: {driverToEdit?.name}</DialogTitle>
              <DialogDescription>
                Atualize os detalhes do motorista. O email não pode ser alterado.
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(onUpdateSubmit)} className="space-y-4 py-4">
                     <FormField
                        control={editForm.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Nome</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={editForm.control}
                        name="licensePlate"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Matrícula</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={editForm.control}
                        name="vehicleModel"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Modelo do Veículo</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    <DialogFooter>
                        <Button variant="outline" type="button" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={editForm.formState.isSubmitting}>Guardar Alterações</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeliveriesDialogOpen} onOpenChange={(isOpen) => {
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
                                            <TableCell>{format(new Date(delivery.date), "dd/MM/yyyy")}</TableCell>
                                            <TableCell className="text-center">{delivery.deliveriesUber || 0}</TableCell>
                                            <TableCell className="text-center">{delivery.deliveriesWedely || 0}</TableCell>
                                            <TableCell className="text-center font-bold">{total}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => handleRemoveDelivery(delivery.date)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
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
