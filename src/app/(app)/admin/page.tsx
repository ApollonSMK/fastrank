
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Team, Competition, Driver, FleetChangeLog, VehicleHistoryEntry } from "@/lib/data-types";
import { getAllTeams, addTeam, getAllCompetitions, addCompetition, getAllDrivers, deleteCompetition, getFleetChangeLog, updateDriver, getDriver, deleteDriver, addFreeVehicle, addFleetChangeLog } from "@/lib/data-service";
import { PlusCircle, MoreVertical, Users, Swords, Calendar as CalendarIcon, BarChart2 as BarChart, Trash2, Car, FileDown, Contact, History, Edit, Replace } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter as DialogFormFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";


const teamFormSchema = z.object({
  name: z.string().min(3, { message: "O nome da equipa deve ter pelo menos 3 caracteres." }),
});

const competitionFormSchema = z.object({
  name: z.string().min(3, { message: "O nome da competição deve ter pelo menos 3 caracteres." }),
  description: z.string().optional(),
  metric: z.enum(['deliveries', 'safety', 'efficiency'], { required_error: "A métrica é obrigatória." }),
  teamId: z.string({ required_error: "É obrigatório selecionar os participantes." }),
  dateRange: z.object({
    from: z.date({ required_error: "A data de início é obrigatória." }),
    to: z.date({ required_error: "A data de fim é obrigatória." }),
  }),
  rewardType: z.enum(['points', 'money'], { required_error: "O tipo de prémio é obrigatório."}),
  rewardAmount: z.coerce.number().min(1, { message: "O valor do prémio deve ser positivo."}),
  enrollmentCost: z.coerce.number().min(0, { message: "O custo de inscrição não pode ser negativo." }),
});

const editDriverFormSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  vehicleId: z.string().min(1, { message: "É obrigatório selecionar um veículo." }),
  teamId: z.string().optional(),
});
type EditDriverFormValues = z.infer<typeof editDriverFormSchema>;

const addVehicleFormSchema = z.object({
    licensePlate: z.string().min(1, { message: "A matrícula é obrigatória." }),
    vehicleModel: z.string().min(2, { message: 'O modelo deve ter pelo menos 2 caracteres.' }),
});
type AddVehicleFormValues = z.infer<typeof addVehicleFormSchema>;

const substituteVehicleFormSchema = z.object({
    licensePlate: z.string().min(1, { message: "A matrícula é obrigatória." }),
    vehicleModel: z.string().min(2, { message: 'O modelo deve ter pelo menos 2 caracteres.' }),
});
type SubstituteVehicleFormValues = z.infer<typeof substituteVehicleFormSchema>;


const StatisticsManagement = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Estatísticas Gerais</CardTitle>
        <p className="text-sm text-muted-foreground pt-1.5">Visão geral do desempenho da frota.</p>
      </CardHeader>
      <CardContent>
        <p className="text-center text-muted-foreground py-8">O conteúdo das estatísticas será adicionado aqui em breve.</p>
      </CardContent>
    </Card>
  );
};

