import { memo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type {
  ButtonAssignment,
  Definition,
  DefinitionGroup,
  PressConfig,
  PressType,
} from "../../lib/types";
import { shortLabel } from "../../lib/variants";
import { createPress, linkedPress } from "../../lib/config/press";
import { Button } from "../ui/Button";
import { VariantRow } from "./config-editor/VariantRow";
import { PressTypePicker } from "./config-editor/PressTypePicker";

interface Props {
  btnKey: string;
  assignment: ButtonAssignment | null;
  onChange: (next: ButtonAssignment | null) => void;
  /** Existing layer names in this profile — offered as LayerHold targets. */
  layerOptions: string[];
  /** Create a layer (for LayerHold's "＋ create layer named after button"). */
  onAddLayer: (name: string) => void;
  definitions: Definition[];
  groups?: DefinitionGroup[];
  onSaveDefinition: (name: string, press: PressConfig) => string;
  onManageDefinitions: (defId?: string) => void;
  onInsertDefinition: (apply: (def: Definition) => void) => void;
  /** Extra controls placed at the left of the bottom action row, before Delete
   * (the button editor passes copy/paste here; the definitions editor omits it). */
  leadingActions?: ReactNode;
  /** True when the current layer inherits the base (shows inheritance UI). */
  inheriting: boolean;
  baseLayerName: string;
  baseAssignment: ButtonAssignment | null;
}

/** Editor for one button's single assignment. Also handles layer inheritance. */
export const ConfigEditor = memo(function ConfigEditor({
  btnKey,
  assignment,
  onChange,
  layerOptions,
  onAddLayer,
  definitions,
  groups,
  onSaveDefinition,
  onManageDefinitions,
  onInsertDefinition,
  leadingActions,
  inheriting,
  baseLayerName,
  baseAssignment,
}: Props) {
  // Overriding an inherited button seeds this layer from the base's assignment,
  // but as an independent, editable copy. Keeping a definition link would render
  // a read-only linked card that can't be rewritten in this layer (the whole
  // point of overriding is to make this layer differ), so drop `def` and keep
  // its cached press as the editable starting point.
  const overrideFromBase = () => {
    if (!baseAssignment) return;
    const copy = structuredClone(baseAssignment);
    delete copy.def;
    onChange(copy);
  };

  const inherited = inheriting && assignment === null && baseAssignment !== null;
  const { t: tr } = useTranslation();
  const overridden = inheriting && assignment !== null;

  const active = assignment;
  const setActive = (next: ButtonAssignment | null) => onChange(next);
  const createForType = (t: PressType) =>
    setActive({ press: createPress(t, { btnKey, layerOptions }) });
  const pickForNew = () =>
    onInsertDefinition((d) => setActive({ def: d.id, press: linkedPress(d) }));

  return (
    <div>
      {overridden && (
        <div className="flex items-center justify-between mb-1.5 text-caption">
          <span className="text-warn">
            {tr("このレイヤーで上書き中")}
          </span>
          <Button size="xs" onClick={() => onChange(null)}>
            {tr("継承に戻す（上書き削除）")}
          </Button>
        </div>
      )}

      {inherited ? (
        <div className="rounded-row border border-dashed border-border p-2 space-y-1">
          <p className="text-label text-text2">
            {tr("ベースレイヤー「{{name}}」から継承中", { name: baseLayerName })}
          </p>
          <p className="text-caption font-mono text-text3 truncate">
            {baseAssignment ? shortLabel(baseAssignment.press) : ""}
          </p>
          <Button variant="primary" size="xs" onClick={overrideFromBase}>
            {tr("このレイヤーで上書き")}
          </Button>
        </div>
      ) : active ? (
        <VariantRow
          btnKey={btnKey}
          variant={active}
          onChange={setActive}
          onDelete={() => setActive(null)}
          leadingActions={leadingActions}
          layerOptions={layerOptions}
          onAddLayer={onAddLayer}
          definitions={definitions}
          groups={groups}
          onSaveDefinition={onSaveDefinition}
          onManageDefinitions={onManageDefinitions}
          onInsertDefinition={onInsertDefinition}
        />
      ) : (
        <div className="rounded-row border border-dashed border-border p-2">
          <PressTypePicker
            type={null}
            onSelectType={createForType}
            onPickDefinition={definitions.length > 0 ? pickForNew : undefined}
          />
        </div>
      )}
    </div>
  );
});
