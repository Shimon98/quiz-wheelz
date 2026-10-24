export const CHALLENGE_POLICIES = new Set(["random", "turbo", "safe", "none"]);
const PREFERRED_CHALLENGE = Object.freeze({ turbo: "TURBO_TRIAL", safe: "SAFE_RUN" });

function pickChallenge(policy, bot, choices) {
  if (policy === "none") return null;
  if (Object.hasOwn(PREFERRED_CHALLENGE, policy)) {
    const preferred = PREFERRED_CHALLENGE[policy];
    return choices.includes(preferred) ? preferred : null;
  }
  return choices[(bot.index + bot.challenges) % choices.length] ?? null;
}

// One POST per offer: a failed or lost response is never replayed. The next
// race-state poll shows whether it landed (a run started) or the offer expired.
export async function chooseOfferedChallenge(bot, { policy, call }) {
  const offer = bot.gameplay?.challenge?.offer;
  if (offer == null) return "waits for a readable challenge offer";
  if (bot.attemptedOfferId === offer.offerId) {
    return `waits for race state after ${bot.attemptedChoice} on offer ${offer.offerId}`;
  }
  const choice = pickChallenge(policy, bot, offer.choices ?? []);
  if (choice == null) return "waits for the challenge offer to expire";
  bot.attemptedOfferId = offer.offerId;
  bot.attemptedChoice = choice;
  try {
    const { data } = await call("/race-players/me/challenge/choice", {
      method: "POST", cookie: bot.cookie, body: { offerId: offer.offerId, choice },
    });
    bot.challenges += 1;
    bot.gameplay = data?.snapshot?.gameplay ?? bot.gameplay;
    return `chose ${choice}`;
  } catch (error) {
    throw new Error(`${choice} on offer ${offer.offerId} not confirmed, no automatic retry: ${error.message}`);
  }
}