const DriversManagement = () => {
    const router = useRouter();
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [freeVehicles, setFreeVehicles] = useState<Driver[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [driverToEdit, setDriverToEdit] = useState<Driver | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [driverToDelete, setDriverToDelete] = useState<Driver | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        const [driversData, teamsData] = await Promise.all([
            getAllDrivers(),
            getAllTeams(),
        ]);
        const activeDrivers = driversData.filter(d => d.name !== '[VEÍCULO LIVRE]' && d.email !== 'info@fastrack.lu');
        const freeVehiclesData = driversData.filter(d => d.name === '[VEÍCULO LIVRE]');

        setDrivers(activeDrivers.sort((a,b) => a.name.localeCompare(b.name)));
        setFreeVehicles(freeVehiclesData);
        setTeams(teamsData);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const editForm = useForm<EditDriverFormValues>({
        resolver: zodResolver(editDriverFormSchema),
    });

    const openEditDialog = (driver: Driver) => {
        setDriverToEdit(driver);
        editForm.reset({
            name: driver.name,
            vehicleId: driver.id,
            teamId: driver.teamId || 'none',
        });
        setIsEditDialogOpen(true);
    };
    
    const openDeleteDialog = (driver: Driver) => {
        setDriverToDelete(driver);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteDriver = async () => {
        if (!driverToDelete) return;
        await deleteDriver(driverToDelete.id);
        setIsDeleteDialogOpen(false);
        setDriverToDelete(null);
        fetchData();
    };
    
    const onUpdateSubmit: SubmitHandler<EditDriverFormValues> = async (data) => {
        if (!driverToEdit) return;

        const newTeamId = data.teamId === 'none' ? '' : data.teamId;

        // Case 1: Vehicle was NOT changed.
        if (data.vehicleId === driverToEdit.id) {
            const updates: Partial<Driver> = {};
            const changeDescriptions: string[] = [];
            
            const currentDriver = await getDriver(driverToEdit.id);
            if (!currentDriver) return;

            if (currentDriver.name !== data.name) {
                updates.name = data.name;
                changeDescriptions.push(`Nome alterado de "${currentDriver.name}" para "${data.name}".`);
            }
            if (currentDriver.teamId !== newTeamId) {
                updates.teamId = newTeamId;
                const currentTeamName = teams.find(t => t.id === currentDriver.teamId)?.name || 'Sem Equipa';
                const newTeamName = teams.find(t => t.id === newTeamId)?.name || 'Sem Equipa';
                changeDescriptions.push(`Equipa alterada de "${currentTeamName}" para "${newTeamName}".`);
            }

            if (Object.keys(updates).length > 0) {
                await updateDriver(driverToEdit.id, updates);
                if (changeDescriptions.length > 0) {
                     await addFleetChangeLog({
                        driverId: driverToEdit.id,
                        driverName: data.name,
                        changeDescription: changeDescriptions.join(' ')
                    });
                }
            }
        } else {
            // Case 2: Vehicle WAS changed. This requires swapping vehicle data, not driver data.
            const driverDoc = await getDriver(driverToEdit.id);
            const freeVehicleDoc = await getDriver(data.vehicleId);

            if (!driverDoc || !freeVehicleDoc || freeVehicleDoc.name !== '[VEÍCULO LIVRE]') {
                console.error("Invalid vehicle swap operation.");
                return;
            }
            
            const driverUpdates: Partial<Driver> = {
                name: data.name,
                teamId: newTeamId,
                licensePlate: freeVehicleDoc.licensePlate,
                vehicleModel: freeVehicleDoc.vehicleModel,
                licensePlateHistory: [
                    ...(driverDoc.licensePlateHistory || []).map(entry => 
                        entry.unassignedDate === null ? { ...entry, unassignedDate: new Date().toISOString() } : entry
                    ),
                    {
                        licensePlate: freeVehicleDoc.licensePlate,
                        vehicleModel: freeVehicleDoc.vehicleModel,
                        assignedDate: new Date().toISOString(),
                        unassignedDate: null,
                    }
                ],
            };

            const freeVehicleUpdates: Partial<Driver> = {
                licensePlate: driverDoc.licensePlate,
                vehicleModel: driverDoc.vehicleModel,
                licensePlateHistory: [
                    ...(freeVehicleDoc.licensePlateHistory || []).map(entry => 
                        entry.unassignedDate === null ? { ...entry, unassignedDate: new Date().toISOString() } : entry
                    ),
                    {
                        licensePlate: driverDoc.licensePlate,
                        vehicleModel: driverDoc.vehicleModel,
                        assignedDate: new Date().toISOString(),
                        unassignedDate: null,
                    }
                ],
            };
            
            await updateDriver(driverDoc.id, driverUpdates);
            await updateDriver(freeVehicleDoc.id, freeVehicleUpdates);

            await addFleetChangeLog({
                driverId: driverDoc.id,
                driverName: data.name,
                changeDescription: `Motorista ${data.name} transferido do veículo ${driverDoc.licensePlate} para ${freeVehicleDoc.licensePlate}.`
            });
        }

        setIsEditDialogOpen(false);
        setDriverToEdit(null);
        fetchData();
    };

    const teamsMap = new Map(teams.map(t => [t.id, t.name]));

    return (
        <>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Todos os Motoristas</span>
                     {!isLoading && <Badge variant="outline">{drivers.length} Total</Badge>}
                </CardTitle>
                <p className="text-sm text-muted-foreground pt-1.5">Consulte e gira todos os motoristas registados.</p>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Equipa</TableHead>
                            <TableHead>Matrícula</TableHead>
                            <TableHead>Modelo do Veículo</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         {isLoading ? (
                            [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : (
                            drivers.map((driver) => (
                                <TableRow key={driver.id}>
                                    <TableCell className="font-medium">{driver.name}</TableCell>
                                    <TableCell>{teamsMap.get(driver.teamId || '') || 'Sem Equipa'}</TableCell>
                                    <TableCell>{driver.licensePlate}</TableCell>
                                    <TableCell>{driver.vehicleModel}</TableCell>
                                    <TableCell className="text-right">
                                         <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => router.push(`/admin/drivers/${driver.id}`)}>
                                                    <History className="mr-2 h-4 w-4" />
                                                    Ver Histórico
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => openEditDialog(driver)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                className="text-destructive" 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    openDeleteDialog(driver);
                                                }}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Remover
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        
        <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => { setIsEditDialogOpen(isOpen); if (!isOpen) setDriverToEdit(null); }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Motorista: {driverToEdit?.name}</DialogTitle>
                </DialogHeader>
                <Form {...editForm}>
                    <form onSubmit={editForm.handleSubmit(onUpdateSubmit)} className="space-y-4 py-4">
                        <FormField control={editForm.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nome</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={editForm.control} name="vehicleId" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Veículo</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Selecione um veículo" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {driverToEdit && <SelectItem key={driverToEdit.id} value={driverToEdit.id}>{`${driverToEdit.licensePlate} - ${driverToEdit.vehicleModel} (Atual)`}</SelectItem>}
                                        {freeVehicles.map(v => <SelectItem key={v.id} value={v.id}>{`${v.licensePlate} - ${v.vehicleModel}`}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                         <FormField control={editForm.control} name="teamId" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Equipa</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione a equipa" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="none">Sem Equipa</SelectItem>
                                        {teams.map(team => <SelectItem key={team.id} value={String(team.id)}>{team.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <DialogFormFooter>
                            <Button variant="outline" type="button" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
                            <Button type="submit">Guardar Alterações</Button>
                        </DialogFormFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
        
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Tem a certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação irá remover o motorista "{driverToDelete?.name}". O veículo associado ({driverToDelete?.licensePlate}) ficará livre.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDriverToDelete(null)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteDriver}>Confirmar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    );
};


const VehiclesManagement = () => {
  const [vehicles, setVehicles] = useState<Driver[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [changeLog, setChangeLog] = useState<FleetChangeLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddVehicleDialogOpen, setIsAddVehicleDialogOpen] = useState(false);
  const [isSubstituteDialogOpen, setIsSubstituteDialogOpen] = useState(false);
  const [vehicleForSubstitute, setVehicleForSubstitute] = useState<Driver | null>(null);
  
  const [vehicleToDelete, setVehicleToDelete] = useState<Driver | null>(null);
  const [isDeleteVehicleDialogOpen, setIsDeleteVehicleDialogOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const [driversData, logData, teamsData] = await Promise.all([
      getAllDrivers(),
      getFleetChangeLog(),
      getAllTeams(),
    ]);
    
    const allVehicles = driversData.filter(d => d.email !== 'info@fastrack.lu');
    allVehicles.sort((a, b) => a.licensePlate.localeCompare(b.licensePlate));

    setVehicles(allVehicles);
    setTeams(teamsData);
    setChangeLog(logData);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addVehicleForm = useForm<AddVehicleFormValues>({
    resolver: zodResolver(addVehicleFormSchema),
    defaultValues: {
        licensePlate: '',
        vehicleModel: '',
    },
  });
  
  const substituteVehicleForm = useForm<SubstituteVehicleFormValues>({
    resolver: zodResolver(substituteVehicleFormSchema),
  });

  const onAddVehicleSubmit: SubmitHandler<AddVehicleFormValues> = async (data) => {
    const plateExists = vehicles.some(v => v.licensePlate.toUpperCase() === data.licensePlate.toUpperCase());
    if (plateExists) {
        addVehicleForm.setError("licensePlate", {
            type: "manual",
            message: "Esta matrícula já existe na frota."
        });
        return;
    }

    await addFreeVehicle(data);
    setIsAddVehicleDialogOpen(false);
    addVehicleForm.reset();
    fetchData();
  };

    const openSubstituteDialog = (vehicle: Driver) => {
        setVehicleForSubstitute(vehicle);
        substituteVehicleForm.reset({
            licensePlate: vehicle.substituteVehicle?.licensePlate || '',
            vehicleModel: vehicle.substituteVehicle?.vehicleModel || '',
        });
        setIsSubstituteDialogOpen(true);
    };

    const onAddSubstituteSubmit: SubmitHandler<SubstituteVehicleFormValues> = async (data) => {
        if (!vehicleForSubstitute) return;

        await updateDriver(vehicleForSubstitute.id, { substituteVehicle: data });
        
        const logDescription = vehicleForSubstitute.substituteVehicle 
            ? `Substituição para o veículo ${vehicleForSubstitute.licensePlate} alterada para ${data.licensePlate} (${data.vehicleModel}).`
            : `Veículo de substituição ${data.licensePlate} (${data.vehicleModel}) adicionado para ${vehicleForSubstitute.licensePlate}.`

        await addFleetChangeLog({
            driverId: vehicleForSubstitute.id,
            driverName: vehicleForSubstitute.name,
            changeDescription: logDescription
        });
        
        setIsSubstituteDialogOpen(false);
        setVehicleForSubstitute(null);
        fetchData();
    };

    const handleRemoveSubstitute = async () => {
        if (!vehicleForSubstitute || !vehicleForSubstitute.substituteVehicle) return;

        await updateDriver(vehicleForSubstitute.id, { substituteVehicle: null });
        
        await addFleetChangeLog({
            driverId: vehicleForSubstitute.id,
            driverName: vehicleForSubstitute.name,
            changeDescription: `Veículo de substituição ${vehicleForSubstitute.substituteVehicle.licensePlate} removido do veículo ${vehicleForSubstitute.licensePlate}.`
        });

        setIsSubstituteDialogOpen(false);
        setVehicleForSubstitute(null);
        fetchData();
    };

    const openDeleteVehicleDialog = (vehicle: Driver) => {
        setVehicleToDelete(vehicle);
        setIsDeleteVehicleDialogOpen(true);
    };

    const handleDeleteVehicle = async () => {
        if (!vehicleToDelete) return;
        await deleteDriver(vehicleToDelete.id);
        setIsDeleteVehicleDialogOpen(false);
        setVehicleToDelete(null);
        fetchData();
    };

  const handleExportFleetPDF = () => {
    const doc = new jsPDF();
    const today = format(new Date(), "dd/MM/yyyy");
    const teamsMap = new Map(teams.map(t => [t.id, t.name]));
    
    doc.text(`Lista de Veículos e Motoristas - ${today}`, 14, 16);

    const sortedVehicles = [...vehicles].sort((a, b) => {
        const teamA = teamsMap.get(a.teamId || '') || 'zzz'; // place no team at the end
        const teamB = teamsMap.get(b.teamId || '') || 'zzz';
        if (teamA < teamB) return -1;
        if (teamA > teamB) return 1;
        return a.licensePlate.localeCompare(b.licensePlate);
    });

    const bodyData: (string | { content: string, styles: { fontStyle: 'italic', textColor: number[] } })[][] = [];
    sortedVehicles.forEach(vehicle => {
        const isAssigned = vehicle.name !== '[VEÍCULO LIVRE]';
        const driverName = isAssigned ? vehicle.name : 'Livre';
        const teamName = isAssigned ? (teamsMap.get(vehicle.teamId || '') || 'Sem Equipa') : 'N/A';
        bodyData.push([
            vehicle.licensePlate,
            vehicle.vehicleModel,
            driverName,
            teamName
        ]);
        if (vehicle.substituteVehicle) {
            bodyData.push([
                { content: `  ↳ ${vehicle.substituteVehicle.licensePlate}`, styles: { fontStyle: 'italic', textColor: [100, 100, 100] } },
                { content: vehicle.substituteVehicle.vehicleModel, styles: { fontStyle: 'italic', textColor: [100, 100, 100] } },
                { content: 'Substituição', styles: { fontStyle: 'italic', textColor: [100, 100, 100] } },
                ''
            ]);
        }
    });


    (autoTable as any)(doc, {
        startY: 20,
        head: [['Matrícula', 'Modelo do Veículo', 'Motorista', 'Equipa']],
        body: bodyData,
        headStyles: { fillColor: [45, 100, 51] },
        theme: 'striped',
    });

    doc.save(`lista_veiculos_${today.replace(/\//g, '-')}.pdf`);
  };

  const handleExportHistoryPDF = () => {
    const doc = new jsPDF();
    const today = format(new Date(), "dd/MM/yyyy");
    
    doc.text(`Histórico de Alterações da Frota - ${today}`, 14, 16);

    (autoTable as any)(doc, {
        startY: 20,
        head: [['Data', 'Motorista', 'Descrição da Alteração']],
        body: changeLog.map(log => [
            format(new Date(log.date), "dd/MM/yyyy HH:mm"),
            log.driverName,
            log.changeDescription
        ]),
        headStyles: { fillColor: [45, 100, 51] },
        theme: 'striped',
    });

    doc.save(`historico_frota_${today.replace(/\//g, '-')}.pdf`);
  };

  const teamsMap = new Map(teams.map(t => [t.id, t.name]));
  const sortedVehicles = [...vehicles].sort((a, b) => {
        const teamA = teamsMap.get(a.teamId || '') || 'zzz';
        const teamB = teamsMap.get(b.teamId || '') || 'zzz';
        if (teamA < teamB) return -1;
        if (teamA > teamB) return 1;
        return a.licensePlate.localeCompare(b.licensePlate);
    });


  return (
    <>
    <Card>
        <CardHeader>
            <CardTitle>Frota de Veículos</CardTitle>
            <p className="text-sm text-muted-foreground pt-1.5">Consulte a frota atual e o histórico de alterações.</p>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="current">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="current">Frota Atual</TabsTrigger>
                    <TabsTrigger value="history">Histórico de Alterações</TabsTrigger>
                </TabsList>
                <TabsContent value="current" className="mt-4">
                    <div className="flex justify-end mb-4 gap-2">
                        <Dialog open={isAddVehicleDialogOpen} onOpenChange={setIsAddVehicleDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Adicionar Veículo Livre
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Adicionar Veículo Livre</DialogTitle>
                                    <DialogDescription>
                                        Cadastre um novo veículo na frota. Ele ficará disponível para ser associado a um novo motorista.
                                    </DialogDescription>
                                </DialogHeader>
                                <Form {...addVehicleForm}>
                                    <form onSubmit={addVehicleForm.handleSubmit(onAddVehicleSubmit)} className="space-y-4 py-4">
                                        <FormField
                                            control={addVehicleForm.control}
                                            name="licensePlate"
                                            render={({ field }) => (
                                                <FormItem>
                                                <FormLabel>Matrícula</FormLabel>
                                                <FormControl><Input placeholder="Ex: AB-12-CD" {...field} /></FormControl>
                                                <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={addVehicleForm.control}
                                            name="vehicleModel"
                                            render={({ field }) => (
                                                <FormItem>
                                                <FormLabel>Modelo do Veículo</FormLabel>
                                                <FormControl><Input placeholder="Ex: Renault Clio" {...field} /></FormControl>
                                                <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <DialogFormFooter>
                                            <Button variant="outline" type="button" onClick={() => setIsAddVehicleDialogOpen(false)}>Cancelar</Button>
                                            <Button type="submit">Adicionar Veículo</Button>
                                        </DialogFormFooter>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                        <Button onClick={handleExportFleetPDF} disabled={isLoading || vehicles.length === 0}>
                            <FileDown className="mr-2 h-4 w-4" />
                            Exportar Frota
                        </Button>
                    </div>
                     {/* Mobile View: List of Cards */}
                    <div className="space-y-4 md:hidden">
                        {isLoading ? (
                            [...Array(3)].map((_, i) => (
                                <Card key={i}>
                                    <CardHeader className="flex flex-row items-start justify-between">
                                        <div>
                                            <Skeleton className="h-6 w-24 mb-1" />
                                            <Skeleton className="h-4 w-32" />
                                        </div>
                                        <Skeleton className="h-8 w-8" />
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex justify-between">
                                            <Skeleton className="h-4 w-16" />
                                            <Skeleton className="h-4 w-24" />
                                        </div>
                                        <div className="flex justify-between">
                                            <Skeleton className="h-4 w-12" />
                                            <Skeleton className="h-4 w-20" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            sortedVehicles.map((vehicle) => {
                                const isAssigned = vehicle.name !== '[VEÍCULO LIVRE]';
                                const driverName = isAssigned ? vehicle.name : 'Livre';
                                const teamName = isAssigned ? (teamsMap.get(vehicle.teamId || '') || 'Sem Equipa') : 'N/A';
                                return (
                                    <Card key={vehicle.id}>
                                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                                            <div>
                                                <CardTitle>{vehicle.licensePlate}</CardTitle>
                                                <CardDescription>{vehicle.vehicleModel}</CardDescription>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => openSubstituteDialog(vehicle)}>
                                                        <Replace className="mr-2 h-4 w-4" />
                                                        Gerir Substituição
                                                    </DropdownMenuItem>
                                                    {vehicle.name === '[VEÍCULO LIVRE]' && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="text-destructive"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    openDeleteVehicleDialog(vehicle);
                                                                }}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Remover Veículo
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </CardHeader>
                                        <CardContent className="space-y-2 text-sm">
                                             <div className="flex justify-between">
                                                <span className="text-muted-foreground">Motorista</span>
                                                <span className="font-medium">{driverName}</span>
                                            </div>
                                             <div className="flex justify-between">
                                                <span className="text-muted-foreground">Equipa</span>
                                                <span className="font-medium">{teamName}</span>
                                            </div>
                                        </CardContent>
                                        {vehicle.substituteVehicle && (
                                            <CardFooter className="pt-4 mt-4 border-t bg-muted/20">
                                                <div className="flex w-full items-start gap-3 text-amber-500">
                                                    <Replace className="h-5 w-5 mt-0.5 shrink-0" />
                                                    <div>
                                                        <p className="font-semibold">Veículo de Substituição</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {vehicle.substituteVehicle.licensePlate} - {vehicle.substituteVehicle.vehicleModel}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardFooter>
                                        )}
                                    </Card>
                                )
                            })
                        )}
                    </div>

                    {/* Desktop View: Table */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>Matrícula</TableHead>
                                <TableHead>Modelo do Veículo</TableHead>
                                <TableHead>Motorista</TableHead>
                                <TableHead>Equipa</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    [...Array(5)].map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                                            <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    sortedVehicles.map((vehicle) => {
                                        const isAssigned = vehicle.name !== '[VEÍCULO LIVRE]';
                                        const driverName = isAssigned ? vehicle.name : 'Livre';
                                        const teamName = isAssigned ? (teamsMap.get(vehicle.teamId || '') || 'Sem Equipa') : 'N/A';
                                        return (
                                            <React.Fragment key={vehicle.id}>
                                            <TableRow>
                                                <TableCell>{vehicle.licensePlate}</TableCell>
                                                <TableCell>{vehicle.vehicleModel}</TableCell>
                                                <TableCell className="font-medium">{driverName}</TableCell>
                                                <TableCell>{teamName}</TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => openSubstituteDialog(vehicle)}>
                                                                <Replace className="mr-2 h-4 w-4" />
                                                                Gerir Substituição
                                                            </DropdownMenuItem>
                                                            {vehicle.name === '[VEÍCULO LIVRE]' && (
                                                                <>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        className="text-destructive"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            openDeleteVehicleDialog(vehicle);
                                                                        }}
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        Remover Veículo
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                            {vehicle.substituteVehicle && (
                                                <TableRow className="bg-muted/20 hover:bg-muted/40">
                                                    <TableCell colSpan={5} className="py-2 px-4">
                                                        <div className="flex items-center gap-4 pl-4 border-l-4 border-amber-500">
                                                            <Replace className="h-5 w-5 text-amber-500" />
                                                            <div>
                                                                <p className="font-semibold text-amber-500">Veículo de Substituição</p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {vehicle.substituteVehicle.licensePlate} - {vehicle.substituteVehicle.vehicleModel}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            </React.Fragment>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
                <TabsContent value="history" className="mt-4">
                    <div className="flex justify-end mb-4">
                        <Button onClick={handleExportHistoryPDF} disabled={isLoading || changeLog.length === 0}>
                            <FileDown className="mr-2 h-4 w-4" />
                            Exportar Histórico para PDF
                        </Button>
                    </div>

                     {/* Mobile History View */}
                    <div className="space-y-4 md:hidden">
                         {isLoading ? (
                            [...Array(3)].map((_, i) => (
                                 <Card key={i}>
                                     <CardContent className="p-4 space-y-2">
                                        <div className="flex justify-between">
                                            <Skeleton className="h-5 w-32" />
                                            <Skeleton className="h-4 w-24" />
                                        </div>
                                         <Skeleton className="h-4 w-full" />
                                     </CardContent>
                                 </Card>
                            ))
                         ) : (
                            changeLog.map((log) => (
                                <Card key={log.id}>
                                    <CardContent className="p-4 space-y-2">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-medium">{log.driverName}</span>
                                            <span className="text-xs text-muted-foreground">{format(new Date(log.date), "dd/MM/yy HH:mm")}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{log.changeDescription}</p>
                                    </CardContent>
                                </Card>
                            ))
                         )}
                    </div>

                    {/* Desktop History View */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Motorista</TableHead>
                                    <TableHead>Descrição</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    [...Array(5)].map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    changeLog.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell>{format(new Date(log.date), "dd/MM/yyyy HH:mm")}</TableCell>
                                            <TableCell className="font-medium">{log.driverName}</TableCell>
                                            <TableCell>{log.changeDescription}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>
        </CardContent>
    </Card>

    <Dialog open={isSubstituteDialogOpen} onOpenChange={setIsSubstituteDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Gerir Veículo de Substituição</DialogTitle>
                <DialogDescription>
                    Adicione ou remova um veículo temporário para {vehicleForSubstitute?.licensePlate}.
                </DialogDescription>
            </DialogHeader>
            <Form {...substituteVehicleForm}>
                <form onSubmit={substituteVehicleForm.handleSubmit(onAddSubstituteSubmit)} className="space-y-4 py-4">
                    <FormField
                        control={substituteVehicleForm.control}
                        name="licensePlate"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Matrícula da Substituição</FormLabel>
                            <FormControl><Input placeholder="Ex: AB-12-CD" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={substituteVehicleForm.control}
                        name="vehicleModel"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Modelo da Substituição</FormLabel>
                            <FormControl><Input placeholder="Ex: Renault Clio" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <DialogFormFooter className="grid grid-cols-2 gap-2 pt-4">
                        {vehicleForSubstitute?.substituteVehicle && (
                            <Button variant="destructive" type="button" onClick={handleRemoveSubstitute}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remover Substituição
                            </Button>
                        )}
                        <Button type="submit" className={!vehicleForSubstitute?.substituteVehicle ? "col-span-2" : ""}>
                            Guardar
                        </Button>
                    </DialogFormFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
    
    <AlertDialog open={isDeleteVehicleDialogOpen} onOpenChange={setIsDeleteVehicleDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Tem a certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta ação irá remover permanentemente o veículo com matrícula "{vehicleToDelete?.licensePlate}". Esta ação não pode ser desfeita.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setVehicleToDelete(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteVehicle}>Confirmar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
};


const TeamsManagement = () => {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isAddTeamDialogOpen, setIsAddTeamDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const [teamsData, driversData] = await Promise.all([getAllTeams(), getAllDrivers()]);
    setTeams(teamsData.sort((a,b) => (a.name > b.name ? 1 : -1)));
    setDrivers(driversData.filter(d => d.email !== 'info@fastrack.lu'));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getTeamMemberCount = (teamId: string) => {
    return drivers.filter(driver => driver.teamId === teamId && driver.name !== '[VEÍCULO LIVRE]').length;
  }

  const handleRowClick = (teamId: string) => {
    router.push(`/admin/teams/${teamId}`);
  }
  
  const form = useForm<z.infer<typeof teamFormSchema>>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: "",
    },
  });
  
  async function onSubmit(values: z.infer<typeof teamFormSchema>) {
    await addTeam({ name: values.name });
    form.reset();
    setIsAddTeamDialogOpen(false);
    fetchData();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-headline text-xl font-bold">Gestão de Equipas</h3>
        <Dialog open={isAddTeamDialogOpen} onOpenChange={setIsAddTeamDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Equipa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Nova Equipa</DialogTitle>
              <DialogDescription>
                Crie uma nova equipa para organizar os seus motoristas.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Equipa</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Equipa Alfa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFormFooter>
                  <Button variant="outline" type="button" onClick={() => setIsAddTeamDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit">Adicionar Equipa</Button>
                </DialogFormFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Membros</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : (
                teams.map((team) => (
                  <TableRow key={team.id} onClick={() => handleRowClick(team.id)} className="cursor-pointer">
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground"/>
                          {getTeamMemberCount(team.id)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Editar</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Remover</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

const CompetitionsManagement = () => {
  const router = useRouter();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isAddCompetitionDialogOpen, setIsAddCompetitionDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [competitionToDelete, setCompetitionToDelete] = useState<Competition | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const [competitionsData, teamsData] = await Promise.all([getAllCompetitions(), getAllTeams()]);
    setCompetitions(competitionsData);
    setTeams(teamsData);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const form = useForm<z.infer<typeof competitionFormSchema>>({
    resolver: zodResolver(competitionFormSchema),
    defaultValues: {
      name: "",
      description: "",
      rewardType: "points",
      rewardAmount: 100,
      enrollmentCost: 10,
    },
  });

  const getCompetitionStatus = (comp: Competition): { status: 'Ativa' | 'Próxima' | 'Terminada'; color: string } => {
    const now = new Date();
    const start = new Date(comp.startDate);
    const end = new Date(comp.endDate);
    if (now < start) return { status: 'Próxima', color: 'bg-blue-500' };
    if (now > end) return { status: 'Terminada', color: 'bg-muted-foreground' };
    return { status: 'Ativa', color: 'bg-green-500' };
  };

  const onSubmit: SubmitHandler<z.infer<typeof competitionFormSchema>> = async (values) => {
    const newCompetition: Omit<Competition, 'id'> = {
      name: values.name,
      description: values.description || "",
      metric: values.metric,
      participants: values.teamId === 'all' ? 'all' : [values.teamId],
      enrolledDriverIds: [],
      startDate: values.dateRange.from.toISOString(),
      endDate: values.dateRange.to.toISOString(),
      rewardType: values.rewardType,
      rewardAmount: values.rewardAmount,
      enrollmentCost: values.enrollmentCost,
    };
    
    await addCompetition(newCompetition);
    
    form.reset();
    setIsAddCompetitionDialogOpen(false);
    fetchData();
  };
  
  const metricLabels = {
    deliveries: "Total de Entregas",
    safety: "Pontuação de Segurança",
    efficiency: "Eficiência",
  };

  const openDeleteDialog = (competition: Competition) => {
    setCompetitionToDelete(competition);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteCompetition = async () => {
    if (!competitionToDelete) return;
    await deleteCompetition(competitionToDelete.id);
    setIsDeleteDialogOpen(false);
    setCompetitionToDelete(null);
    fetchData();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-headline text-xl font-bold">Gestão de Competições</h3>
        <Dialog open={isAddCompetitionDialogOpen} onOpenChange={setIsAddCompetitionDialogOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Criar Competição
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Nova Competição</DialogTitle>
                    <DialogDescription>
                        Crie uma nova competição para desafiar os seus motoristas.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nome da Competição</FormLabel>
                                <FormControl><Input placeholder="Ex: Corrida de Verão" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Descrição</FormLabel>
                                <FormControl><Textarea placeholder="Descreva as regras e prémios da competição" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField control={form.control} name="metric" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Métrica</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione a métrica" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="deliveries">Total de Entregas</SelectItem>
                                            <SelectItem value="safety">Pontuação de Segurança</SelectItem>
                                            <SelectItem value="efficiency">Eficiência</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                             <FormField control={form.control} name="teamId" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Participantes</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione os participantes" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="all">Todas as Equipas</SelectItem>
                                            {teams.map(team => <SelectItem key={team.id} value={String(team.id)}>{team.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <FormField control={form.control} name="dateRange" render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Período da Competição</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button id="date" variant={"outline"} className={cn("justify-start text-left font-normal", !field.value?.from && "text-muted-foreground")}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {field.value?.from ? (
                                                field.value.to ? (
                                                    <>{format(field.value.from, "LLL dd, y")} - {format(field.value.to, "LLL dd, y")}</>
                                                ) : (format(field.value.from, "LLL dd, y"))
                                            ) : (<span>Escolha um período</span>)}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            initialFocus
                                            mode="range"
                                            defaultMonth={field.value?.from}
                                            selected={{from: field.value?.from, to: field.value?.to}}
                                            onSelect={(range) => field.onChange(range)}
                                            numberOfMonths={2}
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="rewardType" render={({ field }) => (
                            <FormItem className="space-y-3">
                            <FormLabel>Tipo de Prémio</FormLabel>
                            <FormControl>
                                <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex space-x-4"
                                >
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                        <RadioGroupItem value="points" />
                                    </FormControl>
                                    <FormLabel className="font-normal">Pontos</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                        <RadioGroupItem value="money" />
                                    </FormControl>
                                    <FormLabel className="font-normal">Dinheiro</FormLabel>
                                </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField control={form.control} name="rewardAmount" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Valor do Prémio</FormLabel>
                                    <FormControl><Input type="number" placeholder="Ex: 100" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                             <FormField control={form.control} name="enrollmentCost" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Custo de Inscrição (Pontos)</FormLabel>
                                    <FormControl><Input type="number" placeholder="Ex: 10" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <DialogFormFooter>
                            <Button variant="outline" type="button" onClick={() => setIsAddCompetitionDialogOpen(false)}>Cancelar</Button>
                            <Button type="submit">Criar Competição</Button>
                        </DialogFormFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
      </div>

       <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Métrica</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                ))
              ) : (
                competitions.map((comp) => {
                  const {status, color} = getCompetitionStatus(comp);
                  return (
                    <TableRow key={comp.id}>
                      <TableCell className="font-medium">{comp.name}</TableCell>
                      <TableCell>{metricLabels[comp.metric]}</TableCell>
                      <TableCell>
                        {format(new Date(comp.startDate), "dd/MM/yy")} - {format(new Date(comp.endDate), "dd/MM/yy")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center gap-2">
                          <span className={cn("h-2 w-2 rounded-full", color)}></span>
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/competitions/${comp.id}`)}>Ver Leaderboard</DropdownMenuItem>
                            <DropdownMenuItem>Editar</DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive" 
                              onClick={(e) => { 
                                  e.stopPropagation(); 
                                  openDeleteDialog(comp);
                              }}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remover
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Tem a certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isto irá remover permanentemente a competição "{competitionToDelete?.name}".
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setCompetitionToDelete(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteCompetition}>Confirmar</AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
};


export default function AdminPage() {
  return (
    <>
        <h2 className="font-headline text-2xl font-bold">Painel de Admin</h2>
        <Tabs defaultValue="statistics" className="space-y-4">
            <TabsList className="w-full justify-start overflow-x-auto sm:w-auto sm:justify-center hide-scrollbar">
                <TabsTrigger value="statistics"><BarChart className="mr-2 h-4 w-4" /> Estatísticas</TabsTrigger>
                <TabsTrigger value="drivers"><Contact className="mr-2 h-4 w-4" /> Motoristas</TabsTrigger>
                <TabsTrigger value="teams"><Users className="mr-2 h-4 w-4" /> Equipas</TabsTrigger>
                <TabsTrigger value="competitions"><Swords className="mr-2 h-4 w-4" /> Competições</TabsTrigger>
                <TabsTrigger value="vehicles"><Car className="mr-2 h-4 w-4" /> Veículos</TabsTrigger>
            </TabsList>
            <TabsContent value="statistics">
                <StatisticsManagement />
            </TabsContent>
            <TabsContent value="drivers">
                <DriversManagement />
            </TabsContent>
            <TabsContent value="teams">
                <TeamsManagement />
            </TabsContent>
            <TabsContent value="competitions">
                <CompetitionsManagement />
            </TabsContent>
            <TabsContent value="vehicles">
                <VehiclesManagement />
            </TabsContent>
        </Tabs>
    </>
  );
}
