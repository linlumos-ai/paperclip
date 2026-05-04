import { useState } from "react";
import { Globe, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTranslation, type Locale } from "@/locales/i18n";
import { cn } from "../lib/utils";

const LOCALES: { code: Locale; label: string; nativeLabel: string }[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "zh", label: "Chinese", nativeLabel: "中文" },
];

export function LocaleSwitcher() {
  const { locale, setLocale, t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
          aria-label={t("common.switchLanguage")}
        >
          <Globe className="size-4 shrink-0" />
          <span className="flex-1 truncate">
            {LOCALES.find((l) => l.code === locale)?.nativeLabel ?? "English"}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        sideOffset={8}
        className="w-48 overflow-hidden rounded-xl border-border p-1 shadow-lg"
      >
        <div className="px-2 py-1.5">
          <p className="text-xs font-medium text-muted-foreground">{t("common.language")}</p>
        </div>
        {LOCALES.map((l) => (
          <button
            key={l.code}
            type="button"
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors",
              locale === l.code
                ? "bg-accent text-accent-foreground font-medium"
                : "hover:bg-accent/50 text-foreground",
            )}
            onClick={() => {
              setLocale(l.code);
              setOpen(false);
            }}
          >
            <span className="flex-1">{l.nativeLabel}</span>
            <span className="text-xs text-muted-foreground">{l.label}</span>
            {locale === l.code ? <Check className="size-3.5 shrink-0 text-primary" /> : null}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
