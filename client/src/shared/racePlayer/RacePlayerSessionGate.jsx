import { Navigate } from "react-router-dom";

import { ROUTES } from "../../constants/routeConstants";
import { isRacePlayerSessionError } from "../../errors/errorChecks";

/*
 * RacePlayerSessionGate — the ONE owner of the invalid-RacePlayer-session
 * policy (C1-01E), shared by the race page and the waiting flow. When the
 * server says the RacePlayer identity is no longer valid, no last-known
 * state may keep authorizing a race surface — the student goes back to
 * join (replace, so Back never returns to a dead page).
 *
 * It knows ONLY session validity + the recovery route. Views, polling,
 * runtime and gameplay lifecycle errors stay with the features — a
 * DISCONNECTED view or a transient NETWORK/SERVER error never trips this.
 */
export default function RacePlayerSessionGate({ error, children }) {
  if (isRacePlayerSessionError(error)) {
    return <Navigate to={ROUTES.STUDENT_JOIN} replace />;
  }

  return children;
}
