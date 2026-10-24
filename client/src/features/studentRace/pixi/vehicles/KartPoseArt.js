import { Assets } from "pixi.js";

import { STUDENT_RACE_ANIMATION_CONFIG } from "../../config/raceAnimationConfig.js";

const { retryGapMs, maxRetries } = STUDENT_RACE_ANIMATION_CONFIG.kartPoses;

// PlayerKartLayer selects the presentation pose from server mode and accepted result moments.
// Until the requested art is ready, keep the same kart's idle art.
export class KartPoseArt {
  constructor({ loadTexture = (url) => Assets.load(url), prepareTexture = null, now = () => performance.now() } = {}) {
    this.loadTexture = loadTexture;
    this.prepareTexture = prepareTexture;
    this.now = now;
    this.definition = null;
    this.idleTexture = null;
    this.textures = new Map();
    this.loading = new Set();
    this.failures = new Map();
  }

  attach(definition, idleTexture) {
    this.definition = definition;
    this.idleTexture = idleTexture;
  }

  detach() {
    this.definition = null;
    this.idleTexture = null;
  }

  preload() {
    Object.values(this.definition?.poses ?? {}).forEach((url) => this.ensure(url));
  }

  textureFor(mode) {
    const poses = this.definition?.poses;
    const url = poses != null && Object.hasOwn(poses, mode) ? poses[mode] : null;
    if (url == null) return this.idleTexture;
    if (this.textures.has(url)) return this.textures.get(url);
    this.ensure(url);
    return this.idleTexture;
  }

  // One request at a time per pose; a failed one may try again on a later mode entry, a bounded
  // number of times, never within the gap and never while the device is offline.
  ensure(url) {
    if (this.textures.has(url) || this.loading.has(url)) return;
    const failure = this.failures.get(url);
    if (failure != null) {
      const offline = typeof navigator !== "undefined" && navigator.onLine === false;
      if (failure.count > maxRetries || offline || this.now() - failure.at < retryGapMs) return;
    }
    this.loading.add(url);
    Promise.resolve().then(() => this.loadTexture(url)).then(
      (texture) => {
        this.loading.delete(url);
        this.textures.set(url, texture);
        this.prepareTexture?.(texture);
      },
      () => {
        this.loading.delete(url);
        const count = (this.failures.get(url)?.count ?? 0) + 1;
        this.failures.set(url, { count, at: this.now() });
        if (count === 1) console.warn(`Student race kart pose unavailable: ${url}`);
      },
    );
  }
}
