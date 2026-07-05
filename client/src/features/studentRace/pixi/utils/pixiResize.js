/*
 * The ONE resize mechanism of the Pixi shell: a ResizeObserver on the mount
 * element drives both the Pixi surface and the renderer's layout. Kept in a
 * single helper so resize logic never spreads across files. Returns a stop
 * function for cleanup.
 */
export function observeMountResize(mountElement, app, renderer) {
  const applySize = () => {
    const width = mountElement.clientWidth;
    const height = mountElement.clientHeight;
    // Hidden/collapsed mounts report 0 — skip, a real size will follow.
    if (width === 0 || height === 0) return;

    app.renderer.resize(width, height);
    renderer.resize(width, height);
  };

  applySize();

  const observer = new ResizeObserver(applySize);
  observer.observe(mountElement);

  return () => observer.disconnect();
}
