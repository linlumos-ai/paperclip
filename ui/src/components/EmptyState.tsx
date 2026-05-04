import { Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/locales/i18n";

interface EmptyStateProps {
  icon: LucideIcon;
  message?: string;
  messageKey?: string;
  action?: string;
  actionKey?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, message, messageKey, action, actionKey, onAction }: EmptyStateProps) {
  const { t } = useTranslation();
  
  const displayMessage = messageKey ? t(messageKey) : (message || t("emptyState.noItems"));
  const displayAction = actionKey ? t(actionKey) : action;

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="bg-muted/50 p-4 mb-4">
        <Icon className="h-10 w-10 text-muted-foreground/50" />
      </div>
      <p className="text-sm text-muted-foreground mb-4">{displayMessage}</p>
      {displayAction && onAction && (
        <Button onClick={onAction}>
          <Plus className="h-4 w-4 mr-1.5" />
          {displayAction}
        </Button>
      )}
    </div>
  );
}
