"use client";

import { cn } from "@/lib/utils";

type Props = {
  type: "loading" | "error" | "success";
  children: string;
  className?: string;
};

export function ManagementStatusMessage({ type, children, className }: Props) {
  const base = "text-sm font-medium";
  const tone =
    type === "loading"
      ? "text-muted-foreground italic"
      : type === "error"
        ? "text-red-600"
        : "text-emerald-700";

  return <p className={cn(base, tone, className)}>{children}</p>;
}


