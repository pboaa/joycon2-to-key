import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { IconAlertTriangle } from "@tabler/icons-react";
import { Button } from "./ui/Button";
import { useEscapeKey } from "../lib/useEscapeKey";

interface ConfirmOptions {
  title?: string;
  message: string;
  okLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

export type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmCtx = createContext<ConfirmFn>(async () => false);

/** In-app confirmation dialog (custom, not the OS native one). */
export const useConfirm = () => useContext(ConfirmCtx);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    opts: ConfirmOptions;
    resolve: (ok: boolean) => void;
  } | null>(null);

  const confirm = useCallback<ConfirmFn>(
    (opts) => new Promise<boolean>((resolve) => setState({ opts, resolve })),
    [],
  );
  const close = (ok: boolean) => {
    state?.resolve(ok);
    setState(null);
  };

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {state && (
        <ConfirmDialog
          opts={state.opts}
          onCancel={() => close(false)}
          onOk={() => close(true)}
        />
      )}
    </ConfirmCtx.Provider>
  );
}

/** A deliberately small, self-contained dialog — NOT the ModalShell used by the
 * layer/profile editors. A yes/no question doesn't need a titled header bar, a
 * ✕, or a footer chrome; it's one flat card: (icon) heading, message, and the
 * two choices. Sits above every other overlay (z-70). Escape / backdrop cancel;
 * the primary button is focused so Enter confirms. */
function ConfirmDialog({
  opts,
  onCancel,
  onOk,
}: {
  opts: ConfirmOptions;
  onCancel: () => void;
  onOk: () => void;
}) {
  const { t } = useTranslation();
  useEscapeKey(onCancel);

  return createPortal(
    <div
      className="fixed inset-0 z-[var(--z-overlay)] flex items-center justify-center bg-black/55 backdrop-blur-[3px] p-4"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        className="w-[400px] max-w-[calc(100vw-2rem)] rounded-card border border-border bg-bg2 p-5 shadow-modal ring-1 ring-edge animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-3">
          {opts.danger && (
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-danger/15 text-danger">
              <IconAlertTriangle size={17} aria-hidden />
            </span>
          )}
          <div className="min-w-0 flex-1">
            {opts.title && (
              <h3 className="text-title font-semibold text-text">
                {t(opts.title)}
              </h3>
            )}
            <p className="mt-1.5 whitespace-pre-wrap text-body leading-relaxed text-text2">
              {t(opts.message)}
            </p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button className="px-3.5" onClick={onCancel}>
            {opts.cancelLabel ?? t("キャンセル")}
          </Button>
          <Button
            autoFocus
            variant={opts.danger ? "danger" : "primary"}
            className="px-3.5"
            onClick={onOk}
          >
            {opts.okLabel ?? t("OK")}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
