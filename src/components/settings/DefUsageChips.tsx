import { useTranslation } from "react-i18next";
import { useStore } from "../../store";
import { findDefUsages } from "../../lib/defUsage";
import { buttonLabel } from "../../lib/keyCatalog";
import { isDefaultProfile } from "../../lib/config/profiles";

/** "Used in" chips for a saved operation: every button (across all profiles /
 * layers) whose assignment links to it. Clicking a chip jumps to the key-
 * assignment page with that profile / layer / button selected. Together with the
 * per-operation use count, this answers "is it safe to delete this?". Deleting
 * only drops the link (buttons keep their cached keys), so the empty state says
 * as much. */
export function DefUsageChips({ defId }: { defId: string }) {
  const { t } = useTranslation();
  const profiles = useStore((s) => s.profiles);
  const navigate = useStore((s) => s.navigate);
  const setSelectedProfile = useStore((s) => s.setSelectedProfile);
  const setSelectedLayer = useStore((s) => s.setSelectedLayer);
  const setSelectedButton = useStore((s) => s.setSelectedButton);

  const usages = findDefUsages(profiles, defId);

  const jump = (profile: string, layer: string, button: string) => {
    setSelectedProfile(profile);
    setSelectedLayer(layer);
    setSelectedButton(button);
    navigate("keys");
  };

  return (
    <div className="space-y-1.5">
      <div className="text-caption font-semibold text-text2">
        {t("使用中のボタン")}
        {usages.length > 0 && (
          <span className="ml-1 text-text3">（{usages.length}）</span>
        )}
      </div>
      {usages.length === 0 ? (
        <p className="text-caption text-text3 leading-relaxed">
          {t("どのボタンにも割り当てられていません。")}
        </p>
      ) : (
        <div className="flex flex-wrap gap-1">
          {usages.map((u, i) => {
            const profileLabel = isDefaultProfile(u.profile)
              ? t("デフォルト")
              : u.profile;
            const btn = buttonLabel(u.button);
            return (
              <button
                key={`${u.profile}/${u.layer}/${u.button}/${i}`}
                onClick={() => jump(u.profile, u.layer, u.button)}
                data-tip={`${profileLabel} / ${u.layer} / ${btn}`}
                className="inline-flex items-center gap-1 rounded-row border border-border bg-bg2 px-1.5 py-0.5 text-caption text-text2 transition-colors hover:border-accent hover:text-accent"
              >
                <span className="font-medium">{btn}</span>
                <span className="text-text3">{profileLabel}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
