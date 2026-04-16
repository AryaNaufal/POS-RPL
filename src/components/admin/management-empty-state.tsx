"use client";

import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description?: string;
  className?: string;
};

export function ManagementEmptyState({ title, description, className }: Props) {
  return (
    <div className={cn("py-10 text-center", className)}>
      <p className="font-medium italic text-muted-foreground">{title}</p>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}


