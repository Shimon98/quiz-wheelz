import { useEffect, useRef } from "react";

import { cx } from "../../../utils/classNameUtils";
import { createPixiStudentRaceApp } from "./createPixiStudentRaceApp";
import { StudentRaceRenderer } from "./StudentRaceRenderer";
import { observeMountResize } from "./utils/pixiResize";
import { destroyPixiStudentRace } from "./utils/pixiCleanup";

/*
 * Thin React wrapper around the manual Pixi shell. The bridge is IMPERATIVE:
 * the app + renderer are created once per mount and held in refs;
 * runtimeState changes are pushed in via renderer.updateRuntimeState().
 * React never renders because of an animation frame, and the Pixi tree is
 * never expressed as JSX (feature README, master plan §5.4).
 */
export default function PixiStudentRaceCanvas({
  runtimeState = null,
  className,
}) {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const latestStateRef = useRef(runtimeState);

  useEffect(() => {
    const mountElement = mountRef.current;

    // app.init() is async — guard against unmount (or a StrictMode effect
    // re-run) landing while init is in flight, which would otherwise mount
    // an orphaned second canvas.
    let cancelled = false;
    let app = null;
    let renderer = null;
    let stopResize = null;

    createPixiStudentRaceApp(mountElement).then((createdApp) => {
      if (cancelled) {
        destroyPixiStudentRace({ app: createdApp });
        return;
      }

      app = createdApp;
      renderer = new StudentRaceRenderer(app);
      rendererRef.current = renderer;
      // Dev-only inspection handle (verification in the hidden preview tab
      // needs manual frames — rAF is paused there). Statically stripped
      // from production builds.
      if (import.meta.env.DEV) {
        window.__studentRaceRenderer = renderer;
      }
      stopResize = observeMountResize(mountElement, app, renderer);

      if (latestStateRef.current) {
        renderer.updateRuntimeState(latestStateRef.current);
      }
    });

    return () => {
      cancelled = true;
      rendererRef.current = null;
      if (import.meta.env.DEV && window.__studentRaceRenderer === renderer) {
        delete window.__studentRaceRenderer;
      }
      destroyPixiStudentRace({ app, renderer, stopResize });
    };
  }, []);

  useEffect(() => {
    latestStateRef.current = runtimeState;
    rendererRef.current?.updateRuntimeState(runtimeState);
  }, [runtimeState]);

  return <div ref={mountRef} className={cx("h-full w-full", className)} />;
}
