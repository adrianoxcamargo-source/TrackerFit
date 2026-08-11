import {
  ClipboardList,
  Dumbbell,
  Info,
  Lock,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useActiveAthlete } from "@/hooks/use-active-athlete";
import {
  useExercises,
  useWorkoutExercises,
  useWorkouts,
} from "@/lib/store";
import { defaultRestSeconds, formatRestDuration } from "@/lib/rest";
import type { Category, Exercise, Workout } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/empty-state";
import { KneeAlertBadge } from "@/components/knee-alert-badge";
import { PageHeader } from "@/components/page-header";

const CATEGORIES: Category[] = [
  "Composto",
  "Composto Guiado",
  "Isolador",
  "Isolador Guiado",
  "Core",
];

function WorkoutPlan({
  workout,
  canEdit,
}: {
  workout: Workout;
  canEdit: boolean;
}) {
  const { items: exercises } = useExercises();
  const { items: allWE } = useWorkoutExercises();
  const { add, update, remove } = useWorkoutExercises();

  const wExercises = allWE
    .filter((we) => we.workoutId === workout.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const usedIds = new Set(wExercises.map((we) => we.exerciseId));
  const available = exercises
    .filter((e) => !usedIds.has(e.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  const [addExId, setAddExId] = useState<string>("");

  const handleAdd = async () => {
    if (!addExId) return;
    const maxSort = wExercises.reduce((m, we) => Math.max(m, we.sortOrder), 0);
    const addedEx = exercises.find((e) => e.id === addExId);
    await add({
      workoutId: workout.id,
      exerciseId: addExId,
      sortOrder: maxSort + 1,
      setsPlanned: 3,
      repsTarget: "8-12",
      rirTarget: 3,
      restSeconds: addedEx ? defaultRestSeconds(addedEx.category) : 90,
    });
    setAddExId("");
    toast.success("Exercício adicionado ao treino.");
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span>
            {workout.name} · {workout.weekdayLabel}
          </span>
          <span className="text-xs font-normal text-muted-foreground">
            {wExercises.length} exercícios
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {wExercises.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum exercício neste treino.
          </p>
        ) : (
          wExercises.map((we) => {
            const ex = exercises.find((e) => e.id === we.exerciseId);
            if (!ex) return null;
            return (
              <div
                key={we.id}
                className="rounded-lg border border-border bg-muted/20 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <span className="text-xs text-muted-foreground">
                        {we.sortOrder}.
                      </span>
                      {ex.name}
                      {ex.kneeAlert ? <KneeAlertBadge note={ex.kneeNote} /> : null}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {ex.category} · {ex.progressionDefault}
                    </p>
                  </div>
                  {canEdit ? (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 text-muted-foreground hover:text-destructive"
                      onClick={() => remove(we.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  ) : null}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-muted-foreground">
                      Séries
                    </Label>
                    <Input
                      type="number"
                      defaultValue={we.setsPlanned}
                      disabled={!canEdit}
                      onBlur={(e) =>
                        update(we.id, {
                          setsPlanned: Math.max(1, Number(e.target.value) || 1),
                        })
                      }
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-muted-foreground">
                      Reps
                    </Label>
                    <Input
                      defaultValue={we.repsTarget}
                      disabled={!canEdit}
                      onBlur={(e) =>
                        update(we.id, { repsTarget: e.target.value })
                      }
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-muted-foreground">
                      RIR alvo
                    </Label>
                    <Input
                      defaultValue={we.rirTarget ?? "N/A"}
                      disabled={!canEdit}
                      onBlur={(e) => {
                        const raw = e.target.value.trim();
                        const parsed = Number(raw);
                        update(we.id, {
                          rirTarget:
                            raw === "" || raw.toUpperCase() === "N/A" || Number.isNaN(parsed)
                              ? null
                              : Math.max(0, parsed),
                        });
                      }}
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-muted-foreground">
                      Descanso (s)
                    </Label>
                    <Input
                      type="number"
                      defaultValue={we.restSeconds ?? defaultRestSeconds(ex.category)}
                      disabled={!canEdit}
                      onBlur={(e) => {
                        const parsed = Number(e.target.value);
                        update(we.id, {
                          restSeconds: Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null,
                        });
                      }}
                      className="h-8"
                    />
                  </div>
                  <div className="col-span-2 space-y-1 sm:col-span-1">
                    <Label className="text-[10px] uppercase text-muted-foreground">
                      Obs.
                    </Label>
                    <Input
                      defaultValue={we.notes ?? ""}
                      disabled={!canEdit}
                      onBlur={(e) => update(we.id, { notes: e.target.value })}
                      className="h-8"
                    />
                  </div>
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  Descanso planejado: {formatRestDuration(we.restSeconds ?? defaultRestSeconds(ex.category))}
                </p>
                {we.notes ? (
                  <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                    <Info className="mt-0.5 size-3.5 shrink-0" />
                    {we.notes}
                  </p>
                ) : null}
              </div>
            );
          })
        )}

        {canEdit ? (
          <div className="flex items-end gap-2 pt-1">
            <div className="flex-1 space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">
                Adicionar exercício
              </Label>
              <Select value={addExId} onValueChange={setAddExId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecionar exercício" />
                </SelectTrigger>
                <SelectContent>
                  {available.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name} ({e.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAdd} disabled={!addExId}>
              <Plus className="size-4" />
              Adicionar
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ExerciseLibrary({ canEdit }: { canEdit: boolean }) {
  const { items, add, update, remove } = useExercises();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("Composto");
  const [progression, setProgression] = useState("Carga");

  const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

  const handleAdd = async () => {
    if (!name.trim()) return;
    await add({
      name: name.trim(),
      category,
      progressionDefault: progression,
      kneeAlert: false,
      sortOrder: sorted.length + 1,
    });
    setName("");
    toast.success("Exercício criado.");
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-base">Biblioteca de exercícios</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sorted.map((e: Exercise) => (
          <div
            key={e.id}
            className="grid grid-cols-1 items-end gap-2 rounded-lg border border-border bg-muted/20 p-3 sm:grid-cols-[2fr_1fr_1fr_auto_auto]"
          >
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">
                Nome
              </Label>
              <Input
                defaultValue={e.name}
                disabled={!canEdit}
                onBlur={(ev) => update(e.id, { name: ev.target.value })}
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">
                Categoria
              </Label>
              <Select
                defaultValue={e.category}
                disabled={!canEdit}
                onValueChange={(v) => update(e.id, { category: v as Category })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">
                Progressão
              </Label>
              <Input
                defaultValue={e.progressionDefault}
                disabled={!canEdit}
                onBlur={(ev) =>
                  update(e.id, { progressionDefault: ev.target.value })
                }
                className="h-8"
              />
            </div>
            <div className="flex flex-col items-center gap-1">
              <Label className="text-[10px] uppercase text-muted-foreground">
                Joelho
              </Label>
              <Switch
                checked={e.kneeAlert}
                disabled={!canEdit}
                onCheckedChange={(v) => update(e.id, { kneeAlert: v })}
              />
            </div>
            {canEdit ? (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 text-muted-foreground hover:text-destructive"
                onClick={() => remove(e.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            ) : null}
          </div>
        ))}

        {canEdit ? (
          <div className="grid grid-cols-1 items-end gap-2 rounded-lg border border-dashed border-border p-3 sm:grid-cols-[2fr_1fr_1fr_auto]">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">
                Novo exercício
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome"
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">
                Categoria
              </Label>
              <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">
                Progressão
              </Label>
              <Input
                value={progression}
                onChange={(e) => setProgression(e.target.value)}
                className="h-8"
              />
            </div>
            <Button onClick={handleAdd}>
              <Plus className="size-4" />
              Criar
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function Plano() {
  const { isTrainer } = useActiveAthlete();
  const { items: workouts } = useWorkouts();
  const sorted = [...workouts].sort((a, b) => a.sortOrder - b.sortOrder);

  if (sorted.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="Sem treinos cadastrados"
        description="Importe o plano padrão para começar."
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Plano de treino"
        description="Treinos A/B/C e a biblioteca de exercícios."
        icon={ClipboardList}
        actions={
          isTrainer ? null : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground">
              <Lock className="size-3.5" />
              Somente leitura — edição pelo treinador
            </span>
          )
        }
      />

      <Tabs defaultValue={sorted[0].id}>
        <TabsList className="w-full justify-start">
          {sorted.map((w) => (
            <TabsTrigger key={w.id} value={w.id}>
              {w.name}
            </TabsTrigger>
          ))}
          <TabsTrigger value="library">
            <Dumbbell className="size-3.5" />
            Exercícios
          </TabsTrigger>
        </TabsList>
        {sorted.map((w) => (
          <TabsContent key={w.id} value={w.id} className="mt-4">
            <WorkoutPlan workout={w} canEdit={isTrainer} />
          </TabsContent>
        ))}
        <TabsContent value="library" className="mt-4">
          <ExerciseLibrary canEdit={isTrainer} />
        </TabsContent>
      </Tabs>
    </>
  );
}
