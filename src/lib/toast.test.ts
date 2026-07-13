import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast, useToastStore } from "./toast";

const reset = () => useToastStore.setState({ toasts: [] });

describe("toast store", () => {
  beforeEach(reset);

  it("pushes a toast with the given kind and returns its id", () => {
    const id = toast.success("done");
    const list = useToastStore.getState().toasts;
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ id, message: "done", kind: "success" });
  });

  it("caps the stack at 3, dropping the oldest", () => {
    toast.info("1");
    toast.info("2");
    toast.info("3");
    toast.info("4");
    const list = useToastStore.getState().toasts;
    expect(list.map((t) => t.message)).toEqual(["2", "3", "4"]);
  });

  it("dismiss removes only the targeted toast", () => {
    const a = toast.info("a");
    toast.info("b");
    toast.dismiss(a);
    expect(useToastStore.getState().toasts.map((t) => t.message)).toEqual(["b"]);
  });

  it("undo carries an action whose onClick runs the reverse callback", () => {
    const onUndo = vi.fn();
    toast.undo("deleted X", "Undo", onUndo);
    const item = useToastStore.getState().toasts[0];
    expect(item.action?.label).toBe("Undo");
    item.action?.onClick();
    expect(onUndo).toHaveBeenCalledOnce();
  });

  it("errors get a longer default duration than info", () => {
    const e = toast.error("boom");
    const i = toast.info("hi");
    const list = useToastStore.getState().toasts;
    const err = list.find((t) => t.id === e)!;
    const info = list.find((t) => t.id === i)!;
    expect(err.duration).toBeGreaterThan(info.duration);
  });
});
