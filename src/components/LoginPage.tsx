"use client";

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Car } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();

    const handleLogin = () => {
        // In a real app, you'd handle authentication here.
        // For this demo, we'll just navigate to the dashboard.
        router.push('/dashboard');
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <main className="w-full max-w-md">
                <Card className="w-full">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Car className="h-8 w-8" />
                        </div>
                        <CardTitle className="font-headline text-3xl">DriverRank Mobile</CardTitle>
                        <CardDescription>Bem-vindo! Faça login para continuar.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="driverId">ID do Motorista</Label>
                            <Input id="driverId" type="text" placeholder="Seu ID de motorista" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Senha</Label>
                            <Input id="password" type="password" placeholder="Sua senha" />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" onClick={handleLogin}>Entrar</Button>
                    </CardFooter>
                </Card>
                <p className="mt-4 text-center text-xs text-muted-foreground">
                    Empresa de Frotas &copy; {new Date().getFullYear()}
                </p>
            </main>
        </div>
    );
}
