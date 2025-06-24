import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col">
      <Header />
      <main className="flex-1 overflow-y-auto bg-background pb-20 pt-4">
        <div className="container mx-auto max-w-3xl px-4">
            {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
