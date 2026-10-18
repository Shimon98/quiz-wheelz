import { AlphaFilter, Container } from "pixi.js";

export class KartArtCrossfade {
  constructor(durationMs) {
    this.durationMs = durationMs;
    this.transitionMs = durationMs;
    this.base = null;
    this.overlay = null;
    this.surface = null;
    this.filter = null;
    this.target = null;
    this.elapsedMs = 0;
    this.warmFrames = 0;
  }

  attach(base, overlay) {
    this.base = base;
    this.overlay = overlay;
    this.target = base.texture;
    this.surface = new Container();
    this.filter = new AlphaFilter({ alpha: 1, resolution: "inherit", antialias: "inherit" });
    this.surface.filters = [this.filter];
    const parent = base.parent;
    parent?.addChildAt(this.surface, parent.getChildIndex(base));
    this.surface.addChild(base, overlay);
    // Sum weighted art in an isolated surface. Normal source-over blending would
    // make the shared body translucent at the midpoint and reveal the road.
    overlay.blendMode = "add";
    this.hideOverlay();
  }

  detach() {
    this.surface?.removeChildren();
    this.surface?.destroy();
    this.filter?.destroy();
    this.base = null;
    this.overlay = null;
    this.surface = null;
    this.filter = null;
    this.target = null;
  }

  show(texture, { deltaMs, instant = false, durationMs = this.durationMs }) {
    if (this.base == null || texture == null) return;
    if (instant) {
      this.target = texture;
      this.commit();
      return;
    }
    if (texture !== this.target) this.retarget(texture, durationMs);
    if (!this.overlay.visible) {
      if (this.warmFrames > 0) {
        this.warmFrames -= 1;
        if (this.warmFrames === 0) this.filter.enabled = false;
      }
      return;
    }
    this.elapsedMs = Math.min(this.transitionMs, this.elapsedMs + Math.max(0, deltaMs));
    const progress = this.elapsedMs / this.transitionMs;
    this.overlay.alpha = progress * progress * (3 - 2 * progress);
    this.base.alpha = 1 - this.overlay.alpha;
    if (progress >= 1) this.commit();
  }

  retarget(texture, durationMs) {
    if (this.overlay.visible) {
      if (texture !== this.base.texture) return;
      // Reverse from the current blend, without jumping to the dominant pose.
      this.base.texture = this.target;
      this.target = texture;
      this.overlay.texture = texture;
      this.elapsedMs = (1 - this.elapsedMs / this.transitionMs) * durationMs;
      this.transitionMs = durationMs;
      return;
    }
    this.target = texture;
    this.elapsedMs = 0;
    this.transitionMs = durationMs;
    this.base.alpha = 1;
    this.overlay.texture = texture;
    this.overlay.alpha = 0;
    this.overlay.visible = true;
    this.filter.enabled = true;
  }

  commit() {
    this.base.texture = this.target;
    this.base.alpha = 1;
    this.hideOverlay();
  }

  hideOverlay() {
    this.overlay.alpha = 0;
    this.overlay.visible = false;
    this.filter.enabled = false;
    this.warmFrames = 0;
  }

  // The filter's shader compiles on its first draw, which stalled the first Turbo win for 60–180 ms.
  // One frame through the filter with the overlay hidden draws the same picture, in a quiet moment.
  prewarm() {
    if (this.filter == null || this.overlay.visible) return;
    this.filter.enabled = true;
    this.warmFrames = 2;
  }
}
