/// <reference types="vite/client" />

export {};

declare global {
  interface Window {
    tally: {
      readonly platform:
        | "aix"
        | "android"
        | "darwin"
        | "freebsd"
        | "haiku"
        | "linux"
        | "openbsd"
        | "sunos"
        | "win32";

      readonly store: {
        /** Read a persisted value. Returns null if the key has never been set. */
        get(key: string): Promise<string | null>;
        /** Write a string value under the given key. */
        set(key: string, value: string): Promise<void>;
      };
    };
  }
}