import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "primary" | "alert";
  className?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = "default",
  className,
}: StatCardProps) {
  const toneClass =
    tone === "primary"
      ? "text-primary"
      : tone === "alert"
        ? "text-alert"
        : "text-muted-foreground";
  return (
    <Card
      className={cn(
        "relative overflow-hidden p-4 shadow-card animate-fade-in",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <Icon className={cn("size-4", toneClass)} />
      </div>
      <div className="mt-1 text-2xl font-semibold text-foreground">{value}</div>
      {sub ? <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div> : null}
    </Card>
  );
}
