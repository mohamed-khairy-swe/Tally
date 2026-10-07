import { contextBridge, ipcRenderer } from "electron";

// ---------------------------------------------------------------------------
// Tally IPC Bridge
// ---------------------------------------------------------------------------
// This is the ONLY place the renderer ever touches Electron APIs.
// contextIsolation: true means the renderer cannot access ipcRenderer directly
// — it can only call the functions we explicitly expose here.
// ---------------------------------------------------------------------------

const tallyApi = Object.freeze({
  platform: process.platform,

  store: Object.freeze({
    /**
     * Reads a value from the electron-store (main process).
     * Returns the stored string, or null if the key has never been set.
     */
    get: (key: string): Promise<string | null> =>
      ipcRenderer.invoke("store:get", key),

    /**
     * Writes a string value to the electron-store (main process).
     */
    set: (key: string, value: string): Promise<void> =>
      ipcRenderer.invoke("store:set", key, value),
  }),
});

contextBridge.exposeInMainWorld("tally", tallyApi);

// ---------------------------------------------------------------------------
// Type declaration — renderer code imports this via /// <reference types>
// or by adding src/renderer/env.d.ts (see electronStorage.ts).
// ---------------------------------------------------------------------------
export type TallyApi = typeof tallyApi;