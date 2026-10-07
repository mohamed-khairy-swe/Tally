import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/global.css";
import { preloadElectronStorage } from "./storage/electronStorage";
import { ThemeProvider } from "./theme/themeContext";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element was not found.");
}

// Fetch all persisted data from the main process before the first render so
// that every useState(loadSnapshot) initialiser finds its data in the cache.
preloadElectronStorage()
  .catch((err) => {
    console.error("[main] Failed to preload storage, proceeding with render:", err);
  })
  .finally(() => {
    createRoot(rootElement).render(
      <StrictMode>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </StrictMode>,
    );
  });