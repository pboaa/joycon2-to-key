import { useStore } from "../store";

/** The settings slice of the unified store. Persisted (debounced) on change by
 * the store. */
export function useSettings() {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.setSettings);
  return { settings, updateSettings };
}
