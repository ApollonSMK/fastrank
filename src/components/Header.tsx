
"use client"

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { Bell, Car } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getLoggedInDriver, Driver, Notification } from "@/lib/mock-data"
import { formatDistanceToNow } from "date-fns";
import { pt } from 'date-fns/locale';

export default function Header() {
  const router = useRouter();
  const [driver, setDriver] = useState<Driver | undefined>(undefined);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const loggedInDriver = getLoggedInDriver();
    if (loggedInDriver) {
      setDriver(loggedInDriver);
      setNotifications(loggedInDriver.notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }
  }, []);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleOpenChange = (open: boolean) => {
    if (open && unreadCount > 0 && driver) {
      setTimeout(() => {
          driver.notifications.forEach(n => n.read = true);
          setNotifications([...driver.notifications]);
      }, 1500);
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (notification.link) {
      router.push(notification.link);
    }
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-primary/20 bg-card/80 px-4 shadow-lg shadow-primary/10 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Car className="h-6 w-6 text-primary" />
        <h1 className="font-headline text-xl font-black tracking-wider text-primary text-glow">
          Fastrack Ranking
        </h1>
      </div>
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
    </header>
  )
}
