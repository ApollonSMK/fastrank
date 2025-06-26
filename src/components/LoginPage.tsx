
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Car } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';


export default function LoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [driverId, setDriverId] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const q = query(
                collection(db, "drivers"), 
                where("driverLoginId", "==", driverId), 
                where("password", "==", password)
            );
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const driverDoc = querySnapshot.docs[0];
                // For this demo, we're using localStorage to persist login state.
                // In a real app, use Firebase Auth for proper session management.
                localStorage.setItem('loggedInDriverId', driverDoc.id);
                router.push('/dashboard');
            } else {
                toast({
                    variant: "destructive",
                    title: "Login falhou",
                    description: "ID do motorista ou senha incorretos.",
                });
                setIsLoading(false);
            }
        } catch (error) {
            console.error("Login error: ", error);
             toast({
                variant: "destructive",
                title: "Erro de Login",
                description: "Ocorreu um erro ao tentar fazer login. Verifique a consola.",
            });
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <main className="w-full max-w-md">
                <Card className="w-full border-primary/20 shadow-lg shadow-primary/10">
                    <form onSubmit={handleLogin}>
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40">
                                <Car className="h-8 w-8" />
                            </div>
                            <CardTitle className="font-headline text-3xl font-black text-primary text-glow">Fastrack Ranking</CardTitle>
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
                            <Button type="submit" className="w-full font-bold" disabled={isLoading}>
                                {isLoading ? "A entrar..." : "Entrar"}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
                <div className="mt-4 space-y-2 text-center text-xs text-muted-foreground">
                    <p>
                        Use <code className="font-semibold text-foreground">ana.silva</code> / <code className="font-semibold text-foreground">password123</code> para testar.
                    </p>
                    <p>
                        Empresa de Frotas &copy; {new Date().getFullYear()}
                    </p>
                </div>
            </main>
        </div>
    );
}
