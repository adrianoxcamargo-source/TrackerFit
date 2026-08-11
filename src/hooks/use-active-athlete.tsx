/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { mapProfile } from "@/lib/mappers";
import { useAuth, type Profile } from "@/hooks/use-auth";

const STORAGE_KEY = "tf:selectedAthlete";

interface ActiveAthleteContextValue {
  role: Profile["role"] | null;
  activeAthleteId: string | null;
  activeAthleteProfile: Profile | null;
  isAthlete: boolean;
  isTrainer: boolean;
  linkedAthletes: Profile[];
  loading: boolean;
  setSelectedAthlete: (id: string | null) => void;
  refresh: () => void;
}

const ActiveAthleteContext = createContext<ActiveAthleteContextValue | null>(
  null,
);

export function ActiveAthleteProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [linkedAthletes, setLinkedAthletes] = useState<Profile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    typeof localStorage !== "undefined"
      ? localStorage.getItem(STORAGE_KEY)
      : null,
  );
  const [loading, setLoading] = useState(true);

  const loadLinked = useCallback(async (trainerId: string) => {
    const { data: links } = await supabase
      .from("athlete_trainer_links")
      .select("athlete_id")
      .eq("trainer_id", trainerId)
      .eq("status", "aceito");
    const ids = (links ?? []).map((r: { athlete_id: string }) => r.athlete_id);
    if (!ids.length) {
      setLinkedAthletes([]);
      return;
    }
    const { data: profs } = await supabase
      .from("profiles")
      .select("id,email,full_name,role")
      .in("id", ids);
    setLinkedAthletes((profs ?? []).map(mapProfile));
  }, []);

  useEffect(() => {
    if (!profile) {
      setLinkedAthletes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    if (profile.role === "treinador") {
      void loadLinked(profile.id).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [profile, loadLinked]);

  const role = profile?.role ?? null;
  const isAthlete = role === "atleta";
  const isTrainer = role === "treinador";

  const validSelected =
    isTrainer && selectedId
      ? linkedAthletes.some((a) => a.id === selectedId)
      : false;
  const fallbackId = isTrainer ? linkedAthletes[0]?.id ?? null : null;
  const activeAthleteId = isAthlete
    ? (profile?.id ?? null)
    : validSelected
      ? selectedId
      : fallbackId;

  const activeAthleteProfile = isAthlete
    ? profile
    : (linkedAthletes.find((a) => a.id === activeAthleteId) ?? null);

  const setSelectedAthlete = (id: string | null) => {
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
    setSelectedId(id);
  };

  const refresh = useCallback(() => {
    if (profile?.role === "treinador") void loadLinked(profile.id);
  }, [profile, loadLinked]);

  return (
    <ActiveAthleteContext.Provider
      value={{
        role,
        activeAthleteId,
        activeAthleteProfile,
        isAthlete,
        isTrainer,
        linkedAthletes,
        loading,
        setSelectedAthlete,
        refresh,
      }}
    >
      {children}
    </ActiveAthleteContext.Provider>
  );
}

export function useActiveAthlete() {
  const ctx = useContext(ActiveAthleteContext);
  if (!ctx)
    throw new Error("useActiveAthlete must be used within ActiveAthleteProvider");
  return ctx;
}
