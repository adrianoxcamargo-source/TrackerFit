import {
  ClipboardList,
  Dumbbell,
  CalendarDays,
  HeartPulse,
  LayoutDashboard,
  LineChart,
  Loader2,
  LogOut,
  Scale,
  Settings,
  Users,
} from "lucide-react";
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useActiveAthlete } from "@/hooks/use-active-athlete";
import { useHasProgram, useSettings } from "@/lib/store";
import { computePhase } from "@/lib/programPhase";
import { formatDate, formatWeekday, todayISO } from "@/lib/format";
import { PhasePill } from "@/components/phase-pill";
import { RestTimerBar } from "@/components/rest-timer-bar";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const NAV: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/treino", label: "Treino", icon: Dumbbell },
  { to: "/plano", label: "Plano", icon: ClipboardList },
  { to: "/historico", label: "Histórico", icon: LineChart },
  { to: "/metricas", label: "Métricas", icon: Scale },
  { to: "/cardio", label: "Cardio", icon: HeartPulse },
  { to: "/equipe", label: "Equipe", icon: Users },
];

const TITLE_MAP: Record<string, string> = {
  "/": "Dashboard",
  "/treino": "Treino do dia",
  "/plano": "Plano de treino",
  "/historico": "Histórico",
  "/metricas": "Métricas corporais",
  "/cardio": "Cardio",
  "/equipe": "Equipe",
  "/config": "Configurações",
};

function MobileClosingNavLink({
  to,
  children,
  className,
}: {
  to: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { isMobile, setOpenMobile } = useSidebar();
  return (
    <NavLink
      to={to}
      className={className}
      onClick={() => {
        if (isMobile) setOpenMobile(false);
      }}
    >
      {children}
    </NavLink>
  );
}

function MobileLogoutButton() {
  const { isMobile, setOpenMobile } = useSidebar();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (isMobile) setOpenMobile(false);
    await signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="flex w-full items-center justify-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/15"
    >
      <LogOut className="size-3.5" />
      Sair
    </button>
  );
}

function Splash() {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-background">
      <Loader2 className="size-8 animate-spin text-primary" />
    </div>
  );
}

export function AppShell() {
  const location = useLocation();
  const { session, profile, loading: authLoading } = useAuth();
  const {
    isTrainer,
    linkedAthletes,
    activeAthleteId,
    activeAthleteProfile,
    setSelectedAthlete,
    loading: athleteLoading,
  } = useActiveAthlete();
  const { settings } = useSettings();
  const { hasProgram, loading: programLoading } = useHasProgram();

  if (authLoading || (session && !profile) || athleteLoading) return <Splash />;
  if (!session) return <Navigate to="/auth" replace />;
  if (programLoading) return <Splash />;
  if (!hasProgram && !(isTrainer && location.pathname === "/equipe")) {
    return <Navigate to="/onboarding" replace />;
  }

  const isActive = (to: string) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  const title =
    TITLE_MAP[location.pathname] ??
    (location.pathname.startsWith("/treino/") ? "Treino do dia" : "TrackerFit");
  const phase = settings
    ? computePhase(settings.startDate, settings.durationDays)
    : null;
  const viewingAthleteName =
    activeAthleteProfile?.full_name || activeAthleteProfile?.email || "Atleta";
  const ownName = profile?.full_name || profile?.email || "";
  const todayIso = todayISO();
  const weekdayLabel = formatWeekday(todayIso);
  const todayLabel = `${weekdayLabel.charAt(0).toUpperCase()}${weekdayLabel.slice(1)}, ${formatDate(todayIso)}`;

  return (
    <SidebarProvider>
      <RestTimerBar />
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground shadow-glow">
              <Dumbbell className="size-5" />
            </div>
            <div className="flex flex-col leading-none group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-semibold text-foreground">
                TrackerFit
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {ownName} · {isTrainer ? "Treinador" : "Atleta"}
              </span>
              {isTrainer ? (
                <span className="truncate text-[11px] text-primary">
                  Vendo: {viewingAthleteName}
                </span>
              ) : null}
            </div>
          </div>
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navegação</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.to)}
                      tooltip={item.label}
                    >
                      <MobileClosingNavLink to={item.to}>
                        <item.icon />
                        <span>{item.label}</span>
                      </MobileClosingNavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div className="rounded-lg border border-border bg-card/60 p-3 group-data-[collapsible=icon]:hidden">
            {phase ? (
              <div className="space-y-2">
                <PhasePill phase={phase} className="w-full justify-center" />
                <MobileClosingNavLink
                  to="/config"
                  className="flex items-center justify-center gap-2 rounded-md border border-border bg-background px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Settings className="size-3.5" />
                  Configurações
                </MobileClosingNavLink>
                <MobileLogoutButton />
              </div>
            ) : null}
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-1 h-5" />
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground sm:inline-flex">
              <CalendarDays className="size-3.5" />
              {todayLabel}
            </span>
            {phase ? (
              <PhasePill phase={phase} className="hidden sm:inline-flex" />
            ) : null}
            {isTrainer ? (
              <>
                <span className="hidden items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary sm:inline-flex">
                  <span className="size-1.5 rounded-full bg-primary" />
                  Treinador
                </span>
                <Select
                  value={activeAthleteId ?? undefined}
                  onValueChange={(v) => setSelectedAthlete(v)}
                >
                  <SelectTrigger className="h-8 w-[160px] gap-2">
                    <Users className="size-3.5 text-muted-foreground" />
                    <SelectValue placeholder="Selecionar atleta" />
                  </SelectTrigger>
                  <SelectContent>
                    {linkedAthletes.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.full_name || a.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            ) : (
              <span className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground sm:inline-flex">
                <span className="size-1.5 rounded-full bg-primary" />
                {profile?.role === "treinador" ? "Treinador" : "Atleta"}
              </span>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className={cn("mx-auto w-full max-w-6xl space-y-6")}>
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
