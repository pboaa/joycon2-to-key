/**
 * Japanese display overrides. The app uses the Japanese-source-key scheme (source
 * keys are Japanese), so JA renders each key as-is and needs no dictionary — this
 * map is intentionally empty.
 *
 * It used to remap the old "definition" wording to "operation / saved operations",
 * but every call site now uses the "operation" wording directly (and en.ts is keyed
 * by it), so those overrides were dead and have been removed.
 */
export const ja: Record<string, string> = {};
