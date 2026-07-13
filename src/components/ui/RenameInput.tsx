import { forwardRef } from "react";

/** The inline text field shown while renaming a list row (layer / folder …).
 * Enter or blur commits, Escape cancels. A compact, always-accent-bordered skin
 * sized to the row it replaces — deliberately tighter than the roomy TextInput,
 * so the row height doesn't jump when editing. Shared so every inline rename
 * looks and behaves the same; pass the ref to focus/select it on edit start. */
export const RenameInput = forwardRef<
  HTMLInputElement,
  {
    value: string;
    onChange: (v: string) => void;
    onCommit: () => void;
    onCancel: () => void;
  }
>(function RenameInput({ value, onChange, onCommit, onCancel }, ref) {
  return (
    <input
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onCommit();
        if (e.key === "Escape") onCancel();
      }}
      onBlur={onCommit}
      className="flex-1 min-w-0 px-1 py-1 text-body rounded-row bg-bg2 text-text border border-accent"
    />
  );
});
