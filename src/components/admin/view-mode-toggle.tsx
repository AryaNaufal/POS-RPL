"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ViewMode = "grid" | "list";

type Props = {
  value: ViewMode;
  onChange: (next: ViewMode) => void;
  className?: string;
};

export function ViewModeToggle({ value, onChange, className }: Props) {
  return (
    <div className={cn("flex gap-1 rounded-lg bg-secondary p-1", className)}>
      <Button
        type="button"
        variant={value === "grid" ? "default" : "ghost"}
        size="sm"
        className="h-8 rounded-md text-[10px] font-bold uppercase"
        onClick={() => onChange("grid")}
      >
        Grid
      </Button>
      <Button
        type="button"
        variant={value === "list" ? "default" : "ghost"}
        size="sm"
        className="h-8 rounded-md text-[10px] font-bold uppercase"
        onClick={() => onChange("list")}
      >
        List
      </Button>
    </div>
  );
}

