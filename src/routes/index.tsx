import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';


export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'EMI-INSIGHT — Percepción institucional EMI-UALP' },
      { name: 'description', content: 'Sistema de identificación de factores de percepción institucional en redes sociales — EMI-UALP, Bolivia' },
      { property: 'og:title', content: 'EMI-INSIGHT — Percepción institucional EMI-UALP' },
      { property: 'og:description', content: 'Sistema de identificación de factores de percepción institucional en redes sociales — EMI-UALP, Bolivia' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: Home,
});

function Home() {
  const { usuario, cargando } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!cargando) {
      navigate({ to: usuario ? '/dashboard' : '/login', replace: true });
    }
  }, [cargando, usuario, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="emi-skeleton h-8 w-48" />
    </div>
  );
}
