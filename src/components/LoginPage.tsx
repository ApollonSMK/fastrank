
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Car } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { addDriver } from '@/lib/data-service';
import type { Driver } from '@/lib/data-types';

export default function LoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    
    // Login State
    const [driverId, setDriverId] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Registration State
    const [regName, setRegName] = useState('');
    const [regDriverId, setRegDriverId] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [isRegLoading, setIsRegLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('login');


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

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsRegLoading(true);

        try {
            const q = query(collection(db, "drivers"), where("driverLoginId", "==", regDriverId));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                toast({
                    variant: "destructive",
                    title: "Registo Falhou",
                    description: "Este ID de motorista já existe.",
                });
                setIsRegLoading(false);
                return;
            }

            const newDriverData: Omit<Driver, 'id'> = {
                name: regName,
                driverLoginId: regDriverId,
                avatar: '/avatars/default.png',
                rank: 999,
                points: 0,
                moneyBalance: 0,
                trips: 0,
                safetyScore: 100,
                efficiency: 100,
                licensePlate: 'N/A',
                vehicleModel: 'N/A',
                teamId: '',
                dailyDeliveries: [],
                notifications: [],
                achievementIds: [],
            };

            await addDriver(newDriverData, regPassword);

            toast({
                title: "Conta Criada!",
                description: "Pode agora fazer login com as suas novas credenciais.",
            });
            
            setRegName('');
            setRegDriverId('');
            setRegPassword('');
            setActiveTab('login');

        } catch (error) {
            console.error("Registration error: ", error);
            toast({
                variant: "destructive",
                title: "Erro de Registo",
                description: "Ocorreu um erro ao tentar criar a conta.",
            });
        } finally {
            setIsRegLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <main className="w-full max-w-md">
                 <Card className="w-full border-primary/20 shadow-lg shadow-primary/10">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40">
                            <Car className="h-8 w-8" />
                        </div>
                        <CardTitle className="font-headline text-3xl font-black text-primary text-glow">Fastrack Ranking</CardTitle>
                        <CardDescription>Bem-vindo! Faça login ou crie uma conta para começar.</CardDescription>
                    </CardHeader>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full px-6 pb-6">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="login">Entrar</TabsTrigger>
                            <TabsTrigger value="register">Criar Conta</TabsTrigger>
                        </TabsList>
                        <TabsContent value="login">
                            <form onSubmit={handleLogin}>
                                <CardContent className="space-y-4 pt-6 px-0">
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
                                <CardFooter className="px-0 pb-0">
                                    <Button type="submit" className="w-full font-bold" disabled={isLoading}>
                                        {isLoading ? "A entrar..." : "Entrar"}
                                    </Button>
                                </CardFooter>
                            </form>
                        </TabsContent>
                        <TabsContent value="register">
                            <form onSubmit={handleRegister}>
                                <CardContent className="space-y-4 pt-6 px-0">
                                     <div className="space-y-2">
                                        <Label htmlFor="reg-name">Nome Completo</Label>
                                        <Input 
                                            id="reg-name" 
                                            type="text" 
                                            placeholder="O seu nome" 
                                            value={regName}
                                            onChange={(e) => setRegName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="reg-driverId">ID de Motorista</Label>
                                        <Input 
                                            id="reg-driverId" 
                                            type="text" 
                                            placeholder="Crie um ID único" 
                                            value={regDriverId}
                                            onChange={(e) => setRegDriverId(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="reg-password">Senha</Label>
                                        <Input 
                                            id="reg-password" 
                                            type="password" 
                                            placeholder="Crie uma senha segura" 
                                            value={regPassword}
                                            onChange={(e) => setRegPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter className="px-0 pb-0">
                                    <Button type="submit" className="w-full font-bold" disabled={isRegLoading}>
                                        {isRegLoading ? "A criar conta..." : "Criar Conta"}
                                    </Button>
                                </CardFooter>
                            </form>
                        </TabsContent>
                    </Tabs>
                 </Card>
                <div className="mt-4 space-y-2 text-center text-xs text-muted-foreground">
                    <p>
                        Empresa de Frotas &copy; {new Date().getFullYear()}
                    </p>
                </div>
            </main>
        </div>
    );
}
