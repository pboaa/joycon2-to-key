import { buttonLabel } from "../../lib/keyCatalog";

/** Displays a Joy-Con button key as a keycap-style tag (proper name via
 * {@link buttonLabel}, e.g. "zl" → "ZL"), so it reads as a physical button.
 * The app's single keycap primitive — reuse this rather than restyling a span. */
export function KeyCap({
  k,
  size = "sm",
  className = "",
}: {
  k: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const pad =
    size === "md" ? "px-2 py-0.5 text-body" : "px-1.5 py-0.5 text-label";
  return (
    <span
      className={
        "inline-flex items-center rounded-row border border-border " +
        "bg-bg3 text-text font-mono font-medium leading-none " +
        pad +
        " " +
        className
      }
    >
      {buttonLabel(k)}
    </span>
  );
}
