import { ShieldAlert } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface KneeAlertBadgeProps {
  className?: string;
  showLabel?: boolean;
  note?: string;
}

// Reserved exclusively for left-knee safety warnings (amber token).
export function KneeAlertBadge({
  className,
  showLabel = true,
  note,
}: KneeAlertBadgeProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border border-alert/40 bg-alert/15 px-2 py-0.5 text-xs font-medium text-alert",
            className,
          )}
        >
          <ShieldAlert className="size-3.5" />
          {showLabel ? "Alerta de joelho" : null}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs border-alert/40 bg-popover text-popover-foreground">
        <p>
          {note ??
            "Desgaste de cartilagem no joelho esquerdo — controle a amplitude e evite dor. Priorize a técnica sobre a carga."}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
