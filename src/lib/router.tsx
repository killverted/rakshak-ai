import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Route =
  | 'landing'
  | 'login'
  | 'citizen'
  | 'report'
  | 'ai-analysis'
  | 'sos'
  | 'map'
  | 'volunteer'
  | 'admin'
  | 'command-center';

type RouterContextValue = {
  route: Route;
  navigate: (r: Route) => void;
};

const RouterContext = createContext<RouterContextValue | undefined>(undefined);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>(() => {
    const h = window.location.hash.replace('#/', '').replace('#', '');
    return (h as Route) || 'landing';
  });

  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace('#/', '').replace('#', '');
      setRoute((h as Route) || 'landing');
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = (r: Route) => {
    window.location.hash = `/${r}`;
    setRoute(r);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  return <RouterContext.Provider value={{ route, navigate }}>{children}</RouterContext.Provider>;
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  return ctx;
}
