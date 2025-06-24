"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { teams, drivers } from "@/lib/mock-data";
import { PlusCircle, MoreVertical, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent } from "@/components/ui/card";


export default function AdminPage() {
  const router = useRouter();
  const sortedTeams = [...teams].sort((a, b) => a.id - b.id);
  
  const getTeamMemberCount = (teamId: number) => {
    return drivers.filter(driver => driver.teamId === teamId).length;
  }

  const handleRowClick = (teamId: number) => {
    router.push(`/admin/teams/${teamId}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-headline text-2xl font-bold">Gestão de Equipas</h2>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Equipa
        </Button>
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
