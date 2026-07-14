import { useCallback, useEffect, useRef, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import {
  connectJoyCon,
  disconnectJoyCon,
  getActiveAppName,
  getActiveLayer,
  getBattery,
  getConnectionState,
  getJoyConState,
} from "./tauri";
import type { ActiveLayer, ConnectionState, JoyConState } from "./types";
import { playSound } from "./sounds";
import { useStore } from "../store";

/** Low-frequency backstop poll interval. Connection state and active layer are
 * pushed via the backend's `emit`, so this only runs to (a) fetch battery /
 * foreground app name (which have no events) and (b) self-correct if an event is
 * ever missed or a change happens before setup. */
const BACKSTOP_POLL_MS = 1500;
/** Poll interval for live stick/button display (runs only while shown). */
const SNAPSHOT_POLL_MS = 80;

export interface JoyConHook {
  connectionState: ConnectionState;
  currentApp: string;
  activeLayer: ActiveLayer | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  lastError: string | null;
}

/** If a poll result matches the previous one, return the old object to avoid a re-render. */
function sameActiveLayer(a: ActiveLayer | null, b: ActiveLayer): boolean {
  return a !== null && a.profile === b.profile && a.layer === b.layer;
}

/** packetId only increments each frame and isn't shown, so exclude it from the comparison. */
function sameSnapshot(a: JoyConState | null, b: JoyConState): boolean {
  if (a === null) return false;
  if (a.stick.x !== b.stick.x || a.stick.y !== b.stick.y) return false;
  const ab = a.buttons as unknown as Record<string, boolean>;
  const bb = b.buttons as unknown as Record<string, boolean>;
  for (const k in bb) if (ab[k] !== bb[k]) return false;
  return true;
}

/**
 * Subscribe only to connection state and foreground app name, at low frequency.
 * The high-frequency snapshot is subscribed via `useJoyConSnapshot`, avoiding
 * wasteful re-renders / GPU compositing while idle.
 */
export function useJoyCon(): JoyConHook {
  const connectionState = useStore((s) => s.connectionState);
  const currentApp = useStore((s) => s.currentApp);
  const activeLayer = useStore((s) => s.activeLayer);
  const lastError = useStore((s) => s.joyConError);

  // Connect / auto-disconnect sounds. Not played on a manual (user) disconnect.
  const prevConn = useRef(connectionState);
  const manualDisconnect = useRef(false);
  useEffect(() => {
    const prev = prevConn.current;
    prevConn.current = connectionState;
    if (prev === connectionState) return;
    const { settings } = useStore.getState();
    if (connectionState === "connected") {
      // Play the connect sound on the PC side. Connect-time controller vibration
      // is handled by the backend (after post-connect init) per the
      // connect_vibration setting, so it's not handled here.
      playSound(settings.connectSound);
      manualDisconnect.current = false;
    } else if (prev === "connected") {
      // "connected → anything else" = the connection was lost (auto-disconnect / link drop).
      if (manualDisconnect.current) manualDisconnect.current = false;
      else playSound(settings.disconnectSound);
    } else {
      // A transition between non-connected states (e.g. reconnecting →
      // disconnected after Stop mid-scan): the manual-disconnect flag can't
      // apply here, so drop it — otherwise it would linger and wrongly suppress
      // the sound on a later genuine connected → disconnected drop.
      manualDisconnect.current = false;
    }
  }, [connectionState]);

  // Low-frequency backstop poll: fetches battery + current app (no events for
  // those) and self-corrects connection state / active layer should a pushed
  // event be missed or arrive before setup published the app handle. The first
  // tick fires immediately, so it doubles as the initial state fetch.
  useEffect(() => {
    let stopped = false;
    let timer: number | null = null;

    const tick = async () => {
      try {
        const [cs, app, batt, al] = await Promise.all([
          getConnectionState(),
          getActiveAppName(),
          getBattery(),
          getActiveLayer(),
        ]);
        if (stopped) return;
        const st = useStore.getState();
        st.setConnectionState(cs);
        st.setCurrentApp(app);
        st.setBattery(batt);
        if (!sameActiveLayer(st.activeLayer, al)) st.setActiveLayer(al);
      } catch (e) {
        if (!stopped) useStore.getState().setJoyConError(String(e));
      } finally {
        if (!stopped) timer = window.setTimeout(tick, BACKSTOP_POLL_MS);
      }
    };
    void tick();

    return () => {
      stopped = true;
      if (timer !== null) window.clearTimeout(timer);
    };
  }, []);

  // Live push updates: the backend emits on change, so connection changes and
  // physical-controller layer switches reflect with little lag (no fast poll).
  useEffect(() => {
    const pending = [
      listen<ConnectionState>("connection-state", (e) => {
        useStore.getState().setConnectionState(e.payload);
      }),
      listen<ActiveLayer>("active-layer", (e) => {
        const st = useStore.getState();
        if (!sameActiveLayer(st.activeLayer, e.payload)) {
          st.setActiveLayer(e.payload);
        }
      }),
    ];
    return () => {
      for (const p of pending) p.then((off) => off()).catch(() => {});
    };
  }, []);

  const connect = useCallback(async () => {
    const st = useStore.getState();
    st.setJoyConError(null);
    st.setConnectionState("reconnecting");
    try {
      await connectJoyCon();
    } catch (e) {
      useStore.getState().setJoyConError(String(e));
    }
  }, []);

  const disconnect = useCallback(async () => {
    manualDisconnect.current = true; // a manual disconnect doesn't play the disconnect sound
    try {
      await disconnectJoyCon();
    } catch (e) {
      useStore.getState().setJoyConError(String(e));
    }
  }, []);

  return {
    connectionState,
    currentApp,
    activeLayer,
    connect,
    disconnect,
    lastError,
  };
}

/**
 * Subscribe at high frequency to the Joy-Con's live stick/button state. Polls
 * only while a component calling this hook is mounted, and stops on unmount.
 */
export function useJoyConSnapshot(): JoyConState | null {
  const [state, setState] = useState<JoyConState | null>(null);
  const stoppedRef = useRef(false);

  useEffect(() => {
    stoppedRef.current = false;
    let timer: number | null = null;

    const tick = async () => {
      try {
        const st = await getJoyConState();
        if (stoppedRef.current) return;
        setState((prev) => (st !== null && sameSnapshot(prev, st) ? prev : st));
      } catch {
        // Display-only, so swallow errors (connection state is handled by useJoyCon).
      } finally {
        if (!stoppedRef.current) timer = window.setTimeout(tick, SNAPSHOT_POLL_MS);
      }
    };
    void tick();

    return () => {
      stoppedRef.current = true;
      if (timer !== null) window.clearTimeout(timer);
    };
  }, []);

  return state;
}
