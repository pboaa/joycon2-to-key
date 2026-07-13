import { IconTrash } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { Button, type ButtonVariant } from "./Button";

/** The one delete button: a trash icon + "Delete", so every "delete this" action
 * (operation / profile / layer / button assignment) reads the same. Defaults to
 * the subtle dangerOutline skin (matching the saved-operations editor); pass
 * `variant` for a louder one (e.g. profile delete). */
export function DeleteButton({
  onClick,
  disabled,
  variant = "dangerOutline",
  size = "md",
  label,
  tip,
  className = "ml-auto px-3",
}: {
  onClick: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: "xs" | "sm" | "md";
  /** Override the "Delete" label. */
  label?: string;
  /** Hover tooltip (e.g. why it's disabled). */
  tip?: string;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <Button
      variant={variant}
      size={size}
      disabled={disabled}
      onClick={onClick}
      data-tip={tip}
      className={`inline-flex items-center gap-1 ${className}`}
    >
      <IconTrash size={13} aria-hidden />
      {label ?? t("削除")}
    </Button>
  );
}
