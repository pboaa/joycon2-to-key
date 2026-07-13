import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TextInput } from "./TextInput";
import { Button } from "./Button";

/** A text field + primary "add" button on one row: type a name and press Enter
 * or the button to add it. Owns its own input state, trims the value, ignores
 * empty submits, and clears after a successful add. The single inline-add row
 * shared by the create/manager modals. */
export function InlineAddField({
  onAdd,
  placeholder,
  buttonLabel = "追加",
  size = "md",
  mono = false,
  autoFocus = false,
}: {
  /** Receives the trimmed, non-empty value. */
  onAdd: (value: string) => void;
  placeholder: string;
  buttonLabel?: string;
  size?: "sm" | "md";
  mono?: boolean;
  autoFocus?: boolean;
}) {
  const { t } = useTranslation();
  const [value, setValue] = useState("");
  const submit = () => {
    const v = value.trim();
    if (!v) return;
    onAdd(v);
    setValue("");
  };
  return (
    <div className="flex gap-1">
      <TextInput
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        placeholder={t(placeholder)}
        mono={mono}
        size={size}
        fullWidth={false}
        className="flex-1"
      />
      <Button
        variant="primary"
        size={size === "sm" ? "xs" : "md"}
        onClick={submit}
        className={size === "sm" ? undefined : "px-3"}
      >
        {t(buttonLabel)}
      </Button>
    </div>
  );
}
