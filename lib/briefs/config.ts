/**
 * Backend API configuration.
 *
 * Mirrors the consumer side of the `briefs` contract used by the extension.
 * Each value is resolved from `import.meta.env.VITE_*` in the browser/Vite
 * build, from `process.env.VITE_*` under Node tests, and falls back to a
 * local-development default.
 *
 * Architecture note: the `http://localhost:8000` base-URL and the
 * `dev-secret-change-me` API-key fallbacks are explicit, non-secret
 * development defaults (mirroring the api project's documented `.env`
 * defaults — `API_API_KEY=dev-secret-change-me`). They are not injected into
 * production builds when `VITE_API_BASE_URL` / `VITE_API_KEY` are supplied by
 * the build environment.
 */

const DEFAULT_API_BASE_URL = "http://localhost:8000";
const DEFAULT_API_KEY = "dev-secret-change-me";

function readEnvVar(name: string): string {
  // Browser / Vite build-time env.
  const viteEnv =
    typeof import.meta !== "undefined" &&
    (import.meta as unknown as Record<string, unknown>).env
      ? ((import.meta as unknown as Record<string, unknown>).env as Record<
          string,
          unknown
        >)
      : undefined;

  const viteValue = viteEnv ? String(viteEnv[name] ?? "") : "";

  // Node test runner env.
  const nodeValue =
    typeof process !== "undefined" && process.env
      ? String(process.env[name] ?? "")
      : "";

  return viteValue || nodeValue;
}

/**
 * Lazy accessor for the backend base URL. Resolved on first call so tests and
 * consumers can set the environment before any API request is made.
 */
let cachedApiBaseUrl: string | undefined;

export function getApiBaseUrl(): string {
  if (cachedApiBaseUrl === undefined) {
    cachedApiBaseUrl = readEnvVar("VITE_API_BASE_URL") || DEFAULT_API_BASE_URL;
  }
  return cachedApiBaseUrl;
}

/**
 * Lazy accessor for the shared `X-API-Key` secret required by every
 * `/v1/briefs/*` route. Resolved on first call, mirroring `getApiBaseUrl`.
 */
let cachedApiKey: string | undefined;

export function getApiKey(): string {
  if (cachedApiKey === undefined) {
    cachedApiKey = readEnvVar("VITE_API_KEY") || DEFAULT_API_KEY;
  }
  return cachedApiKey;
}
