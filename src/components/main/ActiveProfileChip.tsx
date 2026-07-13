import { useTranslation } from "react-i18next";
import { IconDeviceGamepad2 } from "@tabler/icons-react";
import { useStore } from "../../store";
import { isDefaultProfile } from "../../lib/config/profiles";

/** Always-visible readout of the runtime-active profile (the one currently in
 * effect for the foreground app). Sits in the title bar so it's visible on every
 * page — the rail highlight only shows it on the key-assignment page. Hidden
 * while nothing is active (disconnected/idle). */
export function ActiveProfileChip() {
  const { t } = useTranslation();
  const active = useStore((s) => s.activeLayer);
  const icon = useStore((s) =>
    active?.profile ? s.profiles?.[active.profile]?.icon : undefined,
  );
  if (!active?.profile) return null;
  const isDefault = isDefaultProfile(active.profile);
  return (
    <span
      data-tip={t("現在有効なプロファイル")}
      className="ml-1 inline-flex max-w-[150px] items-center gap-1 rounded-row border border-border bg-bg3/60 px-1.5 py-0.5 text-caption text-text2 select-none"
    >
      {icon ? (
        <img
          src={icon}
          alt=""
          className="w-3 h-3 shrink-0 rounded-[3px] object-cover"
        />
      ) : (
        <IconDeviceGamepad2 size={11} className="shrink-0 text-accent" aria-hidden />
      )}
      <span className="truncate">
        {isDefault ? t("デフォルト") : active.profile}
      </span>
    </span>
  );
}
