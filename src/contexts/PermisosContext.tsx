import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { normalizar, PERMISOS_DEFECTO, puedeAcceder, rutaInicial, type MatrizPermisos } from '@/lib/permisos';
import {
  getHistorialPermisos,
  getPermisos,
  guardarPermisos,
  PERMISOS_KEY,
  type CambioPermisos,
} from '@/services/permisos.service';
import type { RutaModulo, SubmoduloId } from '@/config/modules';
import type { Rol } from '@/types';

interface PermisosContextValue {
  permisos: MatrizPermisos;
  historial: CambioPermisos[];
  listo: boolean;
  puede: (rol: Rol | null | undefined, sub: SubmoduloId) => boolean;
  inicioDe: (rol: Rol) => RutaModulo | null;
  guardar: (m: MatrizPermisos, por: string) => void;
  restablecer: (por: string) => void;
}

const PermisosContext = createContext<PermisosContextValue | null>(null);

export function PermisosProvider({ children }: { children: ReactNode }) {
  const [permisos, setPermisos] = useState<MatrizPermisos>(() => normalizar(PERMISOS_DEFECTO));
  const [historial, setHistorial] = useState<CambioPermisos[]>([]);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    setPermisos(getPermisos());
    setHistorial(getHistorialPermisos());
    setListo(true);
    // Otras pestañas abiertas reciben el cambio al instante.
    function onStorage(e: StorageEvent) {
      if (e.key === null || e.key.startsWith(PERMISOS_KEY)) {
        setPermisos(getPermisos());
        setHistorial(getHistorialPermisos());
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const guardar = useCallback((m: MatrizPermisos, por: string) => {
    setPermisos(guardarPermisos(m, { por, en: new Date().toISOString(), accion: 'guardar' }));
    setHistorial(getHistorialPermisos());
  }, []);

  const restablecer = useCallback((por: string) => {
    setPermisos(
      guardarPermisos(PERMISOS_DEFECTO, { por, en: new Date().toISOString(), accion: 'restablecer' })
    );
    setHistorial(getHistorialPermisos());
  }, []);

  const puede = useCallback(
    (rol: Rol | null | undefined, sub: SubmoduloId) => puedeAcceder(permisos, rol, sub),
    [permisos]
  );
  const inicioDe = useCallback((rol: Rol) => rutaInicial(permisos, rol), [permisos]);

  return (
    <PermisosContext.Provider value={{ permisos, historial, listo, puede, inicioDe, guardar, restablecer }}>
      {children}
    </PermisosContext.Provider>
  );
}

export function usePermisos(): PermisosContextValue {
  const ctx = useContext(PermisosContext);
  if (!ctx) throw new Error('usePermisos debe usarse dentro de PermisosProvider');
  return ctx;
}
