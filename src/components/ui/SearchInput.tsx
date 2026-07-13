import { useTranslation } from "react-i18next";
import { TextInput } from "./TextInput";
import type { TextInputProps } from "./TextInput";

/** The list-filter input used by every searchable picker. */
export function SearchInput(props: Omit<TextInputProps, "size" | "mono">) {
  const { t } = useTranslation();
  return <TextInput size="sm" placeholder={t("名前・キーで検索")} {...props} />;
}
