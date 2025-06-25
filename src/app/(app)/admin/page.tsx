
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { teams as initialTeams, drivers, Team, competitions as initialCompetitions, Competition } from "@/lib/mock-data";
import { PlusCircle, MoreVertical, Users, Swords, Calendar as CalendarIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import type { DateRange } from "react-day-picker";


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
});


const TeamsManagement = () => {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [isAddTeamDialogOpen, setIsAddTeamDialogOpen] = useState(false);
  
  const sortedTeams = [...teams].sort((a, b) => a.id - b.id);
  
  const getTeamMemberCount = (teamId: number) => {
    return drivers.filter(driver => driver.teamId === teamId).length;
  }

  const handleRowClick = (teamId: number) => {
    router.push(`/admin/teams/${teamId}`);
  }
  
  const form = useForm<z.infer<typeof teamFormSchema>>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: "",
    },
  });
  
  function onSubmit(values: z.infer<typeof teamFormSchema>) {
    const newTeamId = teams.length > 0 ? Math.max(...teams.map(t => t.id)) + 1 : 1;
    const newTeam: Team = {
      id: newTeamId,
      name: values.name,
    };
    
    initialTeams.push(newTeam);
    setTeams([...initialTeams]);
    
    form.reset();
    setIsAddTeamDialogOpen(false);
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
                <DialogFooter>
                  <Button variant="outline" type="button" onClick={() => setIsAddTeamDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit">Adicionar Equipa</Button>
                </DialogFooter>
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
                <TableHead>ID</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Membros</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTeams.map((team) => (
                <TableRow key={team.id} onClick={() => handleRowClick(team.id)} className="cursor-pointer">
                  <TableCell className="font-medium">{team.id}</TableCell>
                  <TableCell>{team.name}</TableCell>
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

const CompetitionsManagement = () => {
  const [competitions, setCompetitions] = useState<Competition[]>(initialCompetitions);
  const [isAddCompetitionDialogOpen, setIsAddCompetitionDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof competitionFormSchema>>({
    resolver: zodResolver(competitionFormSchema),
    defaultValues: {
      name: "",
      description: "",
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

  const onSubmit: SubmitHandler<z.infer<typeof competitionFormSchema>> = (values) => {
    const newCompetitionId = competitions.length > 0 ? Math.max(...competitions.map(c => c.id)) + 1 : 1;
    const newCompetition: Competition = {
      id: newCompetitionId,
      name: values.name,
      description: values.description || "",
      metric: values.metric,
      participants: values.teamId === 'all' ? 'all' : [Number(values.teamId)],
      startDate: values.dateRange.from.toISOString(),
      endDate: values.dateRange.to.toISOString(),
      // Status will be derived dynamically, so no need to set it here
    };
    
    initialCompetitions.push(newCompetition);
    setCompetitions([...initialCompetitions]);
    
    form.reset();
    setIsAddCompetitionDialogOpen(false);
  };
  
  const metricLabels = {
    deliveries: "Total de Entregas",
    safety: "Pontuação de Segurança",
    efficiency: "Eficiência",
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
            <DialogContent className="sm:max-w-lg">
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
                        <div className="grid grid-cols-2 gap-4">
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
                                            {initialTeams.map(team => <SelectItem key={team.id} value={String(team.id)}>{team.name}</SelectItem>)}
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
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setIsAddCompetitionDialogOpen(false)}>Cancelar</Button>
                            <Button type="submit">Criar Competição</Button>
                        </DialogFooter>
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
              {competitions.map((comp) => {
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
                          <DropdownMenuItem>Ver Leaderboard</DropdownMenuItem>
                          <DropdownMenuItem>Editar</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Remover</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};


export default function AdminPage() {
  return (
    <>
        <h2 className="font-headline text-2xl font-bold">Painel de Admin</h2>
        <Tabs defaultValue="teams" className="space-y-4">
            <TabsList>
                <TabsTrigger value="teams"><Users className="mr-2 h-4 w-4" /> Equipas</TabsTrigger>
                <TabsTrigger value="competitions"><Swords className="mr-2 h-4 w-4" /> Competições</TabsTrigger>
            </TabsList>
            <TabsContent value="teams">
                <TeamsManagement />
            </TabsContent>
            <TabsContent value="competitions">
                <CompetitionsManagement />
            </TabsContent>
        </Tabs>
    </>
  );
}
