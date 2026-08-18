/*
 * questionTiming — the ONE remaining-time formula for the current question,
 * shared by the timer display (StudentRaceQuestionTimer) and the expiry
 * scheduling in useStudentRaceQuestion so they can never disagree.
 *
 * The server sends absolute epoch milliseconds (expiresAtEpochMs) plus its
 * own clock at response time; the mapper turned that into
 * serverClockOffsetMs = serverTimeEpochMs - clientReceivedAtEpochMs, so a
 * device clock that is minutes wrong still counts down correctly. Display
 * only — the server remains the expiry authority.
 */
export function getQuestionRemainingMs(
  { expiresAtEpochMs, serverClockOffsetMs },
  clientNowEpochMs = Date.now(),
) {
  const estimatedServerNowMs = clientNowEpochMs + serverClockOffsetMs;

  return Math.max(0, expiresAtEpochMs - estimatedServerNowMs);
}
