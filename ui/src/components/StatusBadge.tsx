import { cn } from "../lib/utils";
import { statusBadge, statusBadgeDefault } from "../lib/status-colors";
import { useTranslation } from "@/locales/i18n";

export function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();

  // Try common.statuses first (covers all issue statuses), then fall back to title-cased raw value
  const translatedStatus = t(`common.statuses.${status}`) !== `common.statuses.${status}`
    ? t(`common.statuses.${status}`)
    : status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap shrink-0",
        statusBadge[status] ?? statusBadgeDefault
      )}
    >
      {translatedStatus}
    </span>
  );
}
