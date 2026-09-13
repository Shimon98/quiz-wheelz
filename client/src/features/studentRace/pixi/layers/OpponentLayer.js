import { OpponentKart, OPPONENT_VISIBILITY_STATES as STATES } from "../opponents/OpponentKart.js";
import { STUDENT_RACE_VISUAL_CONFIG } from "../../config/raceVisualConfig.js";

const ZONES = STUDENT_RACE_VISUAL_CONFIG.viewDepthZones;
const DENSITY = STUDENT_RACE_VISUAL_CONFIG.opponents.density;

export class OpponentLayer {
  constructor(container, options) {
    this.container = container;
    this.options = options;
    this.byPlayerId = new Map();
    this.pool = [];
    this.runtimeIdentity = null;
    this.selected = new Map();
    this.zones = new Map();
  }

  acquire() {
    return this.pool.pop() ?? new OpponentKart(this.container, this.options);
  }

  release(id, kart) {
    this.byPlayerId.delete(id);
    this.selected.delete(id);
    this.zones.delete(id);
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
      kart.applySnapshot(opponent, runtime.lastSnapshotAtEpochMs, runtime.totalDistance ?? Infinity);
    }
    for (const [id, kart] of this.byPlayerId) {
      if (!activeIds.has(id)) kart.beginAuthoritativeRemoval();
    }
  }

  resize() {}

  zoneFor(kart) {
    const depth = kart.projected?.visible ? kart.projected.depth : null;
    const previous = this.zones.get(kart.racePlayerId);
    if (depth == null) return previous;
    const held = previous && depth >= ZONES[previous].minDepth - DENSITY.zoneHysteresis &&
      (previous === "near" || depth <= ZONES[previous].maxDepth + DENSITY.zoneHysteresis);
    const zone = held ? previous : depth < ZONES.far.maxDepth ? "far" : depth < ZONES.mid.maxDepth ? "mid" : "near";
    this.zones.set(kart.racePlayerId, zone);
    return zone;
  }

  selectDrawable(frame) {
    const next = new Map();
    const candidates = { near: [], mid: [], far: [] };
    for (const [id, kart] of this.byPlayerId) {
      const zone = this.zoneFor(kart);
      const retained = this.selected.has(id) && kart.visibilityState !== STATES.HIDDEN;
      const laneFits = zone === "far" || kart.laneOffsetMagnitude <= frame.laneLimits[zone];
      if (zone && laneFits && !kart.removed && (kart.canEnter || retained)) candidates[zone].push(kart);
    }
    const laneDistance = (kart) => Math.abs(kart.laneNumber - frame.runtimeState.player.laneNumber);
    for (const zone of Object.keys(candidates)) {
      const incumbent = (kart) => this.selected.get(kart.racePlayerId) === zone ? 0
        : kart.visibilityState === STATES.HIDDEN ? 2 : 1;
      candidates[zone].sort((a, b) => incumbent(a) - incumbent(b) ||
        (zone === "near" ? laneDistance(a) - laneDistance(b) : Math.abs(a.relativeDistance) - Math.abs(b.relativeDistance)) ||
        (zone === "near" ? Math.abs(a.relativeDistance) - Math.abs(b.relativeDistance) : laneDistance(a) - laneDistance(b)) ||
        a.racePlayerId - b.racePlayerId);
      for (const kart of candidates[zone].slice(0, DENSITY[`${zone}MaxVisible`])) next.set(kart.racePlayerId, zone);
    }
    this.selected = next;
  }

  update(frame) {
    for (const kart of this.byPlayerId.values()) kart.prepareFrame(frame);
    this.selectDrawable(frame);
    for (const [id, kart] of this.byPlayerId) {
      kart.presentFrame(frame, this.selected.has(id));
      if (kart.releasable && kart.removed) this.release(id, kart);
    }
  }

  destroy() {
    for (const kart of this.byPlayerId.values()) kart.destroy();
    this.pool.forEach((kart) => kart.destroy());
    this.byPlayerId.clear();
    this.pool.length = 0;
    this.selected.clear();
    this.zones.clear();
  }
}
