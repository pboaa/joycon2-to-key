import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "../store";
import { toast } from "./toast";

/** Bridge store error state → toast feedback. `joyConError` and `saveError` are
 * set by the store / JoyCon hook but no component renders them, so a failed
 * connect (Bluetooth off, no adapter) or a failed background save is otherwise
 * invisible. Fire one toast per *new* error value (transition into a non-null
 * string), so a steady-state error that keeps re-setting the same string doesn't
 * spam. Mounted once in App. */
export function useErrorToasts(): void {
  const { t } = useTranslation();
  const joyConError = useStore((s) => s.joyConError);
  const saveError = useStore((s) => s.saveError);
  const prevJoyCon = useRef<string | null>(null);
  const prevSave = useRef<string | null>(null);

  useEffect(() => {
    if (joyConError && joyConError !== prevJoyCon.current) {
      toast.error(t("接続に失敗しました: {{error}}", { error: joyConError }));
    }
    prevJoyCon.current = joyConError;
  }, [joyConError, t]);

  useEffect(() => {
    if (saveError && saveError !== prevSave.current) {
      toast.error(t("保存に失敗しました: {{error}}", { error: saveError }));
    }
    prevSave.current = saveError;
  }, [saveError, t]);
}
