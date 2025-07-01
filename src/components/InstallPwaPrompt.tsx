"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { ArrowUpFromSquare, PlusSquare } from 'lucide-react';

export default function InstallPwaPrompt() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('pwa_install_prompt_dismissed');
    if (dismissed) {
      return;
    }
    
    if (window.matchMedia('(display-mode: standalone)').matches) {
        return;
    }
    
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      if (!isIOSDevice) {
        setShowInstallModal(true);
      }
    };
    
    if (isIOSDevice) {
        setShowInstallModal(true);
    } else {
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
        localStorage.setItem('pwa_install_prompt_dismissed', 'true');
    }
    setInstallPrompt(null);
    setShowInstallModal(false);
  };
  
  const handleClose = () => {
    setShowInstallModal(false);
    localStorage.setItem('pwa_install_prompt_dismissed', 'true');
  }

  if (!showInstallModal) {
    return null;
  }
  
  return (
    <Dialog open={showInstallModal} onOpenChange={setShowInstallModal}>
      <DialogContent onEscapeKeyDown={handleClose} onPointerDownOutside={handleClose}>
        <DialogHeader>
          <DialogTitle>Instalar a Aplicação</DialogTitle>
          <DialogDescription>
            Para uma melhor experiência, adicione a aplicação ao seu ecrã principal.
          </DialogDescription>
        </DialogHeader>
        {isIOS ? (
          <div className="space-y-4 py-2 text-sm">
            <p>Siga estes passos para instalar a aplicação no seu dispositivo:</p>
            <ol className="list-decimal list-inside space-y-3 rounded-md border p-4">
              <li>
                Toque no botão de <strong>Partilha</strong> (<ArrowUpFromSquare className="inline-block h-4 w-4" />) no menu do seu navegador.
              </li>
              <li>
                Deslize para baixo na lista de opções e toque em <strong>Adicionar ao ecrã principal</strong> (<PlusSquare className="inline-block h-4 w-4" />).
              </li>
            </ol>
          </div>
        ) : (
          <div className="py-4">
            <p>Clique no botão abaixo para adicionar a aplicação ao seu ecrã principal para um acesso rápido e fácil.</p>
          </div>
        )}
        <DialogFooter className="mt-2">
          {isIOS ? (
            <Button onClick={handleClose} className="w-full">Percebi</Button>
          ) : (
             <>
                <Button variant="outline" onClick={handleClose}>Agora não</Button>
                <Button onClick={handleInstallClick} disabled={!installPrompt}>
                  Instalar
                </Button>
             </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
