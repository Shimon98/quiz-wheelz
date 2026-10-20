# S4-04 C2 — unchanged server handoff for Shimon

Authoritative contract: docs/00-project/ARCHITECTURE_AND_CONTRACTS.md, S4-04 B2.
C2 changes no production DTO, enum, route, SSE, mapper, lock order, answer transaction,
movement, fairness or configuration defaults. Every production/client source hash
is compared to clean C1; the three test-only fixture changes are recorded separately. C1/B2 serialization and event-delivery suites are rerun.

Server facts retained: powerUps.guardShieldCharges is persisted possession 0/1;
guardShieldAwardQuestionId is the historical one-time marker. luck.recentEvents
has at most two tangible APPLIED/BLOCKED_BY_SHIELD outcomes in stable ascending audit
ID order. NO_EVENT/NO_EFFECT/fairness remain private. Audit eventId/occurredAtEpochMs
survive GET/reconnect/finish. activeEffects use exact [start,end), server effective
speed and movementUnitsPerSecond; terminal rates are zero and no active effects.

QUESTION_ANSWERED remains the existing refresh signal even for Shield/blocked-Mud
without progress. SSE ID is durable version, delivery is committed-only/ascending;
no Luck or expiry event is introduced. Snapshot ordering remains
(eventVersion,snapshotAtEpochMs); a newer same-version GET may expire an effect.
Reconnect remains reconnect then authoritative GET.

Shimon owns React/Pixi/client mapping, charge display, historical-ID baseline,
eventId deduplication, VFX/animation/audio, server-clock effect-expiry GET scheduling,
visibility/mutation/reconnect coordination and all browser/device acceptance.
The client never recalculates/grants game truth. The frozen contract describes
requirements, not evidence that those client behaviors have been implemented.

The 60000ms activity window remains provisional. No client file is edited and no
client acceptance is claimed. Deployment/activation remain separate gates.
