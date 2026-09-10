import { OpponentKart } from "../opponents/OpponentKart.js";

export class OpponentLayer {
  constructor(container, options) {
    this.container = container;
    this.options = options;
    this.byPlayerId = new Map();
    this.pool = [];
    this.runtimeIdentity = null;
  }

  acquire() {
    return this.pool.pop() ?? new OpponentKart(this.container, this.options);
  }

  release(id, kart) {
    this.byPlayerId.delete(id);
    kart.reset();
    this.pool.push(kart);
  }

  applyRuntimeState(runtime) {
    const identity = `${runtime?.race?.id}:${runtime?.player?.racePlayerId}`;
    if (this.runtimeIdentity !== identity) {
      for (const [id, kart] of this.byPlayerId) this.release(id, kart);
      this.runtimeIdentity = identity;
    }
    const activeIds = new Set();
    const opponents = [...(runtime?.opponents ?? [])].sort((a, b) => a.racePlayerId - b.racePlayerId);
    for (const opponent of opponents) {
      activeIds.add(opponent.racePlayerId);
      let kart = this.byPlayerId.get(opponent.racePlayerId);
      if (kart == null) {
        kart = this.acquire();
        kart.assignIdentity(opponent.racePlayerId);
        this.byPlayerId.set(opponent.racePlayerId, kart);
      }
      kart.applySnapshot(opponent, runtime.lastSnapshotAtEpochMs);
    }
    for (const [id, kart] of this.byPlayerId) {
      if (!activeIds.has(id)) kart.beginAuthoritativeRemoval();
    }
  }

  resize() {}

  update(frame) {
    for (const [id, kart] of this.byPlayerId) {
      kart.update(frame);
      if (kart.releasable && (!kart.finishReleased || kart.removed)) this.release(id, kart);
    }
  }

  destroy() {
    for (const kart of this.byPlayerId.values()) kart.destroy();
    this.pool.forEach((kart) => kart.destroy());
    this.byPlayerId.clear();
    this.pool.length = 0;
  }
}
