import { useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { IconDeviceGamepad2, IconDotsVertical, IconWorld } from "@tabler/icons-react";
import type { Selection } from "../../lib/useSelection";
import type { ConfigActions } from "../../lib/useConfigActions";
import { isDefaultProfile } from "../../lib/config/profiles";
import { uniqueName } from "../../lib/uniqueName";
import { useDragReorder } from "../../lib/useDragReorder";
import { useConfirmedDelete } from "../../lib/useConfirmedDelete";
import { moveIndex } from "../../lib/reorder";
import { ReorderableRow } from "../ui/ReorderableRow";
import { IconThumb } from "../ui/IconThumb";
import { RowLabel } from "../ui/RowLabel";
import { RenameInput } from "../ui/RenameInput";
import { RAIL_W, LIST_ROW_BTN, LIST_BODY_CLS } from "../ui/layout";
import { RailHeader } from "../ui/RailHeader";
import { AddRow } from "../ui/AddRow";
import { LayerSettingsModal } from "../settings/LayerSettingsModal";
import { useContextMenu, type MenuItem } from "../ui/ContextMenu";

/** Left rail of the key-assignment page (matches the profiles page's layout):
 * a profile list and a layer list. Rows are one-click switchers and drag to
 * reorder; the trailing → opens that item's settings (profile page / layer
 * modal). Profile *editing* lives on the profiles page; layers are added here.
 * In Stats mode the caller passes `readOnly` (hides editing affordances) and a
 * `footer` (the period picker) — the rail itself knows nothing about heatmaps. */
export function KeysRail({
  selection: s,
  actions,
  onManageProfiles,
  readOnly = false,
  footer,
}: {
  selection: Selection;
  actions: ConfigActions;
  onManageProfiles: (isNew?: boolean) => void;
  /** View-only: profiles/layers just select (no drag / per-row settings / add). */
  readOnly?: boolean;
  /** Extra content pinned under the layers (Stats mode's period picker). */
  footer?: ReactNode;
}) {
  const { t } = useTranslation();
  const ctx = useContextMenu();
  const del = useConfirmedDelete(actions);
  const [layerSettings, setLayerSettings] = useState(false);
  // Inline rename of a layer (double-click its name), like the folder rail.
  const [editingLayer, setEditingLayer] = useState<string | null>(null);
  const [layerDraft, setLayerDraft] = useState("");
  const layerEditRef = useRef<HTMLInputElement>(null);
  const startEditLayer = (name: string) => {
    setEditingLayer(name);
    setLayerDraft(name);
    setTimeout(() => layerEditRef.current?.select(), 0);
  };
  const commitLayerEdit = () => {
    if (editingLayer === null) return;
    const next = layerDraft.trim();
    if (next && next !== editingLayer) actions.renameLayer(editingLayer, next);
    setEditingLayer(null);
  };

  const profileDnd = useDragReorder((from, to) =>
    actions.reorderProfiles(moveIndex(s.profileNames, from, to)),
  );
  const layerDnd = useDragReorder((from, to) => {
    setEditingLayer(null); // a rename in progress must not linger after a move
    actions.reorderLayers(moveIndex(s.layerNames, from, to));
  });

  const addLayer = () => {
    let n = 2;
    const name = (i: number) => `${t("レイヤー")} ${i}`;
    while (s.layerNames.includes(name(n))) n++;
    actions.addLayer(name(n));
  };
  // Create a profile and open its settings modal so it can be named right away.
  const addProfile = () => {
    actions.addProfile(uniqueName("プロファイル", s.profileNames), [], undefined);
    onManageProfiles(true); // new → discard on close if no exe is added
  };

  // Trailing ⋮ (menu) button style. To avoid a busy column of icons it's hidden
  // until the row is hovered — except on the selected row, where it stays visible
  // as a stable target. (ReorderableRow's row is a `group`, so group-hover scopes
  // to the single row.) Clicking it opens the same menu as a right-click.
  const trailBtnCls = (on: boolean) =>
    "px-1 shrink-0 inline-flex items-center transition-opacity " +
    (on
      ? "text-white/70 hover:text-white"
      : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto text-text3 hover:text-accent");

  // Menu items shared by a row's right-click AND its ⋮ button, so both open the
  // same menu. Settings lives in the menu (no separate gear/→ button).
  const profileMenu = (name: string, isDefault: boolean): MenuItem[] => [
    {
      label: "プロファイル設定",
      disabled: isDefault,
      onClick: () => {
        s.setSelectedProfile(name);
        onManageProfiles();
      },
    },
    {
      label: "削除",
      danger: true,
      separated: true,
      disabled: isDefault,
      onClick: () => void del.deleteProfile(name),
    },
  ];
  // Settings first (the primary action); rename lives on double-clicking the row,
  // so it isn't repeated here.
  const layerMenu = (name: string): MenuItem[] => [
    {
      label: "レイヤー設定",
      onClick: () => {
        s.setSelectedLayer(name);
        setLayerSettings(true);
      },
    },
    { label: "コピー", onClick: () => actions.copyLayer(name) },
    {
      label: "貼り付け",
      disabled: !s.layerClipboard,
      onClick: () => actions.pasteLayer(),
    },
    // Hide Delete when it's the only layer (can't delete the last).
    ...(s.layerNames.length > 1
      ? [
          {
            label: "削除",
            danger: true,
            separated: true,
            onClick: () => void del.deleteLayer(name),
          },
        ]
      : []),
  ];
  // Trailing ⋮ button that opens `items` at the click position.
  const menuBtn = (on: boolean, items: MenuItem[]) => (
    <button
      onClick={(e) => ctx.open(e, items)}
      data-tip={t("メニュー")}
      aria-label={t("メニュー")}
      className={trailBtnCls(on)}
    >
      <IconDotsVertical size={15} aria-hidden />
    </button>
  );

  return (
    <div className={`${RAIL_W} shrink-0 border-r border-border bg-bg2 flex flex-col overflow-hidden`}>
      {ctx.node}
      {/* Profiles */}
      <RailHeader title="プロファイル" />
      <div
        {...(readOnly ? {} : profileDnd.containerProps)}
        data-tour="profiles"
        className={`max-h-[38%] ${LIST_BODY_CLS}`}
      >
        {s.profileNames.map((name, i) => {
          const on = name === s.selectedProfile;
          const isDefault = isDefaultProfile(name);
          const icon = s.profileIcons[name];
          return (
            <ReorderableRow
              key={name}
              index={i}
              dnd={profileDnd}
              selected={on}
              enabled={!readOnly && !isDefault}
              reserveHandle
              onContextMenu={
                readOnly ? undefined : (e) => ctx.open(e, profileMenu(name, isDefault))
              }
            >
              <button
                onClick={() => s.setSelectedProfile(name)}
                // Rail is narrow, so long user names truncate — the tip shows the
                // full name (default is short and localized already).
                data-tip={isDefault ? undefined : name}
                className={LIST_ROW_BTN}
              >
                <RowLabel
                  selected={on}
                  icon={
                    <IconThumb
                      src={icon}
                      size={16}
                      fallback={
                        isDefault ? <IconWorld size={11} aria-hidden /> : <IconDeviceGamepad2 size={11} aria-hidden />
                      }
                    />
                  }
                  label={isDefault ? t("デフォルト") : name}
                />
              </button>
              {/* Default is a passthrough with no settings / delete — no menu. */}
              {!readOnly && !isDefault && menuBtn(on, profileMenu(name, isDefault))}
            </ReorderableRow>
          );
        })}
        {!readOnly && <AddRow label="プロファイルを追加" onClick={addProfile} />}
      </div>

      {/* Layers */}
      <RailHeader title="レイヤー" bordered />
      <div
        {...(readOnly ? {} : layerDnd.containerProps)}
        onContextMenu={
          readOnly
            ? undefined
            : (e) =>
                ctx.open(e, [
                  { label: "新規作成", onClick: addLayer },
                  {
                    label: "貼り付け",
                    disabled: !s.layerClipboard,
                    onClick: () => actions.pasteLayer(),
                  },
                ])
        }
        className={`flex-1 min-h-0 ${LIST_BODY_CLS}`}
      >
        {s.layerNames.map((name, i) => {
          const on = name === s.selectedLayer;
          const isBase = name === s.baseLayerName;
          return (
            <ReorderableRow
              key={name}
              index={i}
              dnd={layerDnd}
              selected={on}
              enabled={!readOnly && editingLayer !== name}
              reserveHandle
              onContextMenu={
                readOnly || editingLayer === name
                  ? undefined
                  : (e) => ctx.open(e, layerMenu(name))
              }
            >
              {editingLayer === name ? (
                <RenameInput
                  ref={layerEditRef}
                  value={layerDraft}
                  onChange={setLayerDraft}
                  onCommit={commitLayerEdit}
                  onCancel={() => setEditingLayer(null)}
                />
              ) : (
                <button
                  onClick={() => s.setSelectedLayer(name)}
                  onDoubleClick={readOnly ? undefined : () => startEditLayer(name)}
                  data-tip={name}
                  className={LIST_ROW_BTN}
                >
                  <RowLabel selected={on} label={name} />
                  {isBase && (
                    <span className={"shrink-0 text-caption " + (on ? "opacity-70" : "text-text3")}>
                      {t("初期")}
                    </span>
                  )}
                </button>
              )}
              {!readOnly && editingLayer !== name && menuBtn(on, layerMenu(name))}
            </ReorderableRow>
          );
        })}
        {!readOnly && <AddRow label="レイヤーを追加" onClick={addLayer} />}
      </div>

      {footer}

      {layerSettings && (
        <LayerSettingsModal
          selection={s}
          actions={actions}
          onClose={() => setLayerSettings(false)}
        />
      )}
    </div>
  );
}
