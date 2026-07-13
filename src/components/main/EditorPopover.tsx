import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { IconCheck, IconClick } from "@tabler/icons-react";
import type { Definition, DefinitionGroup, PressConfig } from "../../lib/types";
import type { Selection } from "../../lib/useSelection";
import type { ConfigActions } from "../../lib/useConfigActions";
import { SIDE_PANEL_CLS, EDITOR_BODY_PAD, EDITOR_CARD_CLS } from "../ui/layout";
import { Button } from "../ui/Button";
import { KeyCap } from "../ui/KeyCap";
import { Toggle } from "../ui/Toggle";
import { NestedSettings, NumSlider, SettingRow } from "../settings/tabs/shared";
import { ConfigEditor } from "../settings/ConfigEditor";

/** Per-layer stick→mouse settings, shown when the stick (StickPress) is the
 * selected button. The mouse toggle + speed are per-layer (so a "mouse layer"
 * works). The deadzone is a global setting (Settings → Input), so it's not shown here. */
function StickLayerControls({
  sel,
  setLayerMouse,
}: {
  sel: Selection;
  setLayerMouse: ConfigActions["setLayerMouse"];
}) {
  const { t } = useTranslation();
  const layer = sel.layer;
  const name = sel.selectedLayer;
  if (!layer) return null;

  // Left / right sticks have independent mouse settings; edit the side of the
  // selected stick button (stickPress = left, stickPressR = right).
  const isRight = sel.selectedButton === "stickPressR";
  const stickOn = isRight ? !!layer.stickMouseR : !!layer.stickMouse;
  const speed = (isRight ? layer.stickMouseSpeedR : layer.stickMouseSpeed) ?? 12;
  const setOn = (v: boolean) =>
    setLayerMouse(name, isRight ? { stickMouseR: v } : { stickMouse: v });
  const setSpeed = (v: number) =>
    setLayerMouse(name, isRight ? { stickMouseSpeedR: v } : { stickMouseSpeed: v });
  return (
    <div className="mb-2 pb-2 border-b border-border space-y-1">
      <div className="text-caption font-semibold text-text2">
        {t("スティックの動作（このレイヤー・{{side}}）", {
          side: isRight ? t("右") : t("左"),
        })}
      </div>

      {/* 設定タブと完全に同じ共有トグル（ラベル左・チェック右・アイコン無し）。 */}
      <Toggle
        title="スティックをマウスにする"
        checked={stickOn}
        onChange={setOn}
      />

      {/* マウス化オンのときだけ速度を出す（左罫線のネストで従属を示す）。設定の
          入力タブと同じ −−/−/＋/＋＋ ステッパー(NumSlider)で調整する。 */}
      <NestedSettings show={stickOn}>
        <SettingRow label="速度">
          <NumSlider value={speed} min={1} max={100} onChange={setSpeed} />
        </SettingRow>
      </NestedSettings>
    </div>
  );
}

/** Copy / paste this button's whole assignment. Sits in the editor's header row
 * next to the button-name chip, mirroring the figure's right-click menu. */
function CopyPasteButtons({
  onCopy,
  onPaste,
  canPaste,
}: {
  onCopy: () => void;
  onPaste: () => void;
  canPaste: boolean;
}) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const doCopy = () => {
    onCopy();
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <Button
        size="md"
        onClick={doCopy}
        data-tip={t("このボタンの割り当てをコピー")}
        className={
          "inline-flex items-center gap-1 " +
          (copied ? "border-ok text-ok hover:border-ok" : "")
        }
      >
        {copied && <IconCheck size={13} aria-hidden />}
        {t("コピー")}
      </Button>
      <Button
        size="md"
        disabled={!canPaste}
        onClick={onPaste}
        data-tip={
          canPaste
            ? t("コピーした割り当てをこのボタンに貼り付け（上書き）")
            : t("先に「コピー」してください")
        }
        className={
          canPaste ? "border-accent text-accent hover:border-accent hover:bg-accent/10" : ""
        }
      >
        {t("貼り付け")}
      </Button>
    </div>
  );
}

/** Always-present right-hand editor column for the selected button. Shows an
 * empty-state hint until a button on the Joy-Con figure is selected (so it never
 * pops in/out or shifts the layout). */
export const EditorPopover = memo(function EditorPopover({
  selection: sel,
  actions,
  definitions,
  groups,
  onSaveDefinition,
  onManageDefinitions,
  onInsertDefinition,
}: {
  selection: Selection;
  actions: ConfigActions;
  definitions: Definition[];
  groups?: DefinitionGroup[];
  onSaveDefinition: (name: string, press: PressConfig) => string;
  onManageDefinitions: (defId?: string) => void;
  onInsertDefinition: (apply: (def: Definition) => void) => void;
}) {
  const { t } = useTranslation();
  const btnKey = sel.selectedButton;
  const content =
    btnKey && sel.layer ? (
      <div className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable] ${EDITOR_BODY_PAD}`}>
        {/* Same framed card as the saved-operations editor. The button identity
            lives on the Joy-Con figure (selected there), so no header here;
            re-clicking the figure button deselects. */}
        <div className={EDITOR_CARD_CLS}>
          {/* Header: which button is being edited (name chip). Copy/paste of the
              whole assignment sit next to Delete at the bottom (leadingActions). */}
          <div className="flex items-center gap-1.5">
            <KeyCap k={btnKey} size="md" />
          </div>
          {(btnKey === "stickPress" || btnKey === "stickPressR") && (
            <StickLayerControls sel={sel} setLayerMouse={actions.setLayerMouse} />
          )}
          <ConfigEditor
            btnKey={btnKey}
            assignment={sel.selectedAssignment}
            onChange={actions.setAssignment}
            layerOptions={sel.layerNames}
            onAddLayer={actions.ensureLayer}
            leadingActions={
              <CopyPasteButtons
                onCopy={actions.copyButton}
                onPaste={actions.pasteButton}
                canPaste={sel.clipboard != null}
              />
            }
            definitions={definitions}
            groups={groups}
            onSaveDefinition={onSaveDefinition}
            onManageDefinitions={onManageDefinitions}
            onInsertDefinition={onInsertDefinition}
            inheriting={sel.inheriting}
            baseLayerName={sel.baseLayerName}
            baseAssignment={sel.baseAssignment}
          />
        </div>
      </div>
    ) : null;

  return (
    // Full-height flush panel with a left border (same feel as the saved-
    // operations editor), not a floating card.
    <div data-tour="editor" className={SIDE_PANEL_CLS}>
      {content ?? (
        <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
          <IconClick
            size={30}
            className="text-text3/60"
            aria-hidden
          />
          <p className="text-body text-text2 leading-relaxed">
            {t("Joy-Con 図のボタンを選ぶと、")}
            <br />
            {t("ここに設定が表示されます")}
          </p>
        </div>
      )}
    </div>
  );
});
