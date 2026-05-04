import { cn } from "../lib/utils";
import { statusBadge, statusBadgeDefault } from "../lib/status-colors";
import { useTranslation } from "@/locales/i18n";

export function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  
  // Try to translate the status using a common pattern
  const translatedStatus = t(`common.${status}`) !== `common.${status}` 
    ? t(`common.${status}`)
    : t(`agents.status.${status}`) !== `agents.status.${status}`
      ? t(`agents.status.${status}`)
      : status.replace(/_/g, " ");

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
