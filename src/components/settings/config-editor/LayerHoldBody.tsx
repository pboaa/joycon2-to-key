import { useTranslation } from "react-i18next";
import { IconPlus } from "@tabler/icons-react";
import type { LayerHoldPress } from "../../../lib/types";
import { buttonLabel } from "../../../lib/keyCatalog";
import { Field } from "./Field";
import { HeldModifierKeys } from "./HeldModifierKeys";
import { Select } from "../../ui/Select";
import { Button } from "../../ui/Button";

export function LayerHoldBody({
  press,
  onChange,
  layerOptions,
  btnKey,
  onAddLayer,
}: {
  press: LayerHoldPress;
  onChange: (p: LayerHoldPress) => void;
  layerOptions: string[];
  /** Button key, offered as a one-click "create a layer with this name" target. */
  btnKey?: string;
  /** Create a layer (without switching the edited layer). */
  onAddLayer?: (name: string) => void;
}) {
  // Name the created layer after the button using its readable label
  // (e.g. "sl" → "SL", "stickDown" → "StickDown"), not the internal key.
  const { t } = useTranslation();
  const newLayerName = btnKey ? buttonLabel(btnKey) : "";
  // Offer "＋ create a layer named after this button" only when the button has a
  // name, a creator is wired, and no such layer exists yet.
  const canCreate =
    !!newLayerName && !!onAddLayer && !layerOptions.includes(newLayerName);
  const createLayer = () => {
    if (!newLayerName) return;
    // Set the hold target then create the layer (without switching the edited
    // layer). onAddLayer reads the latest store state, so ordering avoids a
    // stale-closure clobber of the press update.
    onChange({ ...press, layer: newLayerName });
    onAddLayer?.(newLayerName);
  };
  return (
    <div className="divide-y divide-border">
      <div className="py-2">
        <Field
          label="押している間のレイヤー"
          tip="このボタンを押している間だけ、選んだレイヤーに切り替わります（離すと元のレイヤーに戻ります）。"
        >
          <div className="flex flex-wrap items-center gap-1">
            <Select
              size="md"
              fullWidth={false}
              className="flex-1 min-w-0 h-9 px-3 text-body"
              value={press.layer}
              onChange={(e) => onChange({ ...press, layer: e.target.value })}
            >
              <option value="" disabled>
                {t("レイヤーを選択…")}
              </option>
              {layerOptions.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </Select>
            {canCreate && (
              <Button
                size="md"
                className="shrink-0 h-9 inline-flex items-center"
                onClick={createLayer}
                data-tip={t("「{{name}}」という名前のレイヤーを作成", { name: newLayerName })}
                aria-label={t("「{{name}}」という名前のレイヤーを作成", { name: newLayerName })}
              >
                <IconPlus size={14} aria-hidden />
              </Button>
            )}
          </div>
        </Field>
      </div>
      <div className="py-2">
        <Field
          label="一緒に押しておく修飾キー（任意）"
          tip="このレイヤーに切り替えている間ずっと押しておく修飾キー（例: Ctrl）。これで押している間レイヤーが組み合わせボタンの役割も兼ねられます。不要ならなしでOK。"
        >
          <HeldModifierKeys
            inputs={press.inputs ?? []}
            onChange={(next) =>
              onChange({ ...press, inputs: next.length ? next : undefined })
            }
          />
        </Field>
      </div>
    </div>
  );
}
