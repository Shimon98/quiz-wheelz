const FADE_SECONDS = 0.4;

export function createAudioMusicPlayer({ context, destination, createMediaElement, rampSeconds }) {
  let track = null;
  let fading = [];

  function releaseTrack(item) {
    clearTimeout(item.timer);
    if (item.element != null) {
      item.element.pause();
      item.element.removeAttribute("src");
      item.element.load();
    }
    item.source?.disconnect();
    item.gain?.disconnect();
  }

  function open(descriptor) {
    const item = { key: descriptor.key, element: null, source: null, gain: null, timer: null, fresh: true };
    try {
      item.element = createMediaElement();
      item.element.loop = descriptor.loop;
      item.element.preload = "auto";
      item.element.src = descriptor.url;
      // A media element can be routed into Web Audio only once, so each track owns its element and source.
      item.source = context.createMediaElementSource(item.element);
      item.gain = context.createGain();
      item.gain.gain.value = 0;
      item.source.connect(item.gain).connect(destination);
      return item;
    } catch (error) {
      releaseTrack(item);
      throw error;
    }
  }

  function fadeOut(item) {
    item.gain.gain.setTargetAtTime(0, context.currentTime, FADE_SECONDS / 4);
    item.timer = setTimeout(() => {
      fading = fading.filter((other) => other !== item);
      releaseTrack(item);
    }, FADE_SECONDS * 1000);
    fading.push(item);
  }

  // A track still fading out is reused when its key returns, so a quick back-and-forth never restarts it.
  function takeOver(descriptor) {
    const revived = fading.find((item) => item.key === descriptor.key);
    if (revived == null) return open(descriptor);
    clearTimeout(revived.timer);
    fading = fading.filter((item) => item !== revived);
    return revived;
  }

  function releaseFading() {
    fading.forEach(releaseTrack);
    fading = [];
  }

  function release() {
    releaseFading();
    if (track != null) releaseTrack(track);
    track = null;
  }

  function apply({ descriptor, level, audible }) {
    if (track != null && track.key !== descriptor?.key) {
      fadeOut(track);
      track = null;
    }
    if (!audible) {
      releaseFading();
      if (track != null && !track.element.paused) track.element.pause();
      return;
    }
    if (descriptor == null) return;
    track ??= takeOver(descriptor);
    const lag = track.fresh ? FADE_SECONDS / 4 : rampSeconds;
    track.fresh = false;
    track.gain.gain.setTargetAtTime(descriptor.gain * level, context.currentTime, lag);
    if (!track.element.paused || track.element.ended) return;
    // play() rejects on autoplay limits, interruptions and a pause() before buffering ends; none is fatal.
    track.element.play()?.catch?.(() => undefined);
  }

  return {
    sync(request) {
      try {
        apply(request);
      } catch {
        release();
      }
    },
    release,
  };
}
