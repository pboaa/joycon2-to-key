import { useTranslation } from "react-i18next";
import { IconDeviceGamepad2, IconX } from "@tabler/icons-react";
import type { RunningApp } from "../../lib/types";
import type { Selection } from "../../lib/useSelection";
import type { ConfigActions } from "../../lib/useConfigActions";
import { isDefaultProfile } from "../../lib/config/profiles";
import { useConfirmedDelete } from "../../lib/useConfirmedDelete";
import { useDragReorder, type DragReorder } from "../../lib/useDragReorder";
import { moveIndex } from "../../lib/reorder";
import { ReorderableRow } from "../ui/ReorderableRow";
import { RowActionButton } from "../ui/RowActionButton";
import { IconThumb } from "../ui/IconThumb";
import { RowLabel } from "../ui/RowLabel";
import { LIST_ROW_BTN, MID_COL_W } from "../ui/layout";
import { DeleteButton } from "../ui/DeleteButton";
import { TextInput } from "../ui/TextInput";
import { InlineAddField } from "../ui/InlineAddField";
import { FieldLabel } from "../ui/FieldLabel";
import { RunningAppsList } from "../settings/RunningAppsList";
import { ModalShell } from "../ui/ModalShell";
import { useRenameDraft } from "../../lib/useRenameDraft";

/** Left column: the profile's name and the apps it matches (drag to reorder,
 * ✕ to remove). The first app drives the avatar icon. */
function MatchAppsColumn({
  nameInputProps,
  apps,
  appIcons,
  dnd,
  onRemove,
}: {
  nameInputProps: ReturnType<typeof useRenameDraft>["inputProps"];
  apps: string[];
  appIcons: Record<string, string | undefined>;
  dnd: DragReorder;
  onRemove: (exe: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className={`${MID_COL_W} shrink-0 border-r border-border flex flex-col min-h-0`}>
      <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-3">
        <div>
          <FieldLabel>{t("名前")}</FieldLabel>
          <TextInput {...nameInputProps} className="text-heading font-semibold" />
        </div>
        <div>
          <FieldLabel>{t("反応するアプリ (exe)")}</FieldLabel>
          <p className="text-caption text-text3 mb-1.5">
            {t("一番上のアプリのアイコンがプロファイルのアイコンになります。")}
          </p>
          {apps.length === 0 ? (
            <p className="text-caption text-text3">
              {t("未設定（このプロファイルは反応しません）")}
            </p>
          ) : (
            <div {...dnd.containerProps} className="space-y-0.5">
              {apps.map((a, i) => (
                <ReorderableRow key={a} index={i} dnd={dnd} selected={false}>
                  <div className={LIST_ROW_BTN}>
                    <RowLabel
                      selected={false}
                      icon={
                        <IconThumb
                          src={appIcons[a]}
                          fallback={<IconDeviceGamepad2 size={13} aria-hidden />}
                        />
                      }
                      label={<span className="font-mono">{a}</span>}
                    />
                  </div>
                  <RowActionButton
                    selected={false}
                    tone="danger"
                    onClick={() => onRemove(a)}
                    title={t("反応アプリから外す")}
                    className="px-1.5 inline-flex items-center"
                  >
                    <IconX size={13} aria-hidden />
                  </RowActionButton>
                </ReorderableRow>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Right column: add matched apps — pick from the running list, or type an exe. */
function AddAppsColumn({
  added,
  onPick,
  onAdd,
}: {
  added: Set<string>;
  onPick: (exe: string, app: RunningApp) => void;
  onAdd: (exe: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex-1 min-w-0 flex flex-col min-h-0 p-3 gap-2">
      <FieldLabel>{t("起動中のアプリから追加")}</FieldLabel>
      <div className="flex-1 min-h-0 overflow-y-auto rounded-row border border-border">
        <RunningAppsList disabled={added} onPick={onPick} />
      </div>
      <FieldLabel>{t("手動で追加 (exe)")}</FieldLabel>
      <InlineAddField placeholder="chrome.exe" mono size="sm" onAdd={onAdd} />
    </div>
  );
}

/** Settings for one profile (the selected one): name, the apps it matches, and
 * delete. Opened from the ⚙️ on a profile row — profiles no longer have their
 * own page. The default (passthrough) profile only shows a note. */
export function ProfileSettingsModal({
  selection: s,
  actions,
  isNew = false,
  onClose,
}: {
  selection: Selection;
  actions: ConfigActions;
  /** Opened right after ＋ (a fresh, blank profile). Only these are discarded on
   * close when no exe was added — an existing profile is never auto-removed
   * (it may carry key assignments). */
  isNew?: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const confirmedDelete = useConfirmedDelete(actions);
  const name = s.selectedProfile;
  const isDefault = isDefaultProfile(name);
  const matchApps = s.profile?.matchApps ?? [];
  const appIcons = s.profile?.appIcons ?? {};

  const { inputProps } = useRenameDraft(name, actions.renameProfile);

  const appDnd = useDragReorder((from, to) =>
    actions.reorderMatchApps(moveIndex(matchApps, from, to)),
  );
  const addApp = (exe: string) => {
    const v = exe.trim();
    if (v && !matchApps.includes(v)) actions.addMatchApp(v);
  };
  const removeApp = (exe: string) => actions.removeMatchApp(exe);
  const pickApp = (exe: string, app: RunningApp) =>
    actions.addMatchApp(exe, app.icon ?? undefined);
  const added = new Set(matchApps.map((a) => a.toLowerCase()));

  const del = async () => {
    if (isDefault) return;
    // Trivial profile → instant + Undo; profile with apps/assignments → confirm.
    if (await confirmedDelete.deleteProfile(name)) onClose();
  };
  // A just-created profile closed without any exe matches nothing and has no key
  // work yet — discard it (silently, since it was never a real profile). Existing
  // profiles are left alone (may hold layers).
  const close = () => {
    if (isNew && !isDefault && matchApps.length === 0)
      actions.deleteProfile(name, true);
    onClose();
  };

  return (
    <ModalShell
      title="プロファイル設定"
      onClose={close}
      width="w-[min(96vw,800px)]"
      height="h-[76vh]"
      bodyClassName="flex flex-col min-h-0"
      footer={
        isDefault ? undefined : (
          <DeleteButton onClick={del} className="ml-auto px-3 h-7" />
        )
      }
    >
      {isDefault ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="max-w-[320px] text-center text-label text-text3">
            {t("デフォルトは、どのプロファイルにも一致しないアプリで使われます。")}
          </p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex">
          <MatchAppsColumn
            nameInputProps={inputProps}
            apps={matchApps}
            appIcons={appIcons}
            dnd={appDnd}
            onRemove={removeApp}
          />
          <AddAppsColumn added={added} onPick={pickApp} onAdd={addApp} />
        </div>
      )}
    </ModalShell>
  );
}
