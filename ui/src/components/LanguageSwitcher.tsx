import { useTranslation, type Locale } from "@/locales/i18n";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useTranslation();

  const toggle = () => {
    setLocale(locale === "en" ? "zh" : "en");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      title={t("common.switchLanguage")}
      aria-label={t("common.switchLanguage")}
    >
      <Globe className="h-3.5 w-3.5" />
      <span>{locale === "en" ? "中文" : "EN"}</span>
    </button>
  );
}
