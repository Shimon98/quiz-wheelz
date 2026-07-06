import { Application } from "pixi.js";

/*
 * Creates the Pixi application for the student race screen — manual pixi.js,
 * no @pixi/react (approved architecture: React owns UI state, Pixi owns
 * frames). Sizing is owned entirely by observeMountResize (ONE mechanism —
 * Pixi's own resizeTo only listens to window resize and misses layout-driven
 * element resizes, so it is deliberately not used). No assets are loaded
 * here — the shell must come up before any art exists.
 */
export async function createPixiStudentRaceApp(mountElement) {
  const app = new Application();

  await app.init({
    antialias: true,
    autoDensity: true,
    resolution: window.devicePixelRatio || 1,
    // Real sizes arrive from the resize observer right after mount.
    width: mountElement.clientWidth || 1,
    height: mountElement.clientHeight || 1,
    // Transparent until F paints a world — the page background shows through.
    backgroundAlpha: 0,
  });

  mountElement.appendChild(app.canvas);

  return app;
}
