import { AppShell } from "@/components/app-shell";
import Auth from "@/pages/Auth";
import Cardio from "@/pages/Cardio";
import Config from "@/pages/Config";
import Dashboard from "@/pages/Dashboard";
import Equipe from "@/pages/Equipe";
import Historico from "@/pages/Historico";
import NotFound from "@/pages/NotFound";
import Onboarding from "@/pages/Onboarding";
import Plano from "@/pages/Plano";
import Treino from "@/pages/Treino";
import TreinoExecucao from "@/pages/TreinoExecucao";
import Metricas from "@/pages/Metricas";

export const routers = [
  { path: "/auth", name: "auth", element: <Auth /> },
  { path: "/onboarding", name: "onboarding", element: <Onboarding /> },
  {
    path: "/",
    name: "app",
    element: <AppShell />,
    children: [
      { index: true, name: "dashboard", element: <Dashboard /> },
      { path: "treino", name: "treino", element: <Treino /> },
      { path: "treino/:workoutId", name: "treino-execucao", element: <TreinoExecucao /> },
      { path: "plano", name: "plano", element: <Plano /> },
      { path: "historico", name: "historico", element: <Historico /> },
      { path: "metricas", name: "metricas", element: <Metricas /> },
      { path: "cardio", name: "cardio", element: <Cardio /> },
      { path: "equipe", name: "equipe", element: <Equipe /> },
      { path: "config", name: "config", element: <Config /> },
    ],
  },
  /* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */
  { path: "*", name: "404", element: <NotFound /> },
];

declare global {
  interface Window {
    __routers__: typeof routers;
  }
}

window.__routers__ = routers;
