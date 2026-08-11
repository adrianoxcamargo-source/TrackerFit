import { ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PHASE_DETAILS } from "@/lib/phaseDetails";
import type { ProgramPhase } from "@/lib/programPhase";

interface PhaseDetailsDialogProps {
  phase: ProgramPhase;
}

export function PhaseDetailsDialog({ phase }: PhaseDetailsDialogProps) {
  const content = PHASE_DETAILS[phase.mesocycle];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <ScrollText className="size-4" />
          Detalhes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{content.title}</DialogTitle>
          {content.intro ? (
            <DialogDescription>{content.intro}</DialogDescription>
          ) : null}
        </DialogHeader>
        <div className="space-y-4">
          {content.sections.map((section) => (
            <div key={section.heading} className="space-y-1.5">
              <h4 className="text-sm font-semibold text-foreground">
                {section.heading}
              </h4>
              <ul className="space-y-1 pl-1">
                {section.bullets.map((b, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" />
                    <span className="text-balance">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
