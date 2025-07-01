
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, User, Trophy, Swords, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { getLoggedInDriver } from '@/lib/data-service';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Ranking' },
  { href: '/competitions', icon: Trophy, label: 'Competições' },
  { href: '/challenges', icon: Swords, label: 'Desafios' },
  { href: '/profile', icon: User, label: 'Perfil' },
];

const adminNavItem = { href: '/admin', icon: LayoutGrid, label: 'Admin' };

export default function BottomNav() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      const driver = await getLoggedInDriver();
      if (driver && driver.email === 'info@fastrack.lu') {
        setIsAdmin(true);
      }
    };
    checkAdminStatus();
  }, []);

  const allNavItems = isAdmin ? [...navItems, adminNavItem] : navItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 border-t border-primary/20 bg-card/80 backdrop-blur-sm">
      <div className={cn(
        "container mx-auto grid max-w-3xl px-0",
        isAdmin ? 'grid-cols-5' : 'grid-cols-4'
      )}>
        {allNavItems.map((item) => {
          const isActive = (pathname === item.href) || (pathname.startsWith(item.href) && item.href !== '/');

          return (
            <Link href={item.href} key={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 p-2 text-muted-foreground transition-colors duration-200 ease-in-out",
                isActive ? "text-primary drop-shadow-[0_0_4px_hsl(var(--primary))]" : "hover:text-primary/80"
              )}>
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
