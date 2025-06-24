"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Car } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { drivers } from "@/lib/mock-data";

export default function LoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [driverId, setDriverId] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // In a real app, this would be an API call to a secure endpoint
        setTimeout(() => {
            const driver = drivers.find(d => d.driverLoginId === driverId && d.password === password);

            if (driver) {
                // For this demo, we're using localStorage to persist login state.
                localStorage.setItem('loggedInDriverId', driver.driverLoginId);
                router.push('/dashboard');
            } else {
                toast({
                    variant: "destructive",
                    title: "Login falhou",
                    description: "ID do motorista ou senha incorretos.",
                });
                setIsLoading(false);
            }
        }, 500); // Simulate network delay
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <main className="w-full max-w-md">
                <Card className="w-full">
                    <form onSubmit={handleLogin}>
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
                                <Input 
                                    id="driverId" 
                                    type="text" 
                                    placeholder="Seu ID de motorista" 
                                    value={driverId}
                                    onChange={(e) => setDriverId(e.target.value)}
                                    required
                                    autoComplete="username"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Senha</Label>
                                <Input 
                                    id="password" 
                                    type="password" 
                                    placeholder="Sua senha" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? "A entrar..." : "Entrar"}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
                <p className="mt-4 text-center text-xs text-muted-foreground">
                    Empresa de Frotas &copy; {new Date().getFullYear()}
                </p>
            </main>
        </div>
    );
}
