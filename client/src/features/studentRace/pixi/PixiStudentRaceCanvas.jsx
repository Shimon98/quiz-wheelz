import { useEffect, useImperativeHandle, useRef } from "react";

import { cx } from "../../../utils/classNameUtils";
import { createPixiStudentRaceApp } from "./createPixiStudentRaceApp";
import { StudentRaceRenderer } from "./StudentRaceRenderer";
import { observeMountResize } from "./utils/pixiResize";
import { destroyPixiStudentRace } from "./utils/pixiCleanup";

export default function PixiStudentRaceCanvas({
  runtimeState = null,
  finishPresentation = null,
  className,
  ref,
}) {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const pendingMomentsRef = useRef([]);
  const latestStateRef = useRef(runtimeState);
  const latestFinishPresentationRef = useRef(finishPresentation);

  useImperativeHandle(ref, () => ({
    playMoments(batch) {
      if (rendererRef.current == null) pendingMomentsRef.current.push(batch);
      else rendererRef.current.playMoments(batch);
    },
  }), []);

  useEffect(() => {
    const mountElement = mountRef.current;

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
      if (import.meta.env.DEV) {
        window.__studentRaceRenderer = renderer;
      }
      stopResize = observeMountResize(mountElement, app, renderer);

      if (latestStateRef.current) {
        renderer.updateRuntimeState(latestStateRef.current);
      }
      renderer.updateFinishPresentation(latestFinishPresentationRef.current);
      pendingMomentsRef.current.forEach((batch) => renderer.playMoments(batch));
      pendingMomentsRef.current = [];
    });

    return () => {
      cancelled = true;
      rendererRef.current = null;
      pendingMomentsRef.current = [];
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

  useEffect(() => {
    latestFinishPresentationRef.current = finishPresentation;
    rendererRef.current?.updateFinishPresentation(finishPresentation);
  }, [finishPresentation]);

  return <div ref={mountRef} className={cx("h-full w-full", className)} />;
}
