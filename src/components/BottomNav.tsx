
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, User, Trophy, Swords } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Ranking' },
  { href: '/competitions', icon: Trophy, label: 'Competições' },
  { href: '/challenges', icon: Swords, label: 'Desafios' },
  { href: '/profile', icon: User, label: 'Perfil' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 border-t border-primary/20 bg-card/80 backdrop-blur-sm">
      <div className="container mx-auto grid max-w-3xl grid-cols-4 px-0">
        {navItems.map((item) => {
          const isActive = (pathname === item.href) || (pathname.startsWith(item.href) && item.href !== '/');

          return (
            <Link href={item.href} key={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 p-3 text-muted-foreground transition-colors duration-200 ease-in-out",
                isActive ? "text-primary drop-shadow-[0_0_4px_hsl(var(--primary))]" : "hover:text-primary/80"
              )}>
              <item.icon className="h-6 w-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
