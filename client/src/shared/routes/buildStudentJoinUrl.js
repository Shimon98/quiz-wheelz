import { buildStudentJoinPath } from "../../constants/routeConstants";

/**
 * buildStudentJoinUrl — the absolute link a student opens (or scans as QR)
 * to reach the join page with the room code prefilled. The QR is nothing
 * more than this URL. VITE_PUBLIC_APP_URL wins when a fixed production
 * domain exists; otherwise the current origin serves dev and prod alike.
 */
export function buildStudentJoinUrl(roomCode) {
  const baseUrl =
    import.meta.env.VITE_PUBLIC_APP_URL ?? window.location.origin;

  return `${baseUrl}${buildStudentJoinPath(roomCode)}`;
}
