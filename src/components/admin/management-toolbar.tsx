"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ViewModeToggle, type ViewMode } from "@/components/admin/view-mode-toggle";

type Props = {
  title: string;
  keyword: string;
  onKeywordChange: (value: string) => void;
  onSearch: () => void;
  onRefresh: () => void;
  actionLabel: string;
  onAction: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  placeholder?: string;
  filters?: ReactNode;
};

export function ManagementToolbar({
  title,
  keyword,
  onKeywordChange,
  onSearch,
  onRefresh,
  actionLabel,
  onAction,
  viewMode,
  onViewModeChange,
  placeholder,
  filters,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-black uppercase tracking-tighter text-primary">{title}</h2>
        <div className="flex items-center gap-2">
          <ViewModeToggle value={viewMode} onChange={onViewModeChange} />
          <Button className="h-10 rounded-xl bg-primary px-4 text-xs font-bold uppercase shadow-lg shadow-primary/20" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          className="min-w-[220px] flex-1 rounded-xl"
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          placeholder={placeholder ?? "Cari data..."}
        />
        {filters}
        <Button variant="outline" className="shrink-0 rounded-xl font-bold" onClick={onSearch}>
          Cari
        </Button>
        <Button variant="outline" className="shrink-0 rounded-xl font-bold" onClick={onRefresh}>
          Refresh
        </Button>
      </div>
    </div>
  );
}

