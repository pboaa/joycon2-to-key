import { useEffect, useState, type ChangeEvent, type KeyboardEvent } from "react";

/** Inline-rename editing for a name field. Keeps a local draft seeded from the
 * current `name` (re-seeded when it changes elsewhere), and commits on blur /
 * Enter: a non-empty, changed value calls `onRename`; anything else reverts.
 * Shared by the layer and profile settings modals, which had this verbatim.
 * Spread `inputProps` onto the name <input> (TextInput). */
export function useRenameDraft(
  name: string,
  onRename: (from: string, to: string) => void,
) {
  const [draft, setDraft] = useState(name);
  useEffect(() => setDraft(name), [name]);

  const commit = () => {
    const v = draft.trim();
    if (v && v !== name) onRename(name, v);
    else setDraft(name);
  };

  const inputProps = {
    value: draft,
    onChange: (e: ChangeEvent<HTMLInputElement>) => setDraft(e.target.value),
    onBlur: commit,
    onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") e.currentTarget.blur();
    },
  };

  return { draft, setDraft, commit, inputProps };
}
