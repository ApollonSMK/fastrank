"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Car, Eye, EyeOff } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { signInUser } from '@/lib/data-service';
import InstallPwaPrompt from '@/components/InstallPwaPrompt';

export default function LoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // Firebase Auth handles session persistence. The 'remember me'
            // checkbox is mainly for UX, as the default is to remember the session.
            await signInUser(email, password);
            router.push('/dashboard');
        } catch (error: any) {
             toast({
                variant: "destructive",
                title: "Login falhou",
                description: "Email ou senha incorretos. Por favor, tente novamente.",
            });
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <InstallPwaPrompt />
            <main className="w-full max-w-md">
                 <Card className="w-full border-primary/20 shadow-lg shadow-primary/10">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40">
                            <Car className="h-8 w-8" />
                        </div>
                        <CardTitle className="font-headline text-3xl font-black text-primary text-glow">Fastrack</CardTitle>
                        <CardDescription>Bem-vindo! Faça login para começar.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleLogin}>
                        <CardContent className="space-y-4 px-6 pt-2">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input 
                                    id="email" 
                                    type="email" 
                                    placeholder="o.seu@email.com" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Senha</Label>
                                <div className="relative">
                                    <Input 
                                        id="password" 
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Sua senha" 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoComplete="current-password"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff /> : <Eye />}
                                        <span className="sr-only">{showPassword ? "Esconder senha" : "Mostrar senha"}</span>
                                    </Button>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="remember-me"
                                    checked={rememberMe}
                                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                                />
                                <Label htmlFor="remember-me" className="text-sm font-normal text-muted-foreground">
                                    Lembrar de mim
                                </Label>
                            </div>
                        </CardContent>
                        <CardFooter className="px-6 pb-6">
                            <Button type="submit" className="w-full font-bold" disabled={isLoading}>
                                {isLoading ? "A entrar..." : "Entrar"}
                            </Button>
                        </CardFooter>
                    </form>
                 </Card>
                <div className="mt-4 space-y-2 text-center text-xs text-muted-foreground">
                    <p>
                        Fastrack Delivery Copyrights &copy; {new Date().getFullYear()}
                    </p>
                </div>
            </main>
        </div>
    );
}
