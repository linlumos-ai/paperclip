import { useState } from "react";
import type { IssueBlockerAttention } from "@paperclipai/shared";
import { cn } from "../lib/utils";
import { issueStatusIcon, issueStatusIconDefault } from "../lib/status-colors";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/locales/i18n";

const allStatuses = ["backlog", "todo", "in_progress", "in_review", "done", "cancelled", "blocked"];

interface StatusIconProps {
  status: string;
  blockerAttention?: IssueBlockerAttention | null;
  onChange?: (status: string) => void;
  className?: string;
  showLabel?: boolean;
}

function blockedAttentionLabel(blockerAttention: IssueBlockerAttention | null | undefined, t?: (key: string, params?: Record<string, string | number>) => string): string {
  const blockedText = t ? t("common.statuses.blocked") : "Blocked";
  if (!blockerAttention || blockerAttention.state === "none") return blockedText;

  if (blockerAttention.reason === "active_child") {
    const count = blockerAttention.coveredBlockerCount;
    if (count === 1 && blockerAttention.sampleBlockerIdentifier) {
      return t ? t("statusLabels.blocked_waiting_active_child_one", { identifier: blockerAttention.sampleBlockerIdentifier }) : `Blocked · waiting on active sub-issue ${blockerAttention.sampleBlockerIdentifier}`;
    }
    if (count === 1) return t ? t("statusLabels.blocked_waiting_active_child", { count: 1 }) : "Blocked · waiting on 1 active sub-issue";
    return t ? t("statusLabels.blocked_waiting_active_child", { count }) : `Blocked · waiting on ${count} active sub-issues`;
  }

  if (blockerAttention.reason === "active_dependency") {
    const count = blockerAttention.coveredBlockerCount;
    if (count === 1 && blockerAttention.sampleBlockerIdentifier) {
      return t ? t("statusLabels.blocked_active_dependency_one", { identifier: blockerAttention.sampleBlockerIdentifier }) : `Blocked · covered by active dependency ${blockerAttention.sampleBlockerIdentifier}`;
    }
    if (count === 1) return t ? t("statusLabels.blocked_active_dependency", { count: 1 }) : "Blocked · covered by 1 active dependency";
    return t ? t("statusLabels.blocked_active_dependency", { count }) : `Blocked · covered by ${count} active dependencies`;
  }

  if (blockerAttention.reason === "stalled_review") {
    const count = blockerAttention.stalledBlockerCount;
    const leaf = blockerAttention.sampleStalledBlockerIdentifier ?? blockerAttention.sampleBlockerIdentifier;
    if (count === 1 && leaf) return t ? t("statusLabels.blocked_review_stalled_one", { identifier: leaf }) : `Blocked · review stalled on ${leaf}`;
    if (count === 1) return t ? t("statusLabels.blocked_review_stalled_no_next") : "Blocked · review stalled with no clear next step";
    return t ? t("statusLabels.blocked_review_stalled", { count }) : `Blocked · ${count} reviews stalled with no clear next step`;
  }

  if (blockerAttention.reason === "attention_required") {
    const count = blockerAttention.unresolvedBlockerCount;
    const key = count === 1 ? "statusLabels.blocked_attention_required_one" : "statusLabels.blocked_attention_required";
    return t ? t(key, { count, plural: count === 1 ? "blocker" : "blockers" }) : `Blocked · ${count} unresolved ${count === 1 ? "blocker needs" : "blockers need"} attention`;
  }

  return blockedText;
}

export function StatusIcon({ status, blockerAttention, onChange, className, showLabel }: StatusIconProps) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const statusLabelText = t(`common.statuses.${status}`) !== `common.statuses.${status}`
    ? t(`common.statuses.${status}`)
    : status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const isCoveredBlocked = status === "blocked" && blockerAttention?.state === "covered";
  const isStalledBlocked = status === "blocked" && blockerAttention?.state === "stalled";
  const colorClass = isCoveredBlocked
    ? "text-cyan-600 border-cyan-600 dark:text-cyan-400 dark:border-cyan-400"
    : isStalledBlocked
      ? "text-amber-600 border-amber-600 dark:text-amber-400 dark:border-amber-400"
      : issueStatusIcon[status] ?? issueStatusIconDefault;
  const isDone = status === "done";
  const ariaLabel = status === "blocked" ? blockedAttentionLabel(blockerAttention, t) : statusLabelText;
  const blockerAttentionState = isCoveredBlocked
    ? "covered"
    : isStalledBlocked
      ? "stalled"
      : undefined;

  const circle = (
    <span
      className={cn(
        "relative inline-flex h-4 w-4 rounded-full border-2 shrink-0",
        colorClass,
        onChange && !showLabel && "cursor-pointer",
        className
      )}
      data-blocker-attention-state={blockerAttentionState}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      {isDone && (
        <span className="absolute inset-0 m-auto h-2 w-2 rounded-full bg-current" />
      )}
      {isCoveredBlocked && (
        <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-background bg-current" />
      )}
      {isStalledBlocked && (
        <span className="absolute inset-0 m-auto h-1.5 w-1.5 rounded-full bg-current" />
      )}
    </span>
  );

  if (!onChange) return showLabel ? <span className="inline-flex items-center gap-1.5">{circle}<span className="text-sm">{statusLabelText}</span></span> : circle;

  const trigger = showLabel ? (
    <button className="inline-flex items-center gap-1.5 cursor-pointer hover:bg-accent/50 rounded px-1 -mx-1 py-0.5 transition-colors">
      {circle}
      <span className="text-sm">{statusLabelText}</span>
    </button>
  ) : circle;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-40 p-1" align="start">
        {allStatuses.map((s) => (
          <Button
            key={s}
            variant="ghost"
            size="sm"
            className={cn("w-full justify-start gap-2 text-xs", s === status && "bg-accent")}
            onClick={() => {
              onChange(s);
              setOpen(false);
            }}
          >
            <StatusIcon status={s} />
            {t(`common.statuses.${s}`) !== `common.statuses.${s}` ? t(`common.statuses.${s}`) : s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </Button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
