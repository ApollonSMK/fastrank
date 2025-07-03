"use client"

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { Bell, Car, Download, Share2, PlusSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { getLoggedInDriver, updateDriver } from "@/lib/data-service"
import { Driver, Notification } from "@/lib/data-types"
import { formatDistanceToNow } from "date-fns";
import { pt } from 'date-fns/locale';

export default function Header() {
  const router = useRouter();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // PWA Install state
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstallModal, setShowIOSInstallModal] = useState(false);

  useEffect(() => {
    async function fetchDriver() {
        const loggedInDriver = await getLoggedInDriver();
        if (loggedInDriver) {
          setDriver(loggedInDriver);
          setNotifications(loggedInDriver.notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        }
    }
    fetchDriver();

    // PWA Install logic
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        setShowInstallButton(true);
      }
    };

    if (window.matchMedia('(display-mode: standalone)').matches) {
        return;
    }

    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);
    if (isIOSDevice) {
        setShowInstallButton(true);
    } else {
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };

  }, []);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleOpenChange = async (open: boolean) => {
    if (open && unreadCount > 0 && driver) {
      const updatedNotifications = driver.notifications.map(n => ({...n, read: true}));
      
      try {
        await updateDriver(driver.id, { notifications: updatedNotifications });
        setNotifications(updatedNotifications); // Optimistically update UI
      } catch (error) {
        console.error("Failed to mark notifications as read", error);
      }
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (notification.link) {
      router.push(notification.link);
    }
  }
  
  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstallModal(true);
      return;
    }
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallButton(false);
    }
  };


  return (
    <>
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-primary/20 bg-card/80 px-4 shadow-lg shadow-primary/10 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Car className="h-6 w-6 text-primary" />
          <h1 className="font-headline text-xl font-black tracking-wider text-primary text-glow">
            Fastrack Ranking
          </h1>
        </div>
        <div className="flex items-center gap-2">
            {showInstallButton && (
                <Button variant="ghost" size="icon" className="rounded-full" onClick={handleInstallClick} title="Instalar Aplicação">
                    <Download className="h-5 w-5" />
                </Button>
            )}
            <DropdownMenu onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative rounded-full">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                <span className="absolute right-0 top-0 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-accent"></span>
                </span>
                )}
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notificações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length > 0 ? (
                notifications.map((notification) => (
                <DropdownMenuItem 
                    key={notification.id} 
                    className={`flex flex-col items-start gap-1 whitespace-normal ${!notification.read ? 'bg-primary/10' : ''} ${notification.link ? 'cursor-pointer' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                    >
                    <p className="font-semibold">{notification.title}</p>
                    <p className="text-xs text-muted-foreground">{notification.description}</p>
                    <p className="text-xs text-muted-foreground/80 self-end">{formatDistanceToNow(new Date(notification.date), { addSuffix: true, locale: pt })}</p>
                </DropdownMenuItem>
                ))
            ) : (
                <DropdownMenuItem>Não tem notificações.</DropdownMenuItem>
            )}
            </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </header>
      
      <Dialog open={showIOSInstallModal} onOpenChange={setShowIOSInstallModal}>
        <DialogContent>
            <DialogHeader>
            <DialogTitle>Instalar a Aplicação</DialogTitle>
            <DialogDescription>
                Siga estes passos para adicionar a aplicação ao seu ecrã principal.
            </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2 text-sm">
            <ol className="list-decimal list-inside space-y-3 rounded-md border p-4">
              <li>
                Toque no botão de <strong>Partilha</strong> (<Share2 className="inline-block h-4 w-4" />) no menu do seu navegador.
              </li>
              <li>
                Deslize para baixo na lista de opções e toque em <strong>Adicionar ao ecrã principal</strong> (<PlusSquare className="inline-block h-4 w-4" />).
              </li>
            </ol>
            </div>
            <DialogFooter className="mt-2">
            <Button onClick={() => setShowIOSInstallModal(false)} className="w-full">Percebi</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
