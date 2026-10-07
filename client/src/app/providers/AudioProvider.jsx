import { useEffect } from "react";

import { audioEngine } from "../../shared/audio";
import { GAME_AUDIO_MANIFEST } from "../../shared/gameAudio/gameAudioCatalog";
import useBrowserLifecycleEvents from "../../shared/hooks/useBrowserLifecycleEvents";
import { useAudioSettingsStore } from "../../stores/audioSettingsStore";

// The listeners stay after the first unlock: Safari can interrupt the context again, and only a gesture resumes it.
const UNLOCK_EVENTS = ["pointerup", "touchend", "click", "keydown"];
const LISTENER_OPTIONS = { capture: true };

function unlockOnGesture(event) {
  if (event.type === "keydown" && (event.repeat || event.key === "Escape")) return;
  audioEngine.unlock();
}

// Registered at import, not in an effect: child effects run first and must already find the keys.
audioEngine.register(GAME_AUDIO_MANIFEST);

const suspendAudio = () => audioEngine.suspend();
const resumeAudio = () => audioEngine.resume();

export default function AudioProvider({ children }) {
  useEffect(() => {
    const configure = (settings) => audioEngine.configure(settings);
    configure(useAudioSettingsStore.getState());
    return useAudioSettingsStore.subscribe(configure);
  }, []);

  useEffect(() => {
    UNLOCK_EVENTS.forEach((type) => window.addEventListener(type, unlockOnGesture, LISTENER_OPTIONS));
    return () => {
      UNLOCK_EVENTS.forEach((type) => window.removeEventListener(type, unlockOnGesture, LISTENER_OPTIONS));
    };
  }, []);

  useBrowserLifecycleEvents({ onHidden: suspendAudio, onVisible: resumeAudio });

  return children;
}
