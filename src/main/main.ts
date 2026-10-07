import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

app.commandLine.appendSwitch("no-sandbox");
app.commandLine.appendSwitch("disable-setuid-sandbox");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDevelopment = process.env.TALLY_DEV === "true";

app.setName("Tally");

// ---------------------------------------------------------------------------
// electron-store — single shared store for all Tally data
// ---------------------------------------------------------------------------
// electron-store is ESM-only in v8+. We use a dynamic import so the rest of
// this CommonJS/ESM-hybrid entry point still compiles under NodeNext.
let storeInstance: import("electron-store").default | null = null;

async function getStore(): Promise<import("electron-store").default> {
  if (storeInstance) return storeInstance;
  const { default: Store } = await import("electron-store");
  storeInstance = new Store({
    name: "tally-data",
    cwd: app.getPath("userData"),
  });
  return storeInstance;
}

// ---------------------------------------------------------------------------
// IPC handlers — renderer calls these via the preload bridge
// ---------------------------------------------------------------------------
function registerStoreHandlers(): void {
  // store:get  →  returns the stored string (or null if key missing)
  ipcMain.handle("store:get", async (_event, key: string) => {
    try {
      const store = await getStore();
      const value = store.get(key as never, null);
      return typeof value === "string" ? value : null;
    } catch (err) {
      console.error(`[main] Failed to get key "${key}" from store:`, err);
      return null;
    }
  });

  // store:set  →  stores a string value under the given key
  ipcMain.handle("store:set", async (_event, key: string, value: string) => {
    try {
      const store = await getStore();
      store.set(key as never, value);
    } catch (err) {
      console.error(`[main] Failed to set key "${key}" in store:`, err);
    }
  });
}

// ---------------------------------------------------------------------------
// Window
// ---------------------------------------------------------------------------
function createMainWindow(): void {
  const iconPath = isDevelopment
    ? path.join(__dirname, "../../src/renderer/assets/Tally.svg")
    : path.join(__dirname, "../renderer/Tally.svg");

  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    icon: iconPath,

    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.js"),

      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,

      backgroundThrottling: false,
      autoplayPolicy: "no-user-gesture-required",
    },
  });

  if (isDevelopment) {
    void mainWindow.loadURL("http://localhost:5173");
  } else {
    void mainWindow.loadFile(
      path.join(__dirname, "../renderer/index.html"),
    );
  }
}

app.whenReady().then(() => {
  registerStoreHandlers();
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});