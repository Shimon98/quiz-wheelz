import { useEffect } from "react";

import { audioEngine } from "./audioEngine";

export default function useSceneMusic(key, gain) {
  useEffect(() => {
    if (key == null) return undefined;
    const owner = audioEngine.claimMusic(key, { gain });
    return () => audioEngine.releaseMusic(owner);
  }, [key, gain]);
}
