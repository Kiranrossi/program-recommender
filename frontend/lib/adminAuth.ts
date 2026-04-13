import { clearSession } from "./auth";

/** Legacy key — cleared on sign-out for older sessions. */
const ADMIN_SESSION_KEY = "nsrcel_admin_auth";

export function clearAdminSession(): void {
  try {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  } catch {
    // no-op
  }
  clearSession();
}
