"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { teams as initialTeams, drivers, Team } from "@/lib/mock-data";
import { PlusCircle, MoreVertical, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
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


const formSchema = z.object({
  name: z.string().min(3, { message: "O nome da equipa deve ter pelo menos 3 caracteres." }),
});


export default function AdminPage() {
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
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });
  
  function onSubmit(values: z.infer<typeof formSchema>) {
    const newTeamId = teams.length > 0 ? Math.max(...teams.map(t => t.id)) + 1 : 1;
    const newTeam: Team = {
      id: newTeamId,
      name: values.name,
    };
    
    // In a real app this would be an API call.
    initialTeams.push(newTeam);
    setTeams([...initialTeams]);
    
    form.reset();
    setIsAddTeamDialogOpen(false);
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-headline text-2xl font-bold">Gestão de Equipas</h2>
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
    </>
  );
}
