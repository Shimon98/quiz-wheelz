import { TEACHER_RACE_PROJECTOR_ART } from "./teacherRaceProjectorArt";
import { TEACHER_RACE_VEHICLE_MANIFEST } from "./teacherRaceVehicleManifest";

const requestedUrls = new Set();

export function collectTeacherProjectorArtUrls() {
  const { backdrop, verge, signs, uiAccents } = TEACHER_RACE_PROJECTOR_ART;

  return [
    ...new Set([
      backdrop,
      verge,
      ...Object.values(signs),
      ...Object.values(uiAccents),
      ...Object.values(TEACHER_RACE_VEHICLE_MANIFEST),
    ]),
  ];
}

export function preloadTeacherProjectorArt() {
  for (const url of collectTeacherProjectorArtUrls()) {
    if (requestedUrls.has(url)) {
      continue;
    }

    requestedUrls.add(url);

    try {
      const image = new Image();
      image.decoding = "async";
      image.onerror = () => requestedUrls.delete(url);
      image.src = url;
    } catch {
      requestedUrls.delete(url);
    }
  }
}
