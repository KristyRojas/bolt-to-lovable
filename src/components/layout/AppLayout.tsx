import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthGuard } from './AuthGuard';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { AppFooter } from './AppFooter';

const COLAPSADO_KEY = 'emi_insight_sidebar_colapsado';

export function AppLayout({ children }: { children: ReactNode }) {
  const [colapsado, setColapsado] = useState(false);
  const [movilAbierto, setMovilAbierto] = useState(false);

  useEffect(() => {
    setColapsado(window.localStorage.getItem(COLAPSADO_KEY) === '1');
  }, []);

  function alternarMenu() {
    if (window.matchMedia('(min-width: 1024px)').matches) {
      setColapsado((c) => {
        window.localStorage.setItem(COLAPSADO_KEY, c ? '0' : '1');
        return !c;
      });
    } else {
      setMovilAbierto(true);
    }
  }

  return (
    <AuthGuard>
      <TooltipProvider delayDuration={150}>
        <div
          className="min-h-screen bg-background"
          style={{ '--sb-w': colapsado ? '72px' : '260px' } as CSSProperties}
        >
          {/* Sidebar fijo en escritorio */}
          <aside className="fixed inset-y-0 left-0 z-40 hidden w-(--sb-w) transition-[width] duration-200 lg:block">
            <AppSidebar colapsado={colapsado} />
          </aside>

          {/* Drawer en móvil y tablet */}
          <Sheet open={movilAbierto} onOpenChange={setMovilAbierto}>
            <SheetContent side="left" className="w-[280px] border-0 bg-navy p-0 text-primary-foreground">
              <SheetTitle className="sr-only">Menú principal</SheetTitle>
              <AppSidebar onNavegar={() => setMovilAbierto(false)} />
            </SheetContent>
          </Sheet>

          <div className="flex min-h-screen flex-col transition-[padding] duration-200 lg:pl-(--sb-w)">
            <AppHeader onMenu={alternarMenu} />
            <main className="flex-1">
              <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 md:py-8 lg:px-10">
                {children}
              </div>
            </main>
            <AppFooter />
          </div>
        </div>
      </TooltipProvider>
    </AuthGuard>
  );
}
