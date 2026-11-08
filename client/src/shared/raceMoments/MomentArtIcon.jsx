import { useState } from "react";

// A moment's painting, decorative: the words beside it say what happened. If its file does not load, the drawn icon
// the screen showed before the paintings comes back in its place (remembered per file, so new art still tries).
export default function MomentArtIcon({ art, className, fallback }) {
  const [failedArt, setFailedArt] = useState(null);

  if (!art || failedArt === art) {
    return fallback;
  }

  return (
    <img
      src={art}
      alt=""
      aria-hidden="true"
      draggable={false}
      decoding="async"
      className={className}
      onError={() => setFailedArt(art)}
    />
  );
}
