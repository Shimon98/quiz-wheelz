/*
 * Safe teardown for the Pixi shell — one place that knows the destroy order
 * (resize observer -> renderer -> application), so unmount never leaks
 * ticker callbacks or GPU resources and never leaves a dangling canvas in
 * the DOM. Every argument is optional: cleanup may run while async init is
 * still in flight.
 */
export function destroyPixiStudentRace({ app, renderer, stopResize }) {
  stopResize?.();
  renderer?.destroy();
  // removeView detaches app.canvas from the DOM.
  app?.destroy({ removeView: true }, { children: true });
}
