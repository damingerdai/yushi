"use client";

import { Button } from "@yushi/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@yushi/ui/components/dropdown-menu";
import { Languages } from "lucide-react";
import { useLocale } from "@/components/locale-provider";

const languages = [
  { value: "en", label: "English", code: "EN" },
  { value: "zh-CN", label: "简体中文", code: "中文" },
] as const;

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" />}
        aria-label={t("Language")}
        title={t("Language")}
        className="size-10 cursor-pointer rounded-xl text-muted-foreground"
      >
        <Languages
          className="size-[18px]"
          strokeWidth={1.75}
          aria-hidden="true"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-44 rounded-xl p-1.5 motion-reduce:animate-none"
      >
        <DropdownMenuRadioGroup
          value={locale}
          onValueChange={(value) =>
            setLocale(value === "zh-CN" ? "zh-CN" : "en")
          }
          aria-label={t("Language")}
        >
          {languages.map((language) => (
            <DropdownMenuRadioItem
              key={language.value}
              value={language.value}
              label={language.label}
              closeOnClick
              className="min-h-10 cursor-pointer gap-3 rounded-lg data-[checked]:font-medium"
            >
              <span
                aria-hidden="true"
                className="w-6 text-center text-[10px] font-medium tracking-wide text-muted-foreground"
              >
                {language.code}
              </span>
              <span lang={language.value}>{language.label}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
